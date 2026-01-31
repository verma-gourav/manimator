import { spawn } from "child_process";

export const runManim = (
  sceneFile: string,
  sceneName: string,
  jobDir: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const args = [
      "run",
      "--rm",
      "--cpus=2",
      "--memory=2g",
      "--network=none",
      "-v",
      `${jobDir}:/manim`,
      "manimcommunity/manim:v0.19.1",
      "bash",
      "-c",
      `ls -la /manim/scenes && manim scenes/${sceneFile}`,
      "-qm",
    ];

    const docker = spawn("docker", args);

    docker.stdout.on("data", (data) => console.log(`[manim]: ${data}`));

    docker.stderr.on("data", (data) => console.error(`[manim]: ${data}`));

    docker.on("close", (code) => {
      if (code == 0) {
        resolve(`${jobDir}/media/videos/${sceneName}/720p30/${sceneName}.mp4`);
      } else {
        reject(new Error(`Manim failed with code ${code}`));
      }
    });
  });
};
