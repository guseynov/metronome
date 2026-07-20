import clsx from "clsx";

export function MeasureControls({
  beatsPerMeasure,
  options,
  onSelectBeatsPerMeasure,
}) {
  return (
    <section className="measure-control" aria-labelledby="measure-heading">
      <div className="control-label-row">
        <h2 id="measure-heading">Meter</h2>
        <output>{beatsPerMeasure}/4</output>
      </div>

      <div className="meter-selector" role="radiogroup" aria-labelledby="measure-heading">
        {options.map((option) => {
          const selected = option === beatsPerMeasure;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              className={clsx("meter-option", selected && "meter-option-selected")}
              aria-checked={selected}
              aria-label={`${option}/4 time`}
              onClick={() => onSelectBeatsPerMeasure(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}
