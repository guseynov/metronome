import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TempoControls } from "./TempoControls";

describe("TempoControls", () => {
  it("keeps invalid input visible and explains how to correct it", async () => {
    const user = userEvent.setup();
    const onTempoChange = vi.fn();
    render(
      <TempoControls
        bpm={100}
        minBpm={40}
        maxBpm={220}
        onTempoChange={onTempoChange}
      />,
    );

    const input = screen.getByRole("spinbutton", {
      name: "Tempo in beats per minute",
    });
    await user.clear(input);
    await user.type(input, "999");
    await user.tab();

    expect(input).toHaveValue("999");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Tempo must be from 40 to 220 BPM.")).toBeVisible();
    expect(onTempoChange).not.toHaveBeenCalled();
  });

  it("commits a valid whole-number tempo", async () => {
    const user = userEvent.setup();
    const onTempoChange = vi.fn();
    render(
      <TempoControls
        bpm={100}
        minBpm={40}
        maxBpm={220}
        onTempoChange={onTempoChange}
      />,
    );

    const input = screen.getByRole("spinbutton", {
      name: "Tempo in beats per minute",
    });
    await user.clear(input);
    await user.type(input, "137{Enter}");

    expect(onTempoChange).toHaveBeenCalledWith(137);
    expect(input).toHaveAttribute("aria-invalid", "false");
  });
});
