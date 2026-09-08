import { describe, expect, it } from "vitest";

import { calculateTournamentStandings } from "../../src/domain/scoring/calculateTournamentStandings";
import type { ScoringConfig } from "../../src/domain/scoring/types";
import {
  InvalidScoringConfigError,
  validateScoringConfig,
} from "../../src/domain/scoring/validateScoringConfig";

const validConfig: ScoringConfig = {
  placementPoints: { 1: 10, 2: 6, 3: 5 },
  pointsPerKill: 1,
  tiebreakers: ["WWCD", "TOTAL_KILLS"],
};

describe("validateScoringConfig", () => {
  it("accepts a well-formed configuration", () => {
    expect(validateScoringConfig(validConfig)).toEqual({
      valid: true,
      issues: [],
    });
  });

  it.each([1, 1.5, 0.25])(
    "accepts integer, one-decimal, and two-decimal score value %s",
    (scoreValue) => {
      expect(
        validateScoringConfig({
          ...validConfig,
          placementPoints: { 1: scoreValue },
          pointsPerKill: scoreValue,
        }),
      ).toEqual({ valid: true, issues: [] });
    },
  );

  it("rejects duplicate tiebreak criteria", () => {
    const validation = validateScoringConfig({
      ...validConfig,
      tiebreakers: ["WWCD", "TOTAL_KILLS", "WWCD"],
    });

    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code: "DUPLICATE_TIEBREAKER",
        field: "tiebreakers.2",
      }),
    );
  });

  it.each(["0", "-1", "1.5", "01", "first"])(
    "rejects invalid placement key %s",
    (placementKey) => {
      const validation = validateScoringConfig({
        ...validConfig,
        placementPoints: { [placementKey]: 10 },
      });

      expect(validation.issues).toContainEqual(
        expect.objectContaining({ code: "INVALID_PLACEMENT_KEY" }),
      );
    },
  );

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, "10"])(
    "rejects invalid placement point value %s",
    (placementValue) => {
      const validation = validateScoringConfig({
        ...validConfig,
        placementPoints: { 1: placementValue },
      });

      expect(validation.issues).toContainEqual(
        expect.objectContaining({ code: "INVALID_PLACEMENT_VALUE" }),
      );
    },
  );

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, "1"])(
    "rejects invalid points-per-kill value %s",
    (pointsPerKill) => {
      const validation = validateScoringConfig({
        ...validConfig,
        pointsPerKill,
      });

      expect(validation.issues).toContainEqual(
        expect.objectContaining({ code: "INVALID_POINTS_PER_KILL" }),
      );
    },
  );

  it.each([
    ["placementPoints.1", { placementPoints: { 1: 0.001 } }],
    ["pointsPerKill", { pointsPerKill: 1.234 }],
    ["pointsPerKill", { pointsPerKill: 0.1 + 0.2 }],
  ] as const)(
    "rejects unsupported precision in %s without rounding",
    (field, override) => {
      const validation = validateScoringConfig({
        ...validConfig,
        ...override,
      });

      expect(validation.issues).toContainEqual(
        expect.objectContaining({
          code: "UNSUPPORTED_SCORE_PRECISION",
          field,
          message: expect.stringContaining("at most 2 decimal places"),
        }),
      );
    },
  );

  it("rejects a score that cannot fit exact safe-integer units", () => {
    const validation = validateScoringConfig({
      ...validConfig,
      pointsPerKill: Number.MAX_SAFE_INTEGER,
    });

    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code: "SCORE_OUT_OF_RANGE",
        field: "pointsPerKill",
      }),
    );
  });

  it("rejects unsupported tiebreak criteria", () => {
    const validation = validateScoringConfig({
      ...validConfig,
      tiebreakers: ["HEAD_TO_HEAD"],
    });

    expect(validation.issues).toContainEqual(
      expect.objectContaining({ code: "UNKNOWN_TIEBREAKER" }),
    );
  });

  it.each([
    null,
    { ...validConfig, pointsPerKill: -1 },
    { ...validConfig, placementPoints: { 0: 10 } },
    { ...validConfig, tiebreakers: ["WWCD", "WWCD"] },
  ])("prevents malformed configuration from producing standings", (config) => {
    expect(() =>
      calculateTournamentStandings([], config as ScoringConfig),
    ).toThrow(InvalidScoringConfigError);
  });

  it("rejects unsupported precision before calculating an empty tournament", () => {
    expect(() =>
      calculateTournamentStandings([], {
        ...validConfig,
        pointsPerKill: 0.001,
      }),
    ).toThrow(InvalidScoringConfigError);
  });
});
