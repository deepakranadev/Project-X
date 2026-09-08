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
      bonusPoints: 0,
      penaltyPoints: 0,
      totalPoints: 0,
    });
  });

  it("calculates decimal placement and finish points without output artifacts", () => {
    const decimalConfig: ScoringConfig = {
      placementPoints: { 1: 0.1 },
      pointsPerKill: 0.1,
      tiebreakers: [],
    };

    const score = calculateMatchScore(
      "match-1",
      result({ placement: 1, kills: 2 }),
      decimalConfig,
    );

    expect(score).toMatchObject({
      placementPoints: 0.1,
      killPoints: 0.2,
      totalPoints: 0.3,
    });
    expect(String(score.totalPoints)).toBe("0.3");
  });

  it("adds decimal bonuses exactly", () => {
    const score = calculateMatchScore(
      "match-1",
      result({ bonusPoints: 0.25 }),
      { ...config, pointsPerKill: 0.1 },
    );

    expect(score).toMatchObject({
      placementPoints: 6,
      killPoints: 0.4,
      bonusPoints: 0.25,
      totalPoints: 6.65,
    });
  });

  it("subtracts decimal penalties exactly while preserving negative-total policy", () => {
    const score = calculateMatchScore(
      "match-1",
      result({ placement: 4, kills: 0, penaltyPoints: 0.25 }),
      { ...config, pointsPerKill: 0.1 },
    );

    expect(score).toMatchObject({
      placementPoints: 0,
      killPoints: 0,
      penaltyPoints: 0.25,
      totalPoints: -0.25,
    });
  });

  it.each([
    { bonusPoints: 2 },
    { penaltyPoints: 1 },
    { bonusPoints: 2, penaltyPoints: 1 },
  ])("rejects non-zero DNP adjustments: %j", (adjustments) => {
    expect(() =>
      calculateMatchScore(
        "match-1",
        result({
          didNotParticipate: true,
          placement: null,
          kills: null,
          ...adjustments,
        }),
        config,
      ),
    ).toThrow(/DNP results must not include/);
  });

  it("keeps PLAYED with zero finishes distinct and preserves adjustments", () => {
    const score = calculateMatchScore(
      "match-1",
      result({ kills: 0, bonusPoints: 0.25, penaltyPoints: 0.1 }),
      config,
    );

    expect(score).toMatchObject({
      didNotParticipate: false,
      kills: 0,
      killPoints: 0,
      bonusPoints: 0.25,
      penaltyPoints: 0.1,
      totalPoints: 6.15,
    });
  });
});
