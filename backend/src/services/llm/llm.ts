import { GoogleGenAI } from "@google/genai";
import { fewShotExamples, systemPrompt } from "./prompts.js";
import { validateManimCode } from "../../utils/validate.js";

const client = new GoogleGenAI({});

export const generateManimCode = async (prompt: string): Promise<string> => {
  let fewShotText = "";
  for (const ex of fewShotExamples) {
    fewShotText += `User input:\n${ex.user}\nAssistant output:\n${ex.assistant}`;
  }

  const userPrompt = `Create a Manim animation for the following request:
  ${prompt}
  The animation should be simple, clear, and educational.`;

  const finalPrompt = systemPrompt + "\n" + fewShotText + "\n" + userPrompt;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: finalPrompt,
  });

  const code = response.text;

  if (!code) throw new Error("No code returned");
  if (!validateManimCode(code))
    throw new Error("Generated code failed validation");

  return code;
};
