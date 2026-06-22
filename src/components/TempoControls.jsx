import { Minus, Plus } from "lucide-react";

const controlButtonClass =
  "min-h-10 rounded-xl border border-transparent bg-[var(--panel-strong)] px-3 text-sm font-medium text-[var(--text)] transition duration-150 ease-out hover:-translate-y-px hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";

export function TempoControls({
  bpm,
  maxBpm,
  minBpm,
  onStepTempo,
  onTempoInput,
}) {
  return (
    <section className="rounded-[18px] border border-[var(--border)] bg-[var(--panel)] p-4" aria-labelledby="tempo-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[0.92rem] font-bold tracking-[-0.02em] text-[var(--text)]">
          Tempo
        </h2>
        <div className="inline-flex gap-2" aria-label="Tempo adjustments">
          <button
            type="button"
            className={controlButtonClass}
            onClick={() => onStepTempo(-1)}
            aria-label="Decrease tempo by one BPM"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={controlButtonClass}
            onClick={() => onStepTempo(1)}
            aria-label="Increase tempo by one BPM"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <label className="sr-only" htmlFor="tempo">
        Tempo in beats per minute
      </label>
      <input
        className="tempo-slider h-8 w-full appearance-none bg-transparent"
        id="tempo"
        type="range"
        min={minBpm}
        max={maxBpm}
        step="1"
        value={bpm}
        onChange={onTempoInput}
      />
      <div className="mt-1.5 flex justify-between text-[0.78rem] text-[var(--text-subtle)]">
        <span>{minBpm}</span>
        <span>{maxBpm}</span>
      </div>
    </section>
  );
}
