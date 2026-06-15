import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import click1 from "./sounds/click1.wav";
import click2 from "./sounds/click2.wav";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(null);
  const [lastBeatType, setLastBeatType] = useState("accent");
  const [pulseTick, setPulseTick] = useState(0);

  const regularClickRef = useRef(null);
  const accentClickRef = useRef(null);
  const timeoutRef = useRef(null);
  const currentBeatRef = useRef(0);
  const playingRef = useRef(false);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);

  const beatIndicators = useMemo(
    () =>
      Array.from({ length: beatsPerMeasure }, (_, index) => ({
        index,
        kind: index === 0 ? "accent" : "regular",
      })),
    [beatsPerMeasure]
  );

  const clearPlaybackTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const playSound = (isAccent) => {
    const audio = isAccent ? accentClickRef.current : regularClickRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    const playback = audio.play();

    if (playback?.catch) {
      playback.catch(() => {});
    }
  };

  const scheduleNextBeat = () => {
    clearPlaybackTimer();

    if (!playingRef.current) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      const beatIndex = currentBeatRef.current;
      const isAccent = beatIndex === 0;
      const nextBeat = (beatIndex + 1) % beatsPerMeasureRef.current;

      setActiveBeat(beatIndex);
      setLastBeatType(isAccent ? "accent" : "regular");
      setPulseTick((currentValue) => currentValue + 1);
      playSound(isAccent);

      currentBeatRef.current = nextBeat;
      scheduleNextBeat();
    }, 60000 / bpmRef.current);
  };

  const stopPlayback = () => {
    playingRef.current = false;
    setIsPlaying(false);
    setActiveBeat(null);
    clearPlaybackTimer();
  };

  const startPlayback = () => {
    playingRef.current = true;
    currentBeatRef.current = 0;
    setIsPlaying(true);
    setActiveBeat(0);
    setLastBeatType("accent");
    setPulseTick((currentValue) => currentValue + 1);
    playSound(true);

    currentBeatRef.current = 1 % beatsPerMeasureRef.current;
    scheduleNextBeat();
  };

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;

    if (currentBeatRef.current >= beatsPerMeasure) {
      currentBeatRef.current = 0;
      setActiveBeat(playingRef.current ? 0 : null);
    }

    if (playingRef.current) {
      startPlayback();
    }
  }, [beatsPerMeasure]);

  useEffect(() => {
    regularClickRef.current = new Audio(click1);
    accentClickRef.current = new Audio(click2);

    regularClickRef.current.preload = "auto";
    accentClickRef.current.preload = "auto";

    return () => {
      clearPlaybackTimer();
      playingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!playingRef.current) {
      return;
    }

    scheduleNextBeat();
  }, [bpm]);

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
          <p className="metronome__eyebrow">Practice tool</p>
          <h1 className="metronome__title" id="metronome-title">
            Metronome
          </h1>
          <p className="metronome__subtitle">Set the tempo and keep time.</p>
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
            <p>{isPlaying ? "Accent on beat one" : "Ready to start"}</p>
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
            onClick={() => (isPlaying ? stopPlayback() : startPlayback())}
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
