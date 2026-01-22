"use client";

import { useState } from "react";
import { Logo } from "@/app/components/logo/Logo";
import { PromptBar } from "@/app/components/PromptBar";
import { TopBar } from "@/app/components/TopBar";
import { CodePanel } from "@/app/components/CodePanel";
import { VideoPanel } from "@/app/components/VideoPanel";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function GeneratePage() {
  const [mode, setMode] = useState<"idle" | "result">("idle");

  /* --- currently typing --- */
  const [draftPrompt, setDraftPrompt] = useState("");
  /* --- last submitted/generated --- */
  const [submittedPrompt, setSubmittedPrompt] = useState("");

  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const EXAMPLE_PROMPTS = [
    "Create a sine wave animation",
    "Visualize Pythagoras theorem",
    "Animate a rotating cube with axes",
    "Show Fourier series approximation",
  ];

  const handleSubmit = async () => {
    if (!draftPrompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/generate`, {
        prompt: draftPrompt,
      });

      const { jobId } = res.data;

      setSubmittedPrompt(draftPrompt);
      setDraftPrompt(""); // clear input after submit
      setJobId(jobId);
      setMode("result");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setSubmittedPrompt(example);
    setDraftPrompt(""); // empty result PromptBar
    setMode("result");
  };

  return (
    <main className="mx-20 my-4">
      {/* --- IDLE VIEW --- */}
      {mode === "idle" && (
        <div className="flex flex-col items-center">
          <Logo className="text-orange text-sm mt-35 mb-25" />

          <PromptBar
            prompt={draftPrompt}
            setPrompt={setDraftPrompt}
            onSubmit={handleSubmit}
          />

          <div className="flex flex-wrap gap-2 justify-center mt-10">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                onClick={() => {
                  handleExampleClick(example);
                }}
                className="rounded-full border bg-black/20 border-white/20
                 px-4 py-2 text-sm text-white/80 cursor-pointer
                hover:bg-white/5 hover:text-white active:scale-95 transition"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- RESULT VIEW --- */}
      {mode === "result" && (
        <>
          <div>
            <TopBar />
          </div>

          <div className="mt-12 h-[60vh] flex justify-between">
            <CodePanel />
            <VideoPanel />
          </div>

          <div className="mt-20">
            <PromptBar
              prompt={draftPrompt}
              setPrompt={setDraftPrompt}
              onSubmit={handleSubmit}
              placeholder="Try something else..."
            />
          </div>
        </>
      )}
    </main>
  );
}
