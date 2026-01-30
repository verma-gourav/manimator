import { Queue, Worker } from "bullmq";
import { s3 } from "./s3Client.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

export const s3CleanupQueue = new Queue("s3CleanupQueue", { connection });

const worker = new Worker(
  s3CleanupQueue.name,
  async (job) => {
    const keys: string[] = job.data.keys || [];
    for (const key of keys) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
          }),
        );
        console.log(`[S3 Cleanup] Deleted: ${key}`);
      } catch (err) {
        console.error(`[S3 Cleanup] Failed to delete ${key}:`, err);
      }
    }
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`[S3 Cleanup] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[S3 Cleanup] Job ${job?.id} failed:`, err);
});
