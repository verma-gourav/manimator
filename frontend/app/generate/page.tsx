"use client";

import { useState } from "react";
import { PromptBar } from "@/app/components/PromptBar";
import { CodePanel } from "../components/CodePanel";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const handleSubmit = () => {};

  return (
    <div className="ml-20 h-[70vh] mt-[10vh]">
      {/* <PromptBar
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={handleSubmit}
      /> */}
      <CodePanel />
    </div>
  );
}
