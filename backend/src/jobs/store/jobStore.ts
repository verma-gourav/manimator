import { Redis } from "ioredis";

export const jobStore = new Redis({
  host: "localhost",
  port: 6379,
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
