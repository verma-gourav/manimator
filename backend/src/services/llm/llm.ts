import { GoogleGenAI } from "@google/genai";
import { fewShotExamples, systemPrompt } from "./prompts.js";
import { validateManimCode } from "../../utils/validate.js";

const client = new GoogleGenAI({});

const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

const isQuotaError = (err: any) => {
  return (
    err?.status === 429 || // too many requests
    err?.status === 503 || // service unavailable
    err?.message?.includes("RESOURCE_EXHAUSTED") // gemini quota hit
  );
};

const generateWithModel = async (
  prompt: string,
  model: string,
): Promise<string> => {
  let fewShotText = "";
  for (const ex of fewShotExamples) {
    fewShotText += `User input:\n${ex.user}\nAssistant output:\n${ex.assistant}`;
  }

  const userPrompt = `Create a Manim animation for the following request:
  ${prompt}
  The animation should be simple, clear, and educational.`;

  const finalPrompt = systemPrompt + "\n" + fewShotText + "\n" + userPrompt;

  const response = await client.models.generateContent({
    model,
    contents: finalPrompt,
  });

  const code = response.text;

  if (!code) throw new Error("No code returned");
  if (!validateManimCode(code))
    throw new Error("Generated code failed validation");

  return code;
};

const generateWithModelRetry = async (
  prompt: string,
  model: string,
  maxRetries = 3,
  retryDelay = 3000,
): Promise<string> => {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateWithModel(prompt, model);
    } catch (err: any) {
      lastError = err;

      if (isQuotaError(err)) {
        // quota hit -> don't retry same model
        console.warn(
          `[LLM] Model ${model} quota hit or overload: ${err.message}`,
        );
        throw err;
      }

      // validation or transient error -> retry same model
      if (attempt < maxRetries - 1) {
        console.warn(
          `[LLM] Model ${model} failed (attempt ${attempt + 1}: ${err.message})`,
        );
        console.log(`[LLM] Retrying model ${model} after ${retryDelay}ms...`);
        await new Promise((r) => setTimeout(r, retryDelay));
      } else {
        console.error(
          `[LLM] Model ${model} failed after ${maxRetries} attempt`,
        );
      }
    }
  }

  throw lastError;
};

export const generateManimCode = async (prompt: string): Promise<string> => {
  let lastError: any;

  for (const model of MODELS) {
    try {
      return await generateWithModelRetry(prompt, model, 3, 3000);
    } catch (err: any) {
      lastError = err;

      if (!isQuotaError(err)) {
        // non quota errors stop the chain
        throw err;
      }

      console.warn(
        `[LLM] Model ${model} quota hit or overload. Trying another model...`,
      );
    }
  }

  // all models failed
  throw lastError;
};
