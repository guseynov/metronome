import { describe, expect, it } from "vitest";
import {
  clamp,
  getTappedTempo,
  getTempoValidationMessage,
  parseTempo,
} from "./tempo";

describe("tempo utilities", () => {
  it("clamps values to the supported range", () => {
    expect(clamp(20, 40, 220)).toBe(40);
    expect(clamp(120, 40, 220)).toBe(120);
    expect(clamp(300, 40, 220)).toBe(220);
  });

  it("requires an in-range whole BPM value", () => {
    expect(getTempoValidationMessage("", 40, 220)).toContain("40 to 220");
    expect(getTempoValidationMessage("120.5", 40, 220)).toContain(
      "whole number",
    );
    expect(getTempoValidationMessage("999", 40, 220)).toContain("40 to 220");
    expect(getTempoValidationMessage("137", 40, 220)).toBe("");
    expect(parseTempo("137", 40, 220)).toBe(137);
    expect(parseTempo("999", 40, 220)).toBeNull();
  });

  it("averages recent tap intervals and clamps the result", () => {
    expect(getTappedTempo([0], 40, 220)).toBeNull();
    expect(getTappedTempo([0, 500, 1000, 1500], 40, 220)).toBe(120);
    expect(getTappedTempo([0, 100], 40, 220)).toBe(220);
    expect(getTappedTempo([0, 1800], 40, 220)).toBe(40);
  });
});
