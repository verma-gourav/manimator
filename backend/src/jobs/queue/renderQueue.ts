import { Redis } from "ioredis";
import { Queue } from "bullmq";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
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
