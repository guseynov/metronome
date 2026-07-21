import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MeasureControls } from "./MeasureControls";

const OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

function MeterHarness() {
  const [beats, setBeats] = useState(4);

  return (
    <MeasureControls
      beatsPerMeasure={beats}
      options={OPTIONS}
      onSelectBeatsPerMeasure={setBeats}
    />
  );
}

describe("MeasureControls", () => {
  it("uses roving focus and selects meters with arrow, Home, and End keys", async () => {
    const user = userEvent.setup();
    render(<MeterHarness />);

    const four = screen.getByRole("radio", { name: "4/4 time" });
    const five = screen.getByRole("radio", { name: "5/4 time" });

    expect(four).toHaveAttribute("tabindex", "0");
    expect(five).toHaveAttribute("tabindex", "-1");

    four.focus();
    await user.keyboard("{ArrowRight}");
    expect(five).toHaveFocus();
    expect(five).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "8/4 time" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "2/4 time" })).toHaveFocus();
  });
});
