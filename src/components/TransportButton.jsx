import clsx from "clsx";
import { Pause, Play } from "lucide-react";

function getTransportLabel(isPlaying) {
  if (isPlaying) {
    return "Stop";
  }

  return "Start";
}

function getTransportHint(isPlaying) {
  if (isPlaying) {
    return "Tap to pause playback";
  }

  return "Tap to begin playback";
}

function getTransportIconKind(isPlaying) {
  if (isPlaying) {
    return "pause";
  }

  return "play";
}

const buttonClass =
  "flex min-h-[80px] w-full items-center justify-between gap-4 rounded-[16px] border border-black/10 bg-[linear-gradient(180deg,#dff48c_0%,#b4ea63_100%)] px-4 py-4 text-[#15200f] transition duration-200 ease-out hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";

export function TransportButton({ isPlaying, onTogglePlayback }) {
  const label = getTransportLabel(isPlaying);
  const hint = getTransportHint(isPlaying);
  const iconKind = getTransportIconKind(isPlaying);
  let Icon = Play;

  if (iconKind === "pause") {
    Icon = Pause;
  }

  return (
    <button
      type="button"
      className={clsx(buttonClass)}
      onClick={onTogglePlayback}
      aria-pressed={isPlaying}
    >
      <span className="grid gap-1 text-left">
        <span className="text-[1.1rem] font-extrabold leading-none">{label}</span>
        <span className="text-[0.84rem] leading-5 text-[rgba(21,32,15,0.76)]">
          {hint}
        </span>
      </span>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(21,32,15,0.08)] shadow-[inset_0_0_0_1px_rgba(21,32,15,0.08)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </button>
  );
}
