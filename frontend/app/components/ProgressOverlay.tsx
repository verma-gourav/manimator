interface Props {
  status: string;
  stage?: string;
  progress: number;
}

const STEPS = 10;

export const ProgressOverlay = ({ status, stage, progress }: Props) => {
  const activeSteps = Math.round((progress / 100) * STEPS);

  return (
    <div
      className="
        absolute inset-0 z-50
        flex items-center justify-center
        bg-black/50 backdrop-blur-sm"
    >
      <div className="w-150 max-w-[90%] px-8 py-6 text-orange">
        {/* Status */}
        <div className="text-2xl">{status}</div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex gap-1">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div
                key={i}
                className={`
                  h-3 flex-1 rounded-xs transition-colors duration-300
                  ${i < activeSteps ? "bg-orange" : "bg-white/10"}
                `}
              />
            ))}
          </div>

          <div className="mt-2 flex justify-between text-white/50">
            <span>{stage}</span>
            <span>{`${progress}%`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
