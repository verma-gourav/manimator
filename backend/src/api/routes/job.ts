import { Router } from "express";
import { getStoredJob, updateStoredJob } from "../../jobs/store/jobHelpers.js";
import fs from "fs";
import { pubClient } from "../../jobs/store/pubsub.js";
import { runManim } from "../../services/manim/manim.js";
import path from "path";

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

/* --- re-render --- */
router.post("/:jobId/rerender", async (req, res) => {
  try {
    const job = await getStoredJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (!job.codePath || !fs.existsSync(job.codePath)) {
      return res.status(404).json({ error: "Code not found" });
    }

    const code = req.body.code ?? fs.readFileSync(job.codePath, "utf-8");

    // save edited code
    fs.writeFileSync(job.codePath, code);

    const fileName = path.basename(job.codePath);
    const sceneName = path.parse(fileName).name;

    await pubClient.publish(
      `job-progress:${job.jobId}`,
      JSON.stringify({
        status: "processing",
        stage: "Rendering edited code",
        progress: 60,
      }),
    );

    const videoPath = await runManim(fileName, sceneName, job.jobDir);

    await updateStoredJob(job.jobId, {
      status: "completed",
      stage: "Finished",
      progress: 100,
      videoPath,
    });

    await pubClient.publish(
      `job-progress:${job.jobId}`,
      JSON.stringify({
        status: "completed",
        stage: "Finished",
        progress: 100,
      }),
    );

    res.json({ ok: true, videoPath });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
