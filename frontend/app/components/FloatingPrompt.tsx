"use client";

import { PromptBar } from "@/app/components/PromptBar";

interface Props {
  prompt: string;
  setPrompt: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export const FloatingPrompt = ({
  prompt,
  setPrompt,
  onSubmit,
  placeholder,
}: Props) => {
  return (
    <div
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2
        w-full px-4 z-40"
    >
      <PromptBar
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={onSubmit}
        placeholder={placeholder}
      />
    </div>
  );
};
