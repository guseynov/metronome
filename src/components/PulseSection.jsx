import { BeatTrack } from "./BeatTrack";
import { TransportButton } from "./TransportButton";

export function PulseSection({
  activeBeat,
  beatsPerMeasure,
  isPlaying,
  onTogglePlayback,
  playbackError,
}) {
  const pulseLabel = playbackError
    ? "Audio unavailable"
    : isPlaying
      ? "Counting"
      : "Ready";

  return (
    <section className="transport-deck" aria-label="Playback controls">
      <div className="pulse-display">
        <span className="pulse-label" aria-live="polite">
          {pulseLabel}
        </span>
        <BeatTrack activeBeat={activeBeat} beatsPerMeasure={beatsPerMeasure} />
      </div>
      <TransportButton isPlaying={isPlaying} onTogglePlayback={onTogglePlayback} />
    </section>
  );
}
