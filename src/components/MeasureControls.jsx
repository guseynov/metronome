import clsx from "clsx";

const controlButtonClass =
  "min-h-10 rounded-xl border border-transparent bg-[var(--panel-strong)] px-3 text-sm font-medium text-[var(--text)] transition duration-150 ease-out hover:-translate-y-px hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";

export function MeasureControls({
  beatsPerMeasure,
  options,
  onSelectBeatsPerMeasure,
}) {
  return (
    <section className="rounded-[18px] border border-[var(--border)] bg-[var(--panel)] p-4" aria-labelledby="measure-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          className="m-0 text-[0.92rem] font-bold tracking-[-0.02em] text-[var(--text)]"
          id="measure-heading"
        >
          Time Signature
        </h2>
        <p className="m-0 text-[0.86rem] text-[var(--text-muted)]">
          {beatsPerMeasure}/4 meter
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4"
        role="radiogroup"
        aria-labelledby="measure-heading"
      >
        {options.map((option) => {
          const selected = option === beatsPerMeasure;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              className={clsx(
                controlButtonClass,
                selected &&
                  "border-[rgba(168,239,113,0.35)] bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[inset_0_0_0_1px_rgba(168,239,113,0.18),0_0_0_1px_rgba(168,239,113,0.08)]",
              )}
              aria-checked={selected}
              onClick={() => onSelectBeatsPerMeasure(option)}
            >
              {option}/4
            </button>
          );
        })}
      </div>
    </section>
  );
}
