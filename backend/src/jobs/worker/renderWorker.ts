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

/* --- llm call with retry --- */
const generateWithRetry = async (
  prompt: string,
  maxRetries = 3,
): Promise<string> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return generateManimCode(prompt);
    } catch (err: any) {
      if (err?.status === 503 && i < maxRetries - 1) {
        console.warn(
          `[worker] LLM API overloaded, retrying in 5s...(attempt ${i + 1})`,
        );
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Failed to generate code after retries");
};

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

    const manimCode = await generateWithRetry(prompt);
    await report(jobId, 40, "processing", "Generating Code");

    const { fileName, sceneName } = saveCodeToFile(manimCode, jobDir);
    await report(jobId, 60, "processing", "Saving Code");

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
