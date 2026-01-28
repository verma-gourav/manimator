import { Router } from "express";
import { getStoredJob, updateStoredJob } from "../../jobs/store/jobHelpers.js";
import fs from "fs";
import { pubClient } from "../../jobs/store/pubsub.js";
import { runManim } from "../../services/manim/manim.js";
import path from "path";
import { uploadFilesToS3 } from "../../services/s3/upload.js";
import { saveCodeToFile } from "../../utils/saveCode.js";
import { validateManimCode } from "../../utils/validate.js";

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

    // temp dir
    const jobDir = path.resolve(
      process.cwd(),
      "..",
      "generated",
      "jobs",
      jobId,
    );

    fs.mkdirSync(jobDir, { recursive: true });

    const { fileName, sceneName } = saveCodeToFile(code, jobDir);

    await pubClient.publish(
      `job-progress:${jobId}`,
      JSON.stringify({
        status: "processing",
        stage: "Rendering edited code",
        progress: 60,
      }),
    );

    const localVideoPath = await runManim(fileName, sceneName, jobDir);

    // Upload to S3 (overwrite same keys)
    const codeUrl = await uploadFilesToS3(
      path.join(jobDir, "scenes", fileName),
      `jobs/${jobId}/code.py`,
      "text/x-python",
    );

    const videoUrl = await uploadFilesToS3(
      localVideoPath,
      `jobs/${jobId}/video.mp4`,
      "video/mp4",
    );

    await updateStoredJob(jobId, {
      status: "completed",
      stage: "Finished",
      progress: 100,
      codePath: codeUrl,
      videoPath: videoUrl,
    });

    await pubClient.publish(
      `job-progress:${jobId}`,
      JSON.stringify({
        status: "completed",
        stage: "Finished",
        progress: 100,
      }),
    );

    // temp dir cleanup
    fs.rmSync(jobDir, { recursive: true, force: true });

    res.json({
      ok: true,
      codePath: codeUrl,
      videoPath: videoUrl,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      error: "Re-render failed",
      details: err.message,
    });
  }
});

export default router;
