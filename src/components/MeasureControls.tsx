import clsx from "clsx";
import { useRef } from "react";

interface MeasureControlsProps {
  beatsPerMeasure: number;
  options: readonly [number, ...number[]];
  onSelectBeatsPerMeasure: (beats: number) => void;
}

export function MeasureControls({
  beatsPerMeasure,
  options,
  onSelectBeatsPerMeasure,
}: MeasureControlsProps) {
  const optionRefs = useRef(new Map<number, HTMLButtonElement>());

  const selectRelativeOption = (currentOption: number, offset: number) => {
    const currentIndex = options.indexOf(currentOption);
    const nextIndex = (currentIndex + offset + options.length) % options.length;
    const nextOption = options[nextIndex] ?? options[0];

    onSelectBeatsPerMeasure(nextOption);
    optionRefs.current.get(nextOption)?.focus();
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    option: number,
  ) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectRelativeOption(option, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectRelativeOption(option, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      const firstOption = options[0];
      onSelectBeatsPerMeasure(firstOption);
      optionRefs.current.get(firstOption)?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      const lastOption = options[options.length - 1] ?? options[0];
      onSelectBeatsPerMeasure(lastOption);
      optionRefs.current.get(lastOption)?.focus();
    }
  };
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
              ref={(element) => {
                if (element) {
                  optionRefs.current.set(option, element);
                } else {
                  optionRefs.current.delete(option);
                }
              }}
              className={clsx("meter-option", selected && "meter-option-selected")}
              aria-checked={selected}
              aria-label={`${option}/4 time`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelectBeatsPerMeasure(option)}
              onKeyDown={(event) => handleOptionKeyDown(event, option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}
