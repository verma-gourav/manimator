import { Router } from "express";
import { getStoredJob, updateStoredJob } from "../../jobs/store/jobHelpers.js";
import fs from "fs";
import path from "path";
import { validateManimCode } from "../../utils/validate.js";
import { renderQueue } from "../../jobs/queue/renderQueue.js";

const router = Router();

/* --- full job info --- */
router.get("/:jobId", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);

    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json({
      jobId: job.jobId,
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* --- final result metadata --- */
router.get("/:jobId/result", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);

    if (!job) return res.status(404).json({ error: "Job not found" });

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
    res.status(500).json({ error: "Internal server error" });
  }
});

/* --- code --- */
router.get("/:jobId/code", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);
    if (!job || !job.codePath)
      return res.status(404).json({ error: "Code not found" });

    // proxy request to S3 (ideally the code should be served directly from S3 + CloundFront with proper CORS)
    const response = await fetch(job.codePath);
    const code = await response.text();

    res.type("text/plain").send(code);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* --- video --- */
router.get("/:jobId/video", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);
    if (!job || !job.videoPath) {
      return res.status(404).json({ error: "Video not found" });
    }

    // redirect to S3 url
    res.redirect(job.videoPath);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* --- video download --- */
router.get("/:jobId/video/download", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);
    if (!job || !job.videoPath) {
      return res.status(404).json({ error: "Video not found" });
    }

    // redirect download to S3 url
    res.redirect(job.videoPath);
  } catch {
    res.status(404).json({ error: "Job not found" });
  }
});

/* --- re-render --- */
router.post("/:jobId/rerender", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code is required" });
    }

    if (!validateManimCode(code)) {
      return res.status(400).json({ error: "Invalid Manim code" });
    }

    const job = await getStoredJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const jobDir = path.resolve("/data/jobs", jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    await updateStoredJob(jobId, {
      status: "processing",
      stage: "Queued for re-render",
      progress: 10,
    });

    await renderQueue.add(`rerender-${jobId}-${Date.now()}`, {
      jobId,
      prompt: "manual-edit",
      jobDir,
      customCode: code, // edited code
    });

    res.json({ ok: true, status: "queued" });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      error: "Re-render failed",
      details: err.message,
    });
  }
});

export default router;
