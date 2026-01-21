import { AiOutlineSend } from "react-icons/ai";
import { useRef, useEffect } from "react";

interface Props {
  prompt: string;
  setPrompt: (v: string) => void;
  onSubmit: () => void;
}

export const PromptBar = ({ prompt, setPrompt, onSubmit }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* --- auto resize text-area height --- */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [prompt]);

  return (
    <div className="max-w-3xl mx-auto flex flex-wrap items-end gap-2 px-2 py-2 bg-input  rounded-3xl shadow-sm">
      <textarea
        ref={textareaRef}
        rows={1}
        className="flex-1 min-h-11 max-h-48 px-4 py-2 bg-transparent outline-none
                   text-lg text-orange placeholder:text-orange/40
                   resize-none overflow-hidden"
        placeholder="Create math animations..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />

      <button
        onClick={onSubmit}
        className="h-10 w-12 flex items-center justify-center rounded-full bg-orange transition
                   hover:bg-orange/90 active:scale-95"
      >
        <AiOutlineSend size={20} />
      </button>
    </div>
  );
};
