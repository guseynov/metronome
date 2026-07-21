import clsx from "clsx";

interface BeatTrackProps {
  activeBeat: number | null;
  beatsPerMeasure: number;
}

export function BeatTrack({ activeBeat, beatsPerMeasure }: BeatTrackProps) {
  const beats = Array.from({ length: beatsPerMeasure }, (_, index) => index);

  return (
    <div className="beat-track" aria-hidden="true">
      {beats.map((index) => (
        <span
          key={index}
          className={clsx(
            "beat-indicator",
            index === 0 && "beat-indicator-accent",
            activeBeat === index && "beat-indicator-active",
          )}
        />
      ))}
    </div>
  );
}
