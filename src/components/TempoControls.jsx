import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

const HOLD_DELAY_MS = 400;
const INITIAL_REPEAT_MS = 150;
const MIN_REPEAT_MS = 65;
const TAP_RESET_MS = 2000;
const TAP_SAMPLE_SIZE = 4;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeTempo(value, minBpm, maxBpm, fallback) {
  if (typeof value === "string" && value.trim() === "") {
    return fallback;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return clamp(Math.round(numericValue), minBpm, maxBpm);
}

function PressAndHoldButton({
  ariaLabel,
  children,
  disabled,
  onStep,
}) {
  const holdTimerRef = useRef(null);
  const repeatTimerRef = useRef(null);
  const repeatCountRef = useRef(0);
  const onStepRef = useRef(onStep);

  onStepRef.current = onStep;

  const stopStepping = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (repeatTimerRef.current !== null) {
      window.clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }

    repeatCountRef.current = 0;
  };

  const scheduleRepeat = () => {
    onStepRef.current();
    repeatCountRef.current += 1;

    const repeatDelay = Math.max(
      MIN_REPEAT_MS,
      INITIAL_REPEAT_MS - repeatCountRef.current * 9,
    );

    repeatTimerRef.current = window.setTimeout(scheduleRepeat, repeatDelay);
  };

  const handlePointerDown = (event) => {
    if (disabled || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onStepRef.current();
    holdTimerRef.current = window.setTimeout(scheduleRepeat, HOLD_DELAY_MS);
  };

  const handlePointerEnd = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    stopStepping();
  };

  const handleClick = (event) => {
    // Pointer presses step on pointerdown. Keyboard and assistive activation
    // produce a click with detail === 0 and still need one discrete step.
    if (event.detail === 0 && !disabled) {
      onStepRef.current();
    }
  };

  useEffect(() => {
    if (disabled) {
      stopStepping();
    }
  }, [disabled]);

  useEffect(() => {
    window.addEventListener("blur", stopStepping);

    return () => {
      window.removeEventListener("blur", stopStepping);
      stopStepping();
    };
  }, []);

  return (
    <button
      type="button"
      className="round-control"
      aria-label={ariaLabel}
      disabled={disabled}
      title={`${ariaLabel}. Press and hold to keep stepping.`}
      onBlur={stopStepping}
      onClick={handleClick}
      onLostPointerCapture={stopStepping}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerLeave={stopStepping}
      onPointerUp={handlePointerEnd}
    >
      {children}
    </button>
  );
}

