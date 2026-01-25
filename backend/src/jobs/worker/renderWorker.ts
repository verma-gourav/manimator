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

/* --- worker --- */
const worker = new Worker(
  renderQueue.name,
  async (job: Job<RenderJob>) => {
    const { jobId, prompt, jobDir } = job.data;

    fs.mkdirSync(jobDir, { recursive: true });
    await report(jobId, 10, "processing", "Initializing job");

    let manimCode: string;
    try {
      await report(jobId, 20, "processing", "Generating code");
      manimCode = await generateManimCode(prompt);
      await report(jobId, 40, "processing", "Code generated");
    } catch (err: any) {
      await updateStoredJob(jobId, {
        status: "failed",
        error: err.message,
        progress: 0,
      });

      await publish(jobId, {
        status: "failed",
        error: err.message,
        progress: 0,
      });

      throw err; // fail the job
    }

    const { fileName, sceneName } = saveCodeToFile(manimCode, jobDir);
    await report(jobId, 60, "processing", "Saving Code");

    try {
      const videoPath = await runManim(fileName, sceneName, jobDir);
      await report(jobId, 90, "processing", "Rendering video");

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
      await updateStoredJob(jobId, {
        status: "failed",
        error: err.message,
        progress: 90,
      });
      await publish(jobId, {
        status: "failed",
        error: err.message,
        progress: 90,
      });

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

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed: ${err.message}`);
});
