/* --- code validation --- */
export const validateManimCode = (code: string): boolean => {
  const hasScene = /class\s+\w+\s*\(\s*Scene\s*\)\s*:/.test(code);
  const banned = ["import os", "import sys", "subprocess", "socket"];
  const hasBanned = banned.some((kw) => code.includes(kw));
  return hasScene && !hasBanned;
};
