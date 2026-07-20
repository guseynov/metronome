import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

const SCALE_MARKS = [
  { bpm: 40, term: "Grave" },
  { bpm: 50, term: "Largo" },
  { bpm: 60, term: "Larghetto" },
  { bpm: 70, term: "Adagio" },
  { bpm: 80, term: "Andante" },
  { bpm: 90, term: "Moderato" },
  { bpm: 100, term: "Allegretto" },
  { bpm: 112, term: "Allegro" },
  { bpm: 126, term: "Animato" },
  { bpm: 144, term: "Vivace" },
  { bpm: 168, term: "Presto" },
  { bpm: 200, term: "Prestissimo" },
  { bpm: 220, term: "" },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getStatusLabel(isPlaying, bpm, beatsPerMeasure) {
  return isPlaying
    ? `Playing at ${bpm} beats per minute in ${beatsPerMeasure}/4 time`
    : `Stopped at ${bpm} beats per minute in ${beatsPerMeasure}/4 time`;
}

export function MeterDisplay({
  bpm,
  beatsPerMeasure,
  isPlaying,
  lastBeatType,
  maxBpm,
  minBpm,
  onTempoChange,
  pendulumDurationMs,
  pulseTick,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectionPulse, setSelectionPulse] = useState(0);
  const scaleGeometryRef = useRef(null);
  const dragOffsetRef = useRef(0);
  const dragFrameRef = useRef(null);
  const pendingPointerYRef = useRef(null);
  const draggingRef = useRef(false);
  const bpmRef = useRef(bpm);
  const progress = (bpm - minBpm) / (maxBpm - minBpm);
  const weightTop = 5.6 + progress * 87.8;
  const swingAmplitude = 16 + progress * 4;
  const swingDirection = pulseTick % 2 === 0 ? -1 : 1;
  const swingDuration = isPlaying ? pendulumDurationMs : 180;
  const isSwinging = isPlaying && !isDragging;

  bpmRef.current = bpm;

  const setTempoFromClientY = (clientY, offset = 0) => {
    const scale = scaleGeometryRef.current;

    if (!scale) {
      return;
    }

    const bounds = scale.getBoundingClientRect();
    const nextProgress = clamp(
      (clientY - offset - bounds.top) / bounds.height,
      0,
      1,
    );
    const nextBpm = Math.round(
      minBpm + nextProgress * (maxBpm - minBpm),
    );

    if (nextBpm !== bpmRef.current) {
      bpmRef.current = nextBpm;
      onTempoChange(nextBpm);
    }
  };

  const scheduleDragUpdate = (clientY) => {
    pendingPointerYRef.current = clientY;

    if (dragFrameRef.current !== null) {
      return;
    }

    dragFrameRef.current = window.requestAnimationFrame(() => {
      dragFrameRef.current = null;

      if (pendingPointerYRef.current !== null) {
        setTempoFromClientY(
          pendingPointerYRef.current,
          dragOffsetRef.current,
        );
      }
    });
  };

  const finishDragging = (event, applyFinalPosition = true) => {
    if (!draggingRef.current) {
      return;
    }

    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }

    if (applyFinalPosition) {
      setTempoFromClientY(event.clientY, dragOffsetRef.current);
    }

    pendingPointerYRef.current = null;
    draggingRef.current = false;
    setIsDragging(false);
    setSelectionPulse((currentPulse) => currentPulse + 1);

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWeightPointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    const scale = scaleGeometryRef.current;

    if (!scale) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const bounds = scale.getBoundingClientRect();
    const currentWeightY = bounds.top + progress * bounds.height;
    dragOffsetRef.current = event.clientY - currentWeightY;
    draggingRef.current = true;
    setIsDragging(true);
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleWeightPointerMove = (event) => {
    if (draggingRef.current) {
      scheduleDragUpdate(event.clientY);
    }
  };

  const handleWeightKeyDown = (event) => {
    const step = event.shiftKey ? 5 : 1;
    let nextBpm = null;

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextBpm = bpm - step;
    } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextBpm = bpm + step;
    } else if (event.key === "Home") {
      nextBpm = minBpm;
    } else if (event.key === "End") {
      nextBpm = maxBpm;
    }

    if (nextBpm === null) {
      return;
    }

    event.preventDefault();
    onTempoChange(clamp(nextBpm, minBpm, maxBpm));
    setSelectionPulse((currentPulse) => currentPulse + 1);
  };

  const handleScalePointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    setTempoFromClientY(event.clientY);
    setSelectionPulse((currentPulse) => currentPulse + 1);
  };

  useEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="meter-display">
      <div className="scale-panel">
        <div className="scale-heading" aria-hidden="true">
          beats per minute
        </div>
        <div className="scale-rule scale-rule-left" aria-hidden="true" />
        <div className="scale-rule scale-rule-right" aria-hidden="true" />

        <div ref={scaleGeometryRef} className="scale-marks" aria-hidden="true">
          {SCALE_MARKS.map(({ bpm: markBpm, term }) => (
            <div
              className="scale-mark"
              key={markBpm}
              style={{
                "--mark-position": `${
                  ((markBpm - minBpm) / (maxBpm - minBpm)) * 100
                }%`,
              }}
            >
              <span className="scale-number scale-number-left">{markBpm}</span>
              <span className="scale-tick scale-tick-left" />
              <span className="scale-term">{term}</span>
              <span className="scale-tick scale-tick-right" />
              <span className="scale-number scale-number-right">{markBpm}</span>
            </div>
          ))}

          <span
            key={selectionPulse}
            className={clsx(
              "scale-selection-line",
              isDragging && "scale-selection-line-dragging",
              selectionPulse > 0 && "scale-selection-line-pulse",
            )}
            style={{ "--selection-position": `${progress * 100}%` }}
          />
        </div>

        <div
          className="scale-interaction-zone"
          aria-hidden="true"
          onPointerDown={handleScalePointerDown}
        />

        <div
          className={clsx(
            "pendulum",
            isSwinging && "pendulum-moving",
            isDragging && "pendulum-dragging",
          )}
          style={{
            "--pendulum-angle": `${
              isSwinging ? swingDirection * swingAmplitude : 0
            }deg`,
            "--swing-duration": `${swingDuration}ms`,
          }}
        >
          <span className="pendulum-rod" aria-hidden="true" />
          <span
            className={clsx(
              "pendulum-weight",
              isDragging && "pendulum-weight-dragging",
            )}
            role="slider"
            tabIndex={0}
            aria-label="Tempo weight"
            aria-describedby="tempo-weight-help"
            aria-orientation="vertical"
            aria-valuemin={minBpm}
            aria-valuemax={maxBpm}
            aria-valuenow={bpm}
            aria-valuetext={`${bpm} beats per minute`}
            style={{ top: `${weightTop}%` }}
            onDragStart={(event) => event.preventDefault()}
            onKeyDown={handleWeightKeyDown}
            onLostPointerCapture={(event) => finishDragging(event, false)}
            onPointerCancel={(event) => finishDragging(event, false)}
            onPointerDown={handleWeightPointerDown}
            onPointerMove={handleWeightPointerMove}
            onPointerUp={finishDragging}
          />
        </div>
        <span className="pendulum-pivot" aria-hidden="true" />
      </div>

      <span id="tempo-weight-help" className="sr-only">
        Drag vertically or click the engraved scale to set tempo. Use arrow keys
        for one BPM, Shift plus arrow keys for five BPM, and Home or End for the
        minimum or maximum tempo.
      </span>

      <div className="tempo-readout" aria-live="polite" aria-atomic="true">
        <span className="tempo-readout-number">{bpm}</span>
        <span className="tempo-readout-unit">BPM</span>
        <span
          className={clsx(
            "beat-lamp",
            isPlaying && "beat-lamp-on",
            isPlaying && lastBeatType === "accent" && "beat-lamp-accent",
          )}
          aria-hidden="true"
        />
        <span className="sr-only">
          {getStatusLabel(isPlaying, bpm, beatsPerMeasure)}
        </span>
      </div>
    </div>
  );
}
