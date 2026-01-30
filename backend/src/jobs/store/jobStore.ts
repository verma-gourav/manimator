import { Redis } from "ioredis";

export const jobStore = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
});

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface StoredJob {
  jobId: string;
  prompt: string;
  jobDir: string;

  status: JobStatus;
  progress: number;
  stage?: string;

  codePath?: string;
  videoPath?: string;
  error?: string;

  createdAt: number;
  updatedAt: number;
}
