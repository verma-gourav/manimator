export const VideoPanel = () => {
  return (
    <div
      className="
        relative w-[40%] h-full rounded-2xl p-5
        border border-white/20 bg-box/50
      "
    >
      {/* Download button */}
      <button
        className="
          absolute top-4 right-4 px-3 py-1.5
          text-xs tracking-wide rounded-md
        text-black bg-white backdrop-blur
          hover:bg-white/90 cursor-pointer
          active:scale-95 transition
        "
      >
        DOWNLOAD
      </button>

      {/* Video area */}
      <div
        className="
          mt-10 h-[calc(100%-2.5rem)] rounded-xl
          border border-white/10
          bg-black/60 p-4 font-mono text-sm text-white/70
          overflow-auto whitespace-pre
        "
      >
        Video Area
      </div>
    </div>
  );
};
