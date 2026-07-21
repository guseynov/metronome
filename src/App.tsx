import { useEffect, useState } from "react";
import "./App.css";
import { MetronomeHeader } from "./components/MetronomeHeader";
import { MeterDisplay } from "./components/MeterDisplay";
import { MeasureControls } from "./components/MeasureControls";
import { PulseSection } from "./components/PulseSection";
import { TempoControls } from "./components/TempoControls";
import { clamp } from "./tempo";
import { useMetronomePlayback } from "./useMetronomePlayback";

const MIN_BPM = 40;
const MAX_BPM = 220;
const DEFAULT_BPM = 100;
const BEAT_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

export default function App() {
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const {
    activeBeat,
    isPlaying,
    lastBeatType,
    playbackError,
    pendulumDurationMs,
    pulseTick,
    togglePlayback,
  } = useMetronomePlayback({ bpm, beatsPerMeasure });

  const handleTempoChange = (nextValue: number) => {
    setBpm(clamp(Math.round(nextValue), MIN_BPM, MAX_BPM));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) {
        return;
      }

      const target = event.target;
      const isControl =
        target instanceof HTMLButtonElement ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isControl) {
        return;
      }

      event.preventDefault();
      togglePlayback();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayback]);

  return (
    <main className="studio">
      <h1 className="sr-only">Mechanical metronome</h1>

      <section
        className={`instrument ${isPlaying ? "is-playing" : ""}`}
        aria-label="Mechanical metronome controls"
      >
        <div className="instrument-top">
          <MetronomeHeader />
          <MeterDisplay
            bpm={bpm}
            beatsPerMeasure={beatsPerMeasure}
            isPlaying={isPlaying}
            lastBeatType={lastBeatType}
            maxBpm={MAX_BPM}
            minBpm={MIN_BPM}
            onTempoChange={handleTempoChange}
            pendulumDurationMs={pendulumDurationMs}
            pulseTick={pulseTick}
          />
        </div>

        <div className="instrument-base">
          <div className="control-deck">
            <TempoControls
              bpm={bpm}
              maxBpm={MAX_BPM}
              minBpm={MIN_BPM}
              onTempoChange={handleTempoChange}
            />
            <MeasureControls
              beatsPerMeasure={beatsPerMeasure}
              options={BEAT_OPTIONS}
              onSelectBeatsPerMeasure={setBeatsPerMeasure}
            />
          </div>

          <PulseSection
            activeBeat={activeBeat}
            beatsPerMeasure={beatsPerMeasure}
            isPlaying={isPlaying}
            onTogglePlayback={togglePlayback}
            playbackError={playbackError}
          />
        </div>
      </section>

      <p className="keyboard-hint">
        <kbd>Space</kbd>
        <span>start / stop</span>
      </p>
    </main>
  );
}
