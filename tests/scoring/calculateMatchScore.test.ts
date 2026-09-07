import { describe, expect, it } from "vitest";

import { calculateMatchScore } from "../../src/domain/scoring/calculateMatchScore";
import type {
  MatchResult,
  ScoringConfig,
} from "../../src/domain/scoring/types";

const config: ScoringConfig = {
  placementPoints: { 1: 10, 2: 6, 3: 5 },
  pointsPerKill: 2,
  tiebreakers: ["WWCD", "TOTAL_KILLS"],
};

function result(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    teamId: "team-a",
    placement: 2,
    kills: 4,
    didNotParticipate: false,
    ...overrides,
  };
}

describe("calculateMatchScore", () => {
  it("calculates normal placement and kill points", () => {
    expect(calculateMatchScore("match-1", result(), config)).toEqual({
      matchId: "match-1",
      teamId: "team-a",
      didNotParticipate: false,
      placement: 2,
      kills: 4,
      placementPoints: 6,
      killPoints: 8,
      bonusPoints: 0,
      penaltyPoints: 0,
      totalPoints: 14,
    });
  });

  it("adds bonus points", () => {
    const score = calculateMatchScore(
      "match-1",
      result({ bonusPoints: 3 }),
      config,
    );

    expect(score.totalPoints).toBe(17);
  });

  it("subtracts penalty points", () => {
    const score = calculateMatchScore(
      "match-1",
      result({ penaltyPoints: 2 }),
      config,
    );

    expect(score.totalPoints).toBe(12);
  });

  it("keeps DNP explicit without inventing placement or kill scoring", () => {
    const score = calculateMatchScore(
      "match-1",
      result({
        didNotParticipate: true,
        placement: null,
        kills: null,
      }),
      config,
    );

    expect(score).toMatchObject({
      didNotParticipate: true,
      placement: null,
      kills: null,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
    });
  });
});
