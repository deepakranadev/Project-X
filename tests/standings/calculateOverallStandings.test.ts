import { describe, expect, it } from "vitest";

import type {
  StoredMatchResult,
  TournamentMatch,
} from "../../src/domain/matches/types";
import type { ScoringConfig } from "../../src/domain/scoring/types";
import {
  calculateOverallStandings,
  type MatchWithStoredResults,
} from "../../src/domain/standings/calculateOverallStandings";

const standardConfig: ScoringConfig = {
  placementPoints: { 1: 10, 2: 6, 3: 5 },
  pointsPerKill: 1,
  tiebreakers: ["WWCD", "PLACEMENT_POINTS", "TOTAL_KILLS"],
};

function result(
  matchId: string,
  teamId: string,
  placement: number | null,
  kills: number | null,
  participationStatus: "PLAYED" | "DNP" = "PLAYED",
): StoredMatchResult {
  return {
    id: `${matchId}-${teamId}`,
    tournamentId: "tournament-one",
    matchId,
    teamId,
    placement,
    kills,
    participationStatus,
    source: "MANUAL",
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

function storedMatch(
  id: string,
  matchNumber: number,
  status: "DRAFT" | "FINALIZED",
  results: readonly StoredMatchResult[],
): MatchWithStoredResults {
  const match: TournamentMatch = {
    id,
    tournamentId: "tournament-one",
    matchNumber,
    status,
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
  return { match, results };
}

describe("calculateOverallStandings", () => {
  it("calculates placement, finish, and total points for one finalized match", () => {
    const standings = calculateOverallStandings({
      teamIds: ["team-a", "team-b"],
      matches: [
        storedMatch("match-1", 1, "FINALIZED", [
          result("match-1", "team-a", 1, 3),
          result("match-1", "team-b", 2, 1),
        ]),
      ],
      scoringConfig: standardConfig,
    });

    expect(standings).toMatchObject([
      {
        rank: 1,
        teamId: "team-a",
        matchesPlayed: 1,
        placementPoints: 10,
        killPoints: 3,
        totalPoints: 13,
      },
      {
        rank: 2,
        teamId: "team-b",
        matchesPlayed: 1,
        placementPoints: 6,
        killPoints: 1,
        totalPoints: 7,
      },
    ]);
  });

  it("accumulates exact totals across multiple finalized matches", () => {
    const standings = calculateOverallStandings({
      teamIds: ["team-a", "team-b"],
      matches: [
        storedMatch("match-1", 1, "FINALIZED", [
          result("match-1", "team-a", 1, 2),
          result("match-1", "team-b", 2, 4),
        ]),
        storedMatch("match-2", 2, "FINALIZED", [
          result("match-2", "team-a", 2, 1),
          result("match-2", "team-b", 1, 0),
        ]),
      ],
      scoringConfig: standardConfig,
    });

    expect(standings.find((row) => row.teamId === "team-a")).toMatchObject({
      matchesPlayed: 2,
      placementPoints: 16,
      killPoints: 3,
      totalPoints: 19,
    });
    expect(standings.find((row) => row.teamId === "team-b")).toMatchObject({
      matchesPlayed: 2,
      placementPoints: 16,
      killPoints: 4,
      totalPoints: 20,
    });
  });

  it("keeps DNP, a zero-finish participant, and a team with no results distinct", () => {
    const standings = calculateOverallStandings({
      teamIds: ["team-a", "team-b", "team-c"],
      matches: [
        storedMatch("match-1", 1, "FINALIZED", [
          result("match-1", "team-a", null, null, "DNP"),
          result("match-1", "team-b", 1, 0),
        ]),
      ],
      scoringConfig: standardConfig,
    });

    expect(standings.find((row) => row.teamId === "team-a")).toMatchObject({
      matchesPlayed: 0,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
    });
    expect(standings.find((row) => row.teamId === "team-b")).toMatchObject({
      matchesPlayed: 1,
      placementPoints: 10,
      killPoints: 0,
      totalPoints: 10,
    });
    expect(standings.find((row) => row.teamId === "team-c")).toMatchObject({
      matchesPlayed: 0,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
    });
  });

  it("excludes draft matches even when their result values are invalid", () => {
    const standings = calculateOverallStandings({
      teamIds: ["team-a", "team-b"],
      matches: [
        storedMatch("match-1", 1, "FINALIZED", [
          result("match-1", "team-a", 1, 1),
          result("match-1", "team-b", 2, 0),
        ]),
        storedMatch("match-2", 2, "DRAFT", [
          result("match-2", "team-a", 1, -99),
          result("match-2", "team-b", 1, -99),
        ]),
      ],
      scoringConfig: standardConfig,
    });

    expect(standings.find((row) => row.teamId === "team-a")?.totalPoints).toBe(11);
    expect(standings.find((row) => row.teamId === "team-b")?.totalPoints).toBe(6);
  });

  it("removes, restores, and removes contribution as a match is reopened, re-finalized, and deleted", () => {
    const finalized = storedMatch("match-1", 1, "FINALIZED", [
      result("match-1", "team-a", 1, 2),
      result("match-1", "team-b", 2, 0),
    ]);
    const calculate = (matches: readonly MatchWithStoredResults[]) =>
      calculateOverallStandings({
        teamIds: ["team-a", "team-b"],
        matches,
        scoringConfig: standardConfig,
      });

    expect(calculate([finalized])[0]?.totalPoints).toBe(12);
    expect(
      calculate([{ ...finalized, match: { ...finalized.match, status: "DRAFT" } }])
        .every((row) => row.totalPoints === 0),
    ).toBe(true);
    expect(calculate([finalized])[0]?.totalPoints).toBe(12);
    expect(calculate([]).every((row) => row.totalPoints === 0)).toBe(true);
  });

  it("uses the existing configured tie-break order", () => {
    const tiedMatch = storedMatch("match-1", 1, "FINALIZED", [
      result("match-1", "team-a", 1, 0),
      result("match-1", "team-b", 2, 4),
    ]);
    const wwcdFirst = calculateOverallStandings({
      teamIds: ["team-a", "team-b"],
      matches: [tiedMatch],
      scoringConfig: standardConfig,
    });
    const finishesFirst = calculateOverallStandings({
      teamIds: ["team-a", "team-b"],
      matches: [tiedMatch],
      scoringConfig: { ...standardConfig, tiebreakers: ["TOTAL_KILLS", "WWCD"] },
    });

    expect(wwcdFirst.map((row) => row.teamId)).toEqual(["team-a", "team-b"]);
    expect(finishesFirst.map((row) => row.teamId)).toEqual(["team-b", "team-a"]);
  });

  it("derives all point fields from a custom scoring configuration", () => {
    const standings = calculateOverallStandings({
      teamIds: ["team-a", "team-b"],
      matches: [
        storedMatch("match-1", 1, "FINALIZED", [
          result("match-1", "team-a", 1, 3),
          result("match-1", "team-b", 2, 1),
        ]),
      ],
      scoringConfig: {
        placementPoints: { 1: 20, 2: 10 },
        pointsPerKill: 2,
        tiebreakers: ["TOTAL_KILLS"],
      },
    });

    expect(standings[0]).toMatchObject({
      teamId: "team-a",
      placementPoints: 20,
      killPoints: 6,
      totalPoints: 26,
    });
  });
});

