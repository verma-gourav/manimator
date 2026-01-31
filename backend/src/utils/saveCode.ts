import path from "path";
import fs from "fs";

const extractedSceneClassName = (code: string): string | null => {
  const match = code.match(/class\s+([A-Za-z0-9]+)\s*\(\s*Scene\s*\)/);
  return match ? match[1] : null;
};

export const saveCodeToFile = (code: string, jobDir: string) => {
  const sceneName = extractedSceneClassName(code) || "GeneratedScene";

  const sceneDir = path.join(jobDir, "scenes");
  fs.mkdirSync(sceneDir, { recursive: true });

  const fileName = `${sceneName}.py`;
  const filePath = path.join(sceneDir, fileName);

  fs.writeFileSync(filePath, code, "utf-8");

  console.log("Saved scene file:", filePath);

  return { fileName, sceneName };
};
