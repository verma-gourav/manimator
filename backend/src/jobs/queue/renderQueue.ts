import { Redis } from "ioredis";
import { Queue } from "bullmq";

const redis = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

export interface RenderJob {
  jobId: string;
  prompt: string;
  jobDir: string;
}

export const renderQueue = new Queue<RenderJob>("render-queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});
