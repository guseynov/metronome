import { useMemo, useState } from "react";
import "./App.css";
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

  const beatIndicators = useMemo(
    () =>
      Array.from({ length: beatsPerMeasure }, (_, index) => ({
        index,
        kind: index === 0 ? "accent" : "regular",
      })),
    [beatsPerMeasure],
  );

  const handleTempoInput = (event) => {
    const nextValue = Number(event.target.value);
    setBpm(clamp(nextValue, MIN_BPM, MAX_BPM));
  };

  const handleStepTempo = (delta) => {
    setBpm((currentValue) => clamp(currentValue + delta, MIN_BPM, MAX_BPM));
  };

  const statusLabel = isPlaying
    ? `Running at ${bpm} beats per minute in ${beatsPerMeasure}/4`
    : "Stopped";

  return (
    <main className="app-shell">
      <section className="metronome" aria-labelledby="metronome-title">
        <header className="metronome__header">
          <h1 className="metronome__title" id="metronome-title">
            Metronome
          </h1>
        </header>

        <div className="meter" aria-live="polite" aria-atomic="true">
          <div className="meter__display">
            <span className="meter__value">{bpm}</span>
            <span className="meter__unit">BPM</span>
          </div>
          <p className="meter__status">
            <span
              key={`${lastBeatType}-${pulseTick}`}
              className={`meter__status-light meter__status-light--${lastBeatType} ${
                isPlaying ? "is-active" : ""
              }`}
              aria-hidden="true"
            />
            {statusLabel}
          </p>
        </div>

        <div className="controls-grid">
          <section className="control-panel" aria-labelledby="tempo-heading">
            <div className="control-panel__header">
              <h2 id="tempo-heading">Tempo</h2>
              <div className="stepper" aria-label="Tempo adjustments">
                <button type="button" onClick={() => handleStepTempo(-1)}>
                  -1
                </button>
                <button type="button" onClick={() => handleStepTempo(1)}>
                  +1
                </button>
              </div>
            </div>

            <label className="sr-only" htmlFor="tempo">
              Tempo in beats per minute
            </label>
            <input
              className="tempo-slider"
              id="tempo"
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              step="1"
              value={bpm}
              onChange={handleTempoInput}
            />
            <div className="tempo-scale" aria-hidden="true">
              <span>{MIN_BPM}</span>
              <span>{MAX_BPM}</span>
            </div>
          </section>

          <section className="control-panel" aria-labelledby="measure-heading">
            <div className="control-panel__header">
              <h2 id="measure-heading">Measure</h2>
              <p>{beatsPerMeasure}/4 accents</p>
            </div>

            <div
              className="beat-selector"
              role="radiogroup"
              aria-labelledby="measure-heading"
            >
              {BEAT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  className={option === beatsPerMeasure ? "is-selected" : ""}
                  aria-checked={option === beatsPerMeasure}
                  onClick={() => setBeatsPerMeasure(option)}
                >
                  {option}/4
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="pulse-panel" aria-labelledby="pulse-heading">
          <div className="control-panel__header">
            <h2 id="pulse-heading">Pulse</h2>
          </div>

          <div className="beat-track" aria-hidden="true">
            {beatIndicators.map(({ index, kind }) => (
              <span
                key={index}
                className={[
                  "beat-track__cell",
                  `beat-track__cell--${kind}`,
                  activeBeat === index ? "is-active" : "",
                ].join(" ")}
              >
                <span className="beat-track__index">{index + 1}</span>
                <span className="beat-track__dot" />
              </span>
            ))}
          </div>

          <button
            type="button"
            className={`transport ${isPlaying ? "is-playing" : ""}`}
            onClick={togglePlayback}
            aria-pressed={isPlaying}
          >
            <span className="transport__copy">
              <span className="transport__label">
                {isPlaying ? "Stop" : "Start"}
              </span>
              <span className="transport__hint">
                {isPlaying ? "Tap to pause playback" : "Tap to begin playback"}
              </span>
            </span>
            <span className="transport__icon" aria-hidden="true" />
          </button>
        </section>
      </section>
    </main>
  );
}
