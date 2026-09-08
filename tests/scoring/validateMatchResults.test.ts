import { describe, expect, it } from "vitest";

import type { MatchResult } from "../../src/domain/scoring/types";
import { validateMatchResults } from "../../src/domain/scoring/validateMatchResults";

function result(
  teamId: string,
  placement: number | null,
  kills: number | null,
  didNotParticipate = false,
): MatchResult {
  return { teamId, placement, kills, didNotParticipate };
}

const participants = ["team-a", "team-b"];

describe("validateMatchResults", () => {
  it("flags duplicate valid placements", () => {
    const validation = validateMatchResults(
      [result("team-a", 1, 3), result("team-b", 1, 2)],
      { participantTeamIds: participants },
    );

    expect(validation.valid).toBe(false);
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code: "DUPLICATE_PLACEMENT",
        placement: 1,
      }),
    );
  });

  it("rejects negative kills", () => {
    const validation = validateMatchResults(
      [result("team-a", 1, -1), result("team-b", 2, 2)],
      { participantTeamIds: participants },
    );

    expect(validation.issues).toContainEqual(
      expect.objectContaining({ code: "INVALID_KILLS", teamId: "team-a" }),
    );
  });

  it("rejects placement outside the participant range", () => {
    const validation = validateMatchResults(
      [result("team-a", 3, 1), result("team-b", 2, 2)],
      { participantTeamIds: participants },
    );

    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code: "INVALID_PLACEMENT",
        teamId: "team-a",
      }),
    );
  });

  it("accepts explicit DNP with no placement or kills", () => {
    const validation = validateMatchResults(
      [result("team-a", null, null, true), result("team-b", 1, 2)],
      { participantTeamIds: participants },
    );

    expect(validation).toEqual({ valid: true, issues: [] });
  });

  it("accepts DNP with explicit zero bonus and penalty values", () => {
    const validation = validateMatchResults(
      [
        {
          ...result("team-a", null, null, true),
          bonusPoints: 0,
          penaltyPoints: 0,
        },
        result("team-b", 1, 2),
      ],
      { participantTeamIds: participants },
    );

    expect(validation).toEqual({ valid: true, issues: [] });
  });

  it("rejects DNP rows that contain scoring data", () => {
    const validation = validateMatchResults(
      [result("team-a", 1, 0, true), result("team-b", 2, 2)],
      { participantTeamIds: participants },
    );

    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code: "DNP_HAS_SCORING_DATA",
        teamId: "team-a",
      }),
    );
  });

  it.each([
    { bonusPoints: 2 },
    { penaltyPoints: 1 },
    { bonusPoints: 2, penaltyPoints: 1 },
  ])("rejects DNP with non-zero adjustments: %j", (adjustments) => {
    const validation = validateMatchResults(
      [
        {
          ...result("team-a", null, null, true),
          ...adjustments,
        },
        result("team-b", 1, 2),
      ],
      { participantTeamIds: participants },
    );

    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code: "DNP_HAS_SCORING_DATA",
        teamId: "team-a",
        message: expect.stringContaining("bonus and penalty points to zero"),
      }),
    );
  });

  it.each([
    ["INVALID_BONUS", { bonusPoints: 0.001 }],
    ["INVALID_PENALTY", { penaltyPoints: 1.234 }],
  ] as const)("rejects unsupported %s precision", (code, adjustment) => {
    const validation = validateMatchResults([
      { ...result("team-a", 1, 0), ...adjustment },
    ]);

    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code,
        message: expect.stringContaining("at most 2 decimal places"),
      }),
    );
  });

  it("keeps PLAYED with zero finishes valid", () => {
    expect(validateMatchResults([result("team-a", 1, 0)])).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("flags unknown and missing teams against the participant roster", () => {
    const validation = validateMatchResults(
      [result("team-a", 1, 1), result("team-x", 2, 2)],
      { participantTeamIds: participants },
    );

    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "UNKNOWN_TEAM", teamId: "team-x" }),
        expect.objectContaining({ code: "MISSING_TEAM", teamId: "team-b" }),
      ]),
    );
  });

  it("flags a team that appears more than once", () => {
    const validation = validateMatchResults(
      [result("team-a", 1, 1), result("team-a", 2, 2)],
      { participantCount: 2 },
    );

    expect(validation.issues).toContainEqual(
      expect.objectContaining({ code: "DUPLICATE_TEAM", teamId: "team-a" }),
    );
  });
});
