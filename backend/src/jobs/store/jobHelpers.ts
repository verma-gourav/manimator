import { jobStore, StoredJob } from "./jobStore.js";

export const getStoredJob = async (jobId: string): Promise<StoredJob> => {
  const raw = await jobStore.get(`job:${jobId}`);
  if (!raw) throw new Error(`Job not found: ${jobId}`);

  return JSON.parse(raw);
};

export const saveStoredJob = async (job: StoredJob) => {
  await jobStore.set(
    `job:${job.jobId}`,
    JSON.stringify(job),
    "EX",
    60 * 60 * 24, // 24hr TTL
  );
};

export const updateStoredJob = async (
  jobId: string,
  patch: Partial<StoredJob>, // any subset of StoredJob
) => {
  const job = await getStoredJob(jobId);
  Object.assign(job, patch, { updatedAt: Date.now() });

  await saveStoredJob(job);
};
