import { describe, expect, it } from "vitest";

import {
  addScoreUnits,
  fromScoreUnits,
  hasSupportedScorePrecision,
  multiplyScoreUnits,
  SCORE_SCALE,
  toScoreUnits,
} from "../../src/domain/scoring/scorePrecision";

describe("score precision", () => {
  it("uses 100 fixed units per public point", () => {
    expect(SCORE_SCALE).toBe(100);
    expect(toScoreUnits(0.01)).toBe(1);
    expect(toScoreUnits(0.1)).toBe(10);
    expect(toScoreUnits(0.25)).toBe(25);
    expect(toScoreUnits(1)).toBe(100);
    expect(toScoreUnits(1.15)).toBe(115);
    expect(toScoreUnits(10.75)).toBe(1075);
  });

  it.each([0, 1, 1.5, 0.25, 1.15, 10.75, 100])(
    "accepts supported public precision for %s",
    (value) => {
      expect(hasSupportedScorePrecision(value)).toBe(true);
      expect(fromScoreUnits(toScoreUnits(value))).toBe(value);
    },
  );

  it.each([0.001, 1.234, 10.999, 0.1 + 0.2])(
    "rejects unsupported public precision for %s without rounding",
    (value) => {
      expect(hasSupportedScorePrecision(value)).toBe(false);
      expect(() => toScoreUnits(value)).toThrow(/at most 2 decimal places/);
    },
  );

  it("performs addition and multiplication only in safe integer units", () => {
    const oneTenth = toScoreUnits(0.1);
    expect(multiplyScoreUnits(oneTenth, 3)).toBe(toScoreUnits(0.3));
    expect(addScoreUnits(oneTenth, toScoreUnits(0.2))).toBe(
      toScoreUnits(0.3),
    );
    expect(fromScoreUnits(addScoreUnits(25, 50, 125))).toBe(2);
  });

  it("rejects values outside the safe exact-unit range", () => {
    expect(() => toScoreUnits(Number.MAX_SAFE_INTEGER)).toThrow(
      /supported exact range/,
    );
  });
});
