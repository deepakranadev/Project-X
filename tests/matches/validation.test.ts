import { describe, expect, it } from "vitest";

import type { StoredMatchResult } from "../../src/domain/matches/types";
import { validateManualMatchResults } from "../../src/domain/matches/validation";

function result(
  teamId: string,
  placement: number | null,
  kills: number | null,
  overrides: Partial<StoredMatchResult> = {},
): StoredMatchResult {
  return {
    id: `result-${teamId}`,
    tournamentId: "tournament-one",
    matchId: "match-one",
    teamId,
    placement,
    kills,
    participationStatus: "PLAYED",
    source: "MANUAL",
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
    ...overrides,
  };
}

const options = {
  tournamentId: "tournament-one",
  matchId: "match-one",
  participantTeamIds: ["one", "two", "three"],
} as const;

describe("validateManualMatchResults", () => {
  it("accepts valid played results and keeps zero finishes distinct from DNP", () => {
    const validation = validateManualMatchResults([
      result("one", 1, 4),
      result("two", 2, 0),
      result("three", null, null, { participationStatus: "DNP" }),
    ], options);

    expect(validation).toEqual({ valid: true, issues: [] });
  });

  it("rejects negative or fractional finishes", () => {
    const negative = validateManualMatchResults([
      result("one", 1, -1),
      result("two", 2, 2),
      result("three", 3, 0),
    ], options);
    const fractional = validateManualMatchResults([
      result("one", 1, 1.5),
      result("two", 2, 2),
      result("three", 3, 0),
    ], options);

    expect(negative.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_KILLS", teamId: "one" })]));
    expect(fractional.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_KILLS", teamId: "one" })]));
  });

  it("detects duplicate placement and incomplete played rows", () => {
    const validation = validateManualMatchResults([
      result("one", 1, 3),
      result("two", 1, 2),
      result("three", null, null),
    ], options);

    expect(validation.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["DUPLICATE_PLACEMENT", "INVALID_PLACEMENT", "INVALID_KILLS"]),
    );
  });

  it("rejects result, team, and match context mismatches", () => {
    const validation = validateManualMatchResults([
      result("one", 1, 3, { tournamentId: "tournament-two" }),
      result("two", 2, 2, { matchId: "other-match" }),
      result("foreign-team", 3, 1),
    ], options);

    expect(validation.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "RESULT_TOURNAMENT_MISMATCH",
        "RESULT_MATCH_MISMATCH",
        "UNKNOWN_TEAM",
        "MISSING_TEAM",
      ]),
    );
  });
});
