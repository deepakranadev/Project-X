import { describe, expect, it } from "vitest";

import { calculateTournamentStandings } from "../../src/domain/scoring/calculateTournamentStandings";
import type {
  Match,
  MatchResult,
  ScoringConfig,
} from "../../src/domain/scoring/types";

const placementPoints = { 1: 10, 2: 6, 3: 5 };

function config(
  tiebreakers: ScoringConfig["tiebreakers"] = ["WWCD", "TOTAL_KILLS"],
): ScoringConfig {
  return {
    placementPoints,
    pointsPerKill: 1,
    tiebreakers,
  };
}

function result(
  teamId: string,
  placement: number,
  kills: number,
): MatchResult {
  return {
    teamId,
    placement,
    kills,
    didNotParticipate: false,
  };
}

function match(
  id: string,
  matchNumber: number,
  results: readonly MatchResult[],
): Match {
  return {
    id,
    matchNumber,
    participantTeamIds: ["team-a", "team-b"],
    results,
  };
}

describe("calculateTournamentStandings", () => {
  it("aggregates totals across multiple matches and counts each WWCD once", () => {
    const standings = calculateTournamentStandings(
      [
        match("match-1", 1, [
          result("team-a", 1, 2),
          result("team-b", 2, 5),
        ]),
        match("match-2", 2, [
          result("team-a", 2, 3),
          result("team-b", 1, 1),
        ]),
      ],
      config(),
    );

    expect(standings).toHaveLength(2);
    expect(standings[0]).toMatchObject({
      rank: 1,
      teamId: "team-b",
      matchesPlayed: 2,
      wwcd: 1,
      placementPoints: 16,
      totalKills: 6,
      killPoints: 6,
      totalPoints: 22,
      bestPlacement: 1,
      latestMatchPlacement: 1,
    });
    expect(standings[1]).toMatchObject({
      rank: 2,
      teamId: "team-a",
      matchesPlayed: 2,
      wwcd: 1,
      placementPoints: 16,
      totalKills: 5,
      killPoints: 5,
      totalPoints: 21,
      bestPlacement: 1,
      latestMatchPlacement: 2,
    });
  });

  it("changes the winner when configurable tiebreak priority changes", () => {
    const tiedMatch = match("match-1", 1, [
      result("team-a", 1, 0),
      result("team-b", 2, 4),
    ]);

    const wwcdFirst = calculateTournamentStandings(
      [tiedMatch],
      config(["WWCD", "TOTAL_KILLS"]),
    );
    const killsFirst = calculateTournamentStandings(
      [tiedMatch],
      config(["TOTAL_KILLS", "WWCD"]),
    );

    expect(wwcdFirst.map(({ teamId }) => teamId)).toEqual([
      "team-a",
      "team-b",
    ]);
    expect(killsFirst.map(({ teamId }) => teamId)).toEqual([
      "team-b",
      "team-a",
    ]);
  });

  it("uses the second tiebreak criterion when the first also ties", () => {
    const standings = calculateTournamentStandings(
      [
        match("match-1", 1, [
          result("team-a", 1, 2),
          result("team-b", 2, 3),
        ]),
        match("match-2", 2, [
          result("team-a", 2, 3),
          { ...result("team-b", 1, 3), penaltyPoints: 1 },
        ]),
      ],
      config(["WWCD", "TOTAL_KILLS"]),
    );

    expect(standings.map(({ teamId }) => teamId)).toEqual([
      "team-b",
      "team-a",
    ]);
  });

  it("recalculates standings from edited raw results", () => {
    const originalMatch = match("match-1", 1, [
      result("team-a", 1, 0),
      result("team-b", 2, 4),
    ]);
    const editedMatch = match("match-1", 1, [
      result("team-a", 1, 10),
      result("team-b", 2, 0),
    ]);
    const laterMatch = match("match-2", 2, [
      result("team-a", 2, 0),
      result("team-b", 1, 0),
    ]);

    const beforeEdit = calculateTournamentStandings(
      [originalMatch, laterMatch],
      config(["TOTAL_KILLS"]),
    );
    const afterEdit = calculateTournamentStandings(
      [editedMatch, laterMatch],
      config(["TOTAL_KILLS"]),
    );

    expect(beforeEdit.map(({ teamId, totalPoints }) => ({ teamId, totalPoints }))).toEqual([
      { teamId: "team-b", totalPoints: 20 },
      { teamId: "team-a", totalPoints: 16 },
    ]);
    expect(afterEdit[0]).toMatchObject({
      teamId: "team-a",
      matchesPlayed: 2,
      wwcd: 1,
      placementPoints: 16,
      totalKills: 10,
      totalPoints: 26,
    });
    expect(afterEdit[1]).toMatchObject({
      teamId: "team-b",
      totalKills: 0,
      totalPoints: 16,
    });
  });

  it("keeps DNP distinct from participating with zero kills", () => {
    const dnp: MatchResult = {
      teamId: "team-a",
      placement: null,
      kills: null,
      didNotParticipate: true,
    };
    const standings = calculateTournamentStandings(
      [match("match-1", 1, [dnp, result("team-b", 1, 0)])],
      config(),
    );
    const dnpStanding = standings.find(({ teamId }) => teamId === "team-a");
    const zeroKillStanding = standings.find(
      ({ teamId }) => teamId === "team-b",
    );

    expect(dnpStanding).toMatchObject({
      matchesPlayed: 0,
      wwcd: 0,
      placementPoints: 0,
      totalKills: 0,
      totalPoints: 0,
      bestPlacement: null,
      latestMatchPlacement: null,
    });
    expect(zeroKillStanding).toMatchObject({
      matchesPlayed: 1,
      wwcd: 1,
      totalKills: 0,
      bestPlacement: 1,
      latestMatchPlacement: 1,
    });
  });

  it("aggregates bonuses and penalties across multiple matches", () => {
    const standings = calculateTournamentStandings(
      [
        match("match-1", 1, [
          { ...result("team-a", 1, 0), bonusPoints: 2 },
          result("team-b", 2, 0),
        ]),
        match("match-2", 2, [
          { ...result("team-a", 2, 0), penaltyPoints: 3 },
          result("team-b", 1, 0),
        ]),
      ],
      config(),
    );
    const adjustedStanding = standings.find(
      ({ teamId }) => teamId === "team-a",
    );

    expect(adjustedStanding).toMatchObject({
      placementPoints: 16,
      bonusPoints: 2,
      penaltyPoints: 3,
      totalPoints: 15,
    });
  });
});
