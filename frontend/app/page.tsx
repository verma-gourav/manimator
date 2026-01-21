"use client";

import { useState } from "react";
import { PromptBar } from "./components/PromptBar";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const handleSubmit = () => {};

  return (
    <div className="mt-[40vh]">
      <PromptBar
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
