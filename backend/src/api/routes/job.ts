import { Router } from "express";
import { getStoredJob } from "../../jobs/store/jobHelpers.js";
import fs from "fs";

const router = Router();

/* --- full job info --- */
router.get("/:jobId", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);

    res.json({
      jobId: job.jobId,
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch {
    res.status(404).json({ error: "Job not found" });
  }
});

/* --- final result metadata --- */
router.get("/:jobId/result", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);

    if (job.status !== "completed") {
      return res.status(400).json({
        error: "Job not completed",
        status: job.status,
        stage: job.stage,
        progress: job.progress,
      });
    }

    res.json({
      jobId: job.jobId,
      videoPath: job.videoPath,
      codePath: job.codePath,
    });
  } catch {
    res.status(404).json({ error: "Job not found" });
  }
});

/* --- code --- */
router.get("/:jobId/code", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);

    if (!job.codePath || !fs.existsSync(job.codePath)) {
      return res.status(404).json({ error: "Code not found" });
    }

    res.type("text/plain").send(fs.readFileSync(job.codePath, "utf-8"));
  } catch {
    res.status(404).json({ error: "Job not found" });
  }
});

/* --- video --- */
router.get("/:jobId/video", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);

    if (!job.videoPath || !fs.existsSync(job.videoPath)) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.sendFile(job.videoPath);
  } catch {
    res.status(404).json({ error: "Job not found" });
  }
});

router.get("/:jobId/video/download", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);

    if (!job.videoPath || !fs.existsSync(job.videoPath)) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.download(job.videoPath);
  } catch {
    res.status(404).json({ error: "Job not found" });
  }
});

export default router;
