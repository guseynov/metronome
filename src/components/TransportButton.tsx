import { Pause, Play } from "lucide-react";

interface TransportButtonProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
}

export function TransportButton({
  isPlaying,
  onTogglePlayback,
}: TransportButtonProps) {
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
