import { Job, Worker } from "bullmq";
import { generateManimCode } from "../../services/llm/llm.js";
import { updateStoredJob } from "../store/jobHelpers.js";
import { JobStatus } from "../store/jobStore.js";
import { pubClient } from "../store/pubsub.js";
import { RenderJob, renderQueue } from "../queue/renderQueue.js";
import fs from "fs";
import { saveCodeToFile } from "../../utils/saveCode.js";
import { runManim } from "../../services/manim/manim.js";
import path from "node:path";

/* --- publish helper --- */
const publish = async (jobId: string, payload: any) => {
  await pubClient.publish(`job-progress:${jobId}`, JSON.stringify(payload));
};

/* --- job report --- */
const report = async (
  jobId: string,
  progress: number,
  status: JobStatus,
  stage: string,
) => {
  await updateStoredJob(jobId, { progress, status, stage });
  await publish(jobId, { progress, status, stage });
};

/* --- retry report --- */
const reportRetry = async (
  jobId: string,
  attempt: number,
  maxAttempts: number,
  reason: string,
) => {
  const stage = `Retrying (${attempt + 1}/${maxAttempts}) - ${reason}`;

  await updateStoredJob(jobId, {
    status: "processing",
    stage,
    progress: 5,
  });

  await publish(jobId, {
    status: "processing",
    stage,
    progress: 5,
  });
};

/* --- worker --- */
const worker = new Worker(
  renderQueue.name,
  async (job: Job<RenderJob>) => {
    const { jobId, prompt, jobDir } = job.data;

    const attempt = job.attemptsMade;
    const maxAttempts = job.opts.attempts ?? 1;

    fs.mkdirSync(jobDir, { recursive: true });
    await report(jobId, 10, "processing", "Initializing job");

    let manimCode: string;
    try {
      await report(jobId, 20, "processing", "Generating code");
      manimCode = await generateManimCode(prompt);
      await report(jobId, 40, "processing", "Code generated");
    } catch (err: any) {
      if (attempt < maxAttempts - 1) {
        await reportRetry(
          jobId,
          attempt,
          maxAttempts,
          err.message || "Code generation failed",
        );
      }

      throw err; // fail the job
    }

    await report(jobId, 60, "processing", "Saving Code");
    const { fileName, sceneName } = saveCodeToFile(manimCode, jobDir);

    try {
      await report(jobId, 90, "processing", "Rendering video");
      const videoPath = await runManim(fileName, sceneName, jobDir);

      await updateStoredJob(jobId, {
        progress: 100,
        status: "completed",
        stage: "Finished",
        codePath: path.join(jobDir, "scenes", fileName),
        videoPath,
      });

      await publish(jobId, {
        progress: 100,
        status: "completed",
        stage: "Finished",
      });

      return true;
    } catch (err: any) {
      if (attempt < maxAttempts - 1) {
        await reportRetry(
          jobId,
          attempt,
          maxAttempts,
          err.message || "Rendering failed",
        );
      }
      throw err;
    }
  },
  {
    connection: renderQueue.opts.connection,
    concurrency: 1, // 1 docker render at a time per worker
  },
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed successfully`);
});

worker.on("failed", async (job, err) => {
  if (!job) return;

  const attempts = job.opts.attempts ?? 1;
  const attemptsMade = job.attemptsMade;

  // marks failed if retries are exhausted
  if (attemptsMade < attempts) {
    return;
  }

  await updateStoredJob(job.data.jobId, {
    status: "failed",
    progress: 100,
    stage: "Failed",
    error: err.message,
  });

  await pubClient.publish(
    `job-progress:${job.data.jobId}`,
    JSON.stringify({
      status: "failed",
      progress: 100,
      stage: "Failed",
      error: err.message,
    }),
  );

  console.error(`[worker] Job ${job?.id} failed: ${err.message}`);
});
