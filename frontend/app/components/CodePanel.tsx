export const CodePanel = ({
  code,
  setCode,
  onRerender,
}: {
  code: string | null;
  setCode: (code: string) => void;
  onRerender: () => void;
}) => {
  return (
    <div
      className="
        relative w-[48%] h-full rounded-2xl p-5
        border border-white/20 bg-box/50 
      "
    >
      {/* Re-render button */}
      <button
        className="
          absolute top-4 right-4 px-3 py-1.5
          text-sm tracking-wide rounded-md
        text-black bg-white backdrop-blur
          hover:bg-white/90 cursor-pointer
          active:scale-95 transition
        "
        onClick={onRerender}
      >
        RE-RENDER
      </button>

      {/* Inner code area */}
      <textarea
        value={code ?? ""}
        placeholder="Waiting for generated code..."
        onChange={(e) => setCode(e.target.value)}
        className="
          mt-10 h-[calc(100%-2.5rem)] rounded-xl
          border border-white/10 w-full outline-none
          bg-black/60 p-4 font-mono text-sm text-white/70
           whitespace-pre overflow-auto scrollbar-dark resize-none
        "
      />
    </div>
  );
};
