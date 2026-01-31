import fs from "fs";
import path from "path";

/* --- Scans /data/jobs and removes folders older than maxAgeMs --- */
export const runJanitor = (maxAgeMs: number = 3600000) => {
  const jobsDir = "/data/jobs";

  if (!fs.existsSync(jobsDir)) return;

  const now = Date.now();
  const folders = fs.readdirSync(jobsDir);

  folders.forEach((folder) => {
    const fullPath = path.join(jobsDir, folder);
    try {
      const stats = fs.statSync(fullPath);
      const age = now - stats.mtimeMs;

      if (age > maxAgeMs) {
        console.log(
          `[Janitor] Removing abandoned folder: ${folder} (Age: ${Math.round(age / 60000)} mins)`,
        );
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    } catch (err) {
      // Handle cases where file might be deleted by worker mid-scan
      console.error(`[Janitor] Could not process ${folder}:`, err);
    }
  });
};
