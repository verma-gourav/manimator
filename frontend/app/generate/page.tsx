"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/app/components/logo/Logo";
import { PromptBar } from "@/app/components/PromptBar";
import { TopBar } from "@/app/components/TopBar";
import { CodePanel } from "@/app/components/CodePanel";
import { VideoPanel } from "@/app/components/VideoPanel";
import { ProgressOverlay } from "@/app/components/ProgressOverlay";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL;

/* --- Types --- */
type JobState = {
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  stage?: string;
};

/* --- Page --- */
export default function GeneratePage() {
  const [mode, setMode] = useState<"idle" | "result">("idle");

  /* --- currently typing --- */
  const [draftPrompt, setDraftPrompt] = useState("");
  /* --- last submitted/generated --- */
  const [submittedPrompt, setSubmittedPrompt] = useState("");

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<JobState | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const EXAMPLE_PROMPTS = [
    "Create a sine wave animation",
    "Visualize Pythagoras theorem",
    "Animate a rotating cube with axes",
    "Show Fourier series approximation",
  ];

  /* --- submit prompt --- */
  const handleSubmit = async (promptOverride?: string) => {
    const promptToSubmit = promptOverride ?? draftPrompt;
    if (!promptToSubmit.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/generate`, {
        prompt: promptToSubmit,
      });

      const { jobId } = res.data;

      setSubmittedPrompt(promptToSubmit);
      setDraftPrompt(""); // clear input after submit
      setJobId(jobId);
      setJobState({
        status: "queued",
        progress: 0,
        stage: "Queued",
      });
      setMode("result");

      // reset
      setCode(null);
      setVideoUrl(null);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* --- fetch code --- */
  const fetchCode = async (jobId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/job/${jobId}/code`, {
        responseType: "text",
      });
      setCode(res.data);
    } catch (err) {
      console.error("Failed to fetch code", err);
    }
  };

  /* --- rerender edited code --- */
  const handleRerender = async () => {
    if (!jobId || !code) return;

    try {
      setJobState({
        status: "processing",
        progress: 60,
        stage: "Rendering edited code",
      });

      await axios.post(`${API_BASE}/job/${jobId}/rerender`, {
        code,
      });
    } catch (err) {
      console.error(err);
      setJobState({
        status: "failed",
        progress: jobState?.progress ?? 0,
        stage: "Failed",
      });
      setError("Failed to rerender code");
    }
  };

  /* --- ws: job progress --- */
  useEffect(() => {
    if (!jobId) return;

    const ws = new WebSocket(`${WS_BASE}/?jobId=${jobId}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setJobState(data);
    };

    ws.onerror = (err) => {
      console.error("WebSocker error", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [jobId]);

  /* --- code & video --- */
  useEffect(() => {
    if (!jobId || jobState?.status !== "completed") return;

    fetchCode(jobId);
    setVideoUrl(`${API_BASE}/job/${jobId}/video?ts=${Date.now()}`);
  }, [jobState?.status, jobId]);

  /* --- failed status --- */
  useEffect(() => {
    if (jobState?.status === "failed") {
      setError("Job failed. Please try again.");
      setMode("idle");
      setJobId(null);
      setCode(null);
      setVideoUrl(null);
    }
  }, [jobState]);

  /* --- render --- */
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

          {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}

          <div className="flex flex-wrap gap-2 justify-center mt-10">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                onClick={() => {
                  handleSubmit(example);
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
            <CodePanel
              code={code}
              setCode={setCode}
              onRerender={handleRerender}
            />
            <VideoPanel videoUrl={videoUrl} />
          </div>

          {/* Progress Overlay */}
          {jobState && jobState.status === "processing" && (
            <ProgressOverlay
              status={jobState.status}
              stage={jobState.stage}
              progress={jobState.progress}
            />
          )}

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
