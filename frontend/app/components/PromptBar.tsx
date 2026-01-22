import { AiOutlineSend } from "react-icons/ai";
import { useRef, useEffect } from "react";

interface Props {
  prompt: string;
  setPrompt: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export const PromptBar = ({
  prompt,
  setPrompt,
  onSubmit,
  placeholder = "Create math animations...",
}: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* --- auto resize text-area height --- */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [prompt]);

  return (
    <div
      className="
        w-3/4 max-w-3xl mx-auto
        flex items-end gap-2 px-4 py-3
        bg-box/50 backdrop-blur-lg rounded-3xl shadow-sm border border-white/20
        max-sm:w-[80%] max-sm:rounded-xl smax-sm:px-3
      "
    >
      <textarea
        ref={textareaRef}
        rows={1}
        className="
          flex-1 min-h-11 max-h-48 px-4 py-2
          outline-none resize-none overflow-hidden
          text-xl text-orange placeholder:text-orange/50
          max-sm:text-base max-sm:px-3
        "
        placeholder={placeholder}
        value={prompt}
        spellCheck={false}
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
        className="
          h-10 w-12 flex items-center justify-center
          rounded-full bg-orange transition 
          hover:bg-orange/90 active:scale-95
          max-sm:h-9 max-sm:w-10
        "
      >
        <AiOutlineSend size={18} />
      </button>
    </div>
  );
};
