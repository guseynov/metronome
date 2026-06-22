import { useState } from "react";
import "./App.css";
import { MetronomeHeader } from "./components/MetronomeHeader";
import { MeterDisplay } from "./components/MeterDisplay";
import { MeasureControls } from "./components/MeasureControls";
import { PulseSection } from "./components/PulseSection";
import { TempoControls } from "./components/TempoControls";
import { useMetronomePlayback } from "./useMetronomePlayback";

const MIN_BPM = 40;
const MAX_BPM = 220;
const DEFAULT_BPM = 100;
const BEAT_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function App() {
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const { activeBeat, isPlaying, lastBeatType, pulseTick, togglePlayback } =
    useMetronomePlayback({ bpm, beatsPerMeasure });

  const handleTempoInput = (event) => {
    const nextValue = Number(event.target.value);
    setBpm(clamp(nextValue, MIN_BPM, MAX_BPM));
  };

  const handleStepTempo = (delta) => {
    setBpm((currentValue) => clamp(currentValue + delta, MIN_BPM, MAX_BPM));
  };

  const handleSelectBeatsPerMeasure = (nextBeatsPerMeasure) => {
    setBeatsPerMeasure(nextBeatsPerMeasure);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_18%_0%,rgba(168,239,113,0.1),transparent_28rem),radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.04),transparent_24rem),linear-gradient(180deg,#050708_0%,#020304_100%)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-10">
      <section className="relative w-full max-w-[900px] overflow-hidden rounded-[20px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_24%),linear-gradient(180deg,#161c19_0%,#101613_100%)] p-4 before:pointer-events-none before:absolute before:inset-3 before:rounded-[16px] before:border before:border-white/5 before:content-[''] sm:p-6">
        <MetronomeHeader />

        <MeterDisplay
          bpm={bpm}
          beatsPerMeasure={beatsPerMeasure}
          isPlaying={isPlaying}
          lastBeatType={lastBeatType}
          pulseTick={pulseTick}
        />

        <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
          <TempoControls
            bpm={bpm}
            maxBpm={MAX_BPM}
            minBpm={MIN_BPM}
            onStepTempo={handleStepTempo}
            onTempoInput={handleTempoInput}
          />
          <MeasureControls
            beatsPerMeasure={beatsPerMeasure}
            options={BEAT_OPTIONS}
            onSelectBeatsPerMeasure={handleSelectBeatsPerMeasure}
          />
        </div>

        <PulseSection
          activeBeat={activeBeat}
          beatsPerMeasure={beatsPerMeasure}
          isPlaying={isPlaying}
          onTogglePlayback={togglePlayback}
        />
      </section>
    </main>
  );
}