export function TempoControls({
  bpm,
  maxBpm,
  minBpm,
  onTempoChange,
}) {
  const [draftBpm, setDraftBpm] = useState(String(bpm));
  const [isEditing, setIsEditing] = useState(false);
  const [tapMessage, setTapMessage] = useState("");
  const [tapPulse, setTapPulse] = useState(0);
  const cancelBlurCommitRef = useRef(false);
  const editStartBpmRef = useRef(bpm);
  const tapTimesRef = useRef([]);
  const tapResetTimerRef = useRef(null);
  const fill = ((bpm - minBpm) / (maxBpm - minBpm)) * 100;
  const draftNumber = Number(draftBpm);
  const draftIsValid =
    draftBpm.trim() !== "" &&
    Number.isFinite(draftNumber) &&
    draftNumber >= minBpm &&
    draftNumber <= maxBpm;

  useEffect(() => {
    if (!isEditing) {
      setDraftBpm(String(bpm));
    }
  }, [bpm, isEditing]);

  useEffect(() => {
    return () => {
      if (tapResetTimerRef.current !== null) {
        window.clearTimeout(tapResetTimerRef.current);
      }
    };
  }, []);

  const commitDraft = (value = draftBpm) => {
    const nextBpm = normalizeTempo(value, minBpm, maxBpm, bpm);
    setDraftBpm(String(nextBpm));
    onTempoChange(nextBpm);
    return nextBpm;
  };

  const handleBpmFocus = (event) => {
    editStartBpmRef.current = bpm;
    setDraftBpm(String(bpm));
    setIsEditing(true);
    event.currentTarget.select();
  };

  const handleBpmBlur = () => {
    if (cancelBlurCommitRef.current) {
      cancelBlurCommitRef.current = false;
      setIsEditing(false);
      return;
    }

    commitDraft();
    setIsEditing(false);
  };

  const handleBpmKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      const restoredBpm = editStartBpmRef.current;
      cancelBlurCommitRef.current = true;
      setDraftBpm(String(restoredBpm));
      onTempoChange(restoredBpm);
      event.currentTarget.blur();
      return;
    }

    const direction =
      event.key === "ArrowUp" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowDown" || event.key === "ArrowLeft"
          ? -1
          : 0;

    if (direction === 0) {
      return;
    }

    event.preventDefault();
    const step = event.shiftKey ? 5 : 1;
    const currentBpm = normalizeTempo(draftBpm, minBpm, maxBpm, bpm);
    const nextBpm = clamp(currentBpm + direction * step, minBpm, maxBpm);
    setDraftBpm(String(nextBpm));
    onTempoChange(nextBpm);
  };

  const handleSliderKeyDown = (event) => {
    if (!event.shiftKey) {
      return;
    }

    const direction =
      event.key === "ArrowUp" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowDown" || event.key === "ArrowLeft"
          ? -1
          : 0;

    if (direction !== 0) {
      event.preventDefault();
      onTempoChange(bpm + direction * 5);
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const previousTap = tapTimesRef.current.at(-1);

    if (previousTap === undefined || now - previousTap > TAP_RESET_MS) {
      tapTimesRef.current = [now];
      setTapMessage("Tap again to set the tempo");
    } else {
      tapTimesRef.current = [...tapTimesRef.current, now].slice(
        -TAP_SAMPLE_SIZE,
      );

      const intervals = tapTimesRef.current
        .slice(1)
        .map((tapTime, index) => tapTime - tapTimesRef.current[index]);
      const averageInterval =
        intervals.reduce((total, interval) => total + interval, 0) /
        intervals.length;
      const nextBpm = normalizeTempo(
        60000 / averageInterval,
        minBpm,
        maxBpm,
        bpm,
      );

      onTempoChange(nextBpm);
      setTapMessage(`Tempo set to ${nextBpm} BPM`);
    }

    setTapPulse((currentPulse) => currentPulse + 1);

    if (tapResetTimerRef.current !== null) {
      window.clearTimeout(tapResetTimerRef.current);
    }

    tapResetTimerRef.current = window.setTimeout(() => {
      tapTimesRef.current = [];
      setTapMessage("");
    }, TAP_RESET_MS);
  };

  return (
    <section className="tempo-control" aria-labelledby="tempo-heading">
      <div className="tempo-control-head">
        <h2 id="tempo-heading">Tempo</h2>

        <label
          className={`tempo-input-readout ${isEditing && !draftIsValid ? "tempo-input-readout-invalid" : ""}`}
          htmlFor="tempo-bpm"
        >
          <span className="sr-only">Tempo in beats per minute</span>
          <input
            id="tempo-bpm"
            className="tempo-bpm-input"
            type="text"
            role="spinbutton"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            aria-describedby="tempo-keyboard-help"
            aria-invalid={isEditing && !draftIsValid}
            aria-valuemin={minBpm}
            aria-valuemax={maxBpm}
            aria-valuenow={draftIsValid ? Number(draftBpm) : bpm}
            value={draftBpm}
            onBlur={handleBpmBlur}
            onChange={(event) => setDraftBpm(event.target.value)}
            onFocus={handleBpmFocus}
            onKeyDown={handleBpmKeyDown}
          />
          <span className="tempo-bpm-unit" aria-hidden="true">
            BPM
          </span>
          <span className="tempo-input-readout-lamp" aria-hidden="true" />
        </label>
      </div>

      <div className="tempo-adjuster">
        <button
          type="button"
          className="tap-control"
          onClick={handleTapTempo}
          aria-describedby="tap-tempo-status"
        >
          <span
            key={tapPulse}
            className={`tap-control-lamp ${tapPulse > 0 ? "tap-control-lamp-active" : ""}`}
            aria-hidden="true"
          />
          <span>Tap</span>
        </button>

        <PressAndHoldButton
          ariaLabel="Decrease tempo by one BPM"
          disabled={bpm === minBpm}
          onStep={() => onTempoChange(bpm - 1)}
        >
          <Minus aria-hidden="true" />
        </PressAndHoldButton>

        <div className="tempo-rail">
          <label className="sr-only" htmlFor="tempo">
            Tempo in beats per minute
          </label>
          <input
            className="tempo-slider"
            id="tempo"
            type="range"
            min={minBpm}
            max={maxBpm}
            step="1"
            value={bpm}
            style={{ "--slider-fill": `${fill}%` }}
            onChange={(event) => onTempoChange(Number(event.target.value))}
            onKeyDown={handleSliderKeyDown}
          />

        </div>

        <PressAndHoldButton
          ariaLabel="Increase tempo by one BPM"
          disabled={bpm === maxBpm}
          onStep={() => onTempoChange(bpm + 1)}
        >
          <Plus aria-hidden="true" />
        </PressAndHoldButton>
      </div>

      <p id="tempo-keyboard-help" className="tempo-keyboard-help">
        <span>↑↓ ±1</span>
        <span>Shift + ↑↓ ±5</span>
      </p>

      <span id="tap-tempo-status" className="sr-only" aria-live="polite">
        {tapMessage}
      </span>
    </section>
  );
}
