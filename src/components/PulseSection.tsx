import { BeatTrack } from "./BeatTrack";
import { TransportButton } from "./TransportButton";

interface PulseSectionProps {
  activeBeat: number | null;
  beatsPerMeasure: number;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  playbackError: string | null;
}

export function PulseSection({
  activeBeat,
  beatsPerMeasure,
  isPlaying,
  onTogglePlayback,
  playbackError,
}: PulseSectionProps) {
  const pulseLabel = playbackError
    ? "Audio unavailable"
    : isPlaying
      ? "Counting"
      : "Ready";

  return (
    <section className="transport-deck" aria-label="Playback controls">
      <div className="pulse-display">
        <span
          className={`pulse-label ${playbackError ? "pulse-label-error" : ""}`}
          aria-live="polite"
          role={playbackError ? "alert" : undefined}
        >
          {pulseLabel}
        </span>
        {playbackError ? (
          <span className="playback-error-detail">
            Sound could not be loaded. Press Start to try again.
          </span>
        ) : null}
        <BeatTrack activeBeat={activeBeat} beatsPerMeasure={beatsPerMeasure} />
      </div>
      <TransportButton isPlaying={isPlaying} onTogglePlayback={onTogglePlayback} />
    </section>
  );
}
