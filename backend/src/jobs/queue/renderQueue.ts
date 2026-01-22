import { Redis } from "ioredis";
import { Queue } from "bullmq";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
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
