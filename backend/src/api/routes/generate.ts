import { Router } from "express";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { jobStore } from "../../jobs/store/jobStore.js";
import { renderQueue } from "../../jobs/queue/renderQueue.js";
import fs from "fs";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const jobId = uuidv4(); // unique job id

    const jobDir = path.resolve("/data/jobs", jobId);
    console.log("Creating jobDir at:", jobDir);
    fs.mkdirSync(jobDir, { recursive: true });

    const jobData = {
      jobId,
      prompt,
      jobDir,
      status: "queued",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await jobStore.set(`job:${jobId}`, JSON.stringify(jobData));

    await renderQueue.add(
      jobId,
      { prompt, jobDir, jobId },
      { jobId, attempts: 3, backoff: 5000 },
    );

    res.status(200).json({ status: "queued", jobId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
