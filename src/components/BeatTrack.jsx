import clsx from "clsx";

export function BeatTrack({ activeBeat, beatsPerMeasure }) {
  const beatIndicators = Array.from({ length: beatsPerMeasure }, (_, index) => ({
    index,
    kind: index === 0 ? "accent" : "regular",
  }));

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-hidden="true">
      {beatIndicators.map(({ index, kind }) => {
        const isActive = activeBeat === index;

        return (
          <span
            key={index}
            className={clsx(
              "grid min-h-11 grid-cols-[auto_1fr] items-center gap-2 rounded-xl border border-transparent bg-white/[0.025] px-3 transition duration-150 ease-out",
              kind === "accent" && "bg-[rgba(168,239,113,0.04)]",
              isActive && "border-[rgba(168,239,113,0.22)] bg-[rgba(168,239,113,0.1)]",
            )}
          >
            <span
              className={clsx(
                "min-w-3 text-[0.78rem] font-bold leading-none",
                isActive ? "text-[var(--text)]" : "text-[var(--text-muted)]",
              )}
            >
              {index + 1}
            </span>
            <span
              className={clsx(
                "h-2 rounded-full",
                isActive && "bg-[var(--accent)] shadow-[0_0_12px_rgba(168,239,113,0.3)]",
                !isActive && kind === "accent" && "bg-[rgba(168,239,113,0.22)]",
                !isActive && kind !== "accent" && "bg-white/15",
              )}
            />
          </span>
        );
      })}
    </div>
  );
}
