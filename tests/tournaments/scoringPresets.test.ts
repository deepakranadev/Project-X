import { describe, expect, it } from "vitest";

import {
  BGMI_STANDARD_SCORING_CONFIG,
  createBgmiStandardScoringConfig,
} from "../../src/domain/tournaments/scoringPresets";

describe("BGMI Standard scoring preset", () => {
  it("defines the approved placement points explicitly through 16th", () => {
    expect(BGMI_STANDARD_SCORING_CONFIG.placementPoints).toEqual({
      1: 10,
      2: 6,
      3: 5,
      4: 4,
      5: 3,
      6: 2,
      7: 1,
      8: 1,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
      14: 0,
      15: 0,
      16: 0,
    });
  });

  it("awards one point per finish", () => {
    expect(BGMI_STANDARD_SCORING_CONFIG.pointsPerKill).toBe(1);
  });

  it("returns independent configuration copies", () => {
    const first = createBgmiStandardScoringConfig();
    const second = createBgmiStandardScoringConfig();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.placementPoints).not.toBe(second.placementPoints);
    expect(first.tiebreakers).not.toBe(second.tiebreakers);
  });
});
