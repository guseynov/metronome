import clsx from "clsx";

function getStatusLabel(isPlaying, bpm, beatsPerMeasure) {
  if (!isPlaying) {
    return "Stopped";
  }

  return `Playing at ${bpm} BPM in ${beatsPerMeasure}/4`;
}

export function MeterDisplay({ bpm, beatsPerMeasure, isPlaying, lastBeatType, pulseTick }) {
  const statusLabel = getStatusLabel(isPlaying, bpm, beatsPerMeasure);
  const statusDotClass = clsx(
    "h-[11px] w-[11px] rounded-full shadow-[inset_0_0_0_1px_rgba(19,24,19,0.18)]",
    !isPlaying && "bg-[rgba(19,24,19,0.24)]",
    isPlaying && lastBeatType === "accent" && "bg-[var(--accent)] shadow-[0_0_14px_rgba(168,239,113,0.55)]",
    isPlaying && lastBeatType !== "accent" && "bg-[rgba(19,24,19,0.5)] shadow-[0_0_10px_rgba(19,24,19,0.35)]",
  );

  return (
    <div
      className="relative mb-3 rounded-[16px] border border-[rgba(19,24,19,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent_100%),linear-gradient(180deg,#c9d8c2_0%,#b7c8b0_100%)] px-4 py-4 text-[#182019]"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-[rgba(19,24,19,0.08)]" />
      <div className="relative flex items-baseline gap-3 font-mono leading-none tabular-nums">
        <span className="text-[clamp(2.85rem,8vw,4.5rem)] font-bold tracking-[0.02em]">
          {bpm}
        </span>
        <span className="text-[clamp(0.95rem,2vw,1.15rem)] font-bold uppercase tracking-[0.12em]">
          BPM
        </span>
      </div>
      <p className="relative mt-1.5 flex items-center gap-2 text-[0.86rem] font-semibold text-[rgba(19,24,19,0.85)]">
        <span
          key={`${lastBeatType}-${pulseTick}`}
          className={statusDotClass}
          aria-hidden="true"
        />
        {statusLabel}
      </p>
    </div>
  );
}
