import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import clsx from "clsx";
import { clamp } from "../tempo";

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

type CustomProperties = CSSProperties & Record<`--${string}`, string | number>;

function getStatusLabel(
  isPlaying: boolean,
  bpm: number,
  beatsPerMeasure: number,
) {
  return isPlaying
    ? `Playing at ${bpm} beats per minute in ${beatsPerMeasure}/4 time`
    : `Stopped at ${bpm} beats per minute in ${beatsPerMeasure}/4 time`;
}

interface MeterDisplayProps {
  bpm: number;
  beatsPerMeasure: number;
  isPlaying: boolean;
  lastBeatType: "accent" | "regular";
  maxBpm: number;
  minBpm: number;
  onTempoChange: (bpm: number) => void;
  pendulumDurationMs: number;
  pulseTick: number;
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
}: MeterDisplayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectionPulse, setSelectionPulse] = useState(0);
  const scaleGeometryRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef(0);
  const dragFrameRef = useRef<number | null>(null);
  const pendingPointerYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const bpmRef = useRef(bpm);
  const progress = (bpm - minBpm) / (maxBpm - minBpm);
  const weightTop = 5.6 + progress * 87.8;
  const swingAmplitude = 16 + progress * 4;
  const swingDirection = pulseTick % 2 === 0 ? -1 : 1;
  const swingDuration = isPlaying ? pendulumDurationMs : 180;
  const isSwinging = isPlaying && !isDragging;

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const setTempoFromClientY = (clientY: number, offset = 0) => {
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

  const scheduleDragUpdate = (clientY: number) => {
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

  const finishDragging = (
    event: PointerEvent<HTMLSpanElement>,
    applyFinalPosition = true,
  ) => {
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

  const handleWeightPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
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

  const handleWeightPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (draggingRef.current) {
      scheduleDragUpdate(event.clientY);
    }
  };

  const handleWeightKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
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

  const handleScalePointerDown = (event: PointerEvent<HTMLDivElement>) => {
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
              } as CustomProperties}
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
            style={
              { "--selection-position": `${progress * 100}%` } as CustomProperties
            }
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
          } as CustomProperties}
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
