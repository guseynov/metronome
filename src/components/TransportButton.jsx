import { Pause, Play } from "lucide-react";

export function TransportButton({ isPlaying, onTogglePlayback }) {
  const Icon = isPlaying ? Pause : Play;

  return (
    <button
      type="button"
      className={`transport-button ${isPlaying ? "transport-button-active" : ""}`}
      onClick={onTogglePlayback}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? "Stop metronome" : "Start metronome"}
    >
      <span className="transport-icon">
        <Icon aria-hidden="true" />
      </span>
      <span>{isPlaying ? "Stop" : "Start"}</span>
    </button>
  );
}
