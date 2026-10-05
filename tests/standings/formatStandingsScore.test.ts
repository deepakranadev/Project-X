import { describe, expect, it } from "vitest";
import { formatStandingsScore } from "../../src/features/standings/utils/formatStandingsScore";

describe("formatStandingsScore", () => {
  it("formats integers without decimal point", () => {
    expect(formatStandingsScore(0)).toBe("0");
    expect(formatStandingsScore(12)).toBe("12");
    expect(formatStandingsScore(87)).toBe("87");
  });

  it("formats representative fractional values up to 2 decimal places", () => {
    expect(formatStandingsScore(0.25)).toBe("0.25");
    expect(formatStandingsScore(1.5)).toBe("1.50");
    expect(formatStandingsScore(6.25)).toBe("6.25");
    expect(formatStandingsScore(87.5)).toBe("87.50");
    expect(formatStandingsScore(999.99)).toBe("999.99");
  });

  it("handles floating point precision gracefully", () => {
    expect(formatStandingsScore(0.1 + 0.2)).toBe("0.30");
  });
});
