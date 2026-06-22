import { BeatTrack } from "./BeatTrack";
import { TransportButton } from "./TransportButton";

function getPulseLabel(isPlaying) {
  if (isPlaying) {
    return "Accent on beat one";
  }

  return "Ready to start";
}

export function PulseSection({
  activeBeat,
  beatsPerMeasure,
  isPlaying,
  onTogglePlayback,
}) {
  const pulseLabel = getPulseLabel(isPlaying);

  return (
    <section
      className="grid gap-3 rounded-[18px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_100%),var(--panel)] p-4"
      aria-labelledby="pulse-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          className="m-0 text-[0.92rem] font-bold tracking-[-0.02em] text-[var(--text)]"
          id="pulse-heading"
        >
          Pulse
        </h2>
        <p className="m-0 text-[0.86rem] text-[var(--text-muted)]">{pulseLabel}</p>
      </div>

      <BeatTrack activeBeat={activeBeat} beatsPerMeasure={beatsPerMeasure} />

      <TransportButton
        isPlaying={isPlaying}
        onTogglePlayback={onTogglePlayback}
      />
    </section>
  );
}
