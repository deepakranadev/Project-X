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

  it("makes 0.1 plus 0.2 competitively equal to 0.3", () => {
    const standings = calculateTournamentStandings(
      [
        match("match-1", 1, [
          result("team-a", 1, 2),
          result("team-b", 2, 0),
        ]),
      ],
      {
        placementPoints: { 1: 0.1, 2: 0.3 },
        pointsPerKill: 0.1,
        tiebreakers: [],
      },
    );

    expect(standings.map(({ teamId, rank, totalPoints }) => ({
      teamId,
      rank,
      totalPoints,
    }))).toEqual([
      { teamId: "team-a", rank: 1, totalPoints: 0.3 },
      { teamId: "team-b", rank: 1, totalPoints: 0.3 },
    ]);
  });

  it("makes three 0.1 finish values competitively equal to 0.3", () => {
    const standings = calculateTournamentStandings(
      [
        match("match-1", 1, [
          result("team-a", 1, 3),
          result("team-b", 2, 0),
        ]),
      ],
      {
        placementPoints: { 1: 0, 2: 0.3 },
        pointsPerKill: 0.1,
        tiebreakers: [],
      },
    );

    expect(standings).toMatchObject([
      { teamId: "team-a", rank: 1, killPoints: 0.3, totalPoints: 0.3 },
      { teamId: "team-b", rank: 1, killPoints: 0, totalPoints: 0.3 },
    ]);
  });

  it("accumulates repeated 0.1 placement scores without drift", () => {
    const matches = Array.from({ length: 30 }, (_, index) =>
      match(`match-${index + 1}`, index + 1, [
        result("team-a", 1, 0),
        result("team-b", 2, 0),
      ]),
    );

    const standings = calculateTournamentStandings(matches, {
      placementPoints: { 1: 0.1, 2: 0 },
      pointsPerKill: 0,
      tiebreakers: [],
    });

    expect(standings[0]).toMatchObject({
      teamId: "team-a",
      matchesPlayed: 30,
      placementPoints: 3,
      totalPoints: 3,
    });
    expect(JSON.stringify(standings)).not.toContain("00000000000000004");
  });

  it("accumulates repeated 0.25 scores exactly", () => {
    const matches = Array.from({ length: 7 }, (_, index) =>
      match(`match-${index + 1}`, index + 1, [
        result("team-a", 1, 0),
        result("team-b", 2, 0),
      ]),
    );

    const standings = calculateTournamentStandings(matches, {
      placementPoints: { 1: 0.25, 2: 0 },
      pointsPerKill: 0,
      tiebreakers: [],
    });

    expect(standings[0]).toMatchObject({
      teamId: "team-a",
      placementPoints: 1.75,
      totalPoints: 1.75,
    });
  });

  it("uses exact decimal totals before applying configured tiebreakers", () => {
    const standings = calculateTournamentStandings(
      [
        match("match-1", 1, [
          result("team-a", 1, 0),
          result("team-b", 2, 1),
        ]),
      ],
      {
        placementPoints: { 1: 0.2, 2: 0.1 },
        pointsPerKill: 0.1,
        tiebreakers: ["PLACEMENT_POINTS"],
      },
    );

    expect(standings).toMatchObject([
      { teamId: "team-a", rank: 1, totalPoints: 0.2 },
      { teamId: "team-b", rank: 2, totalPoints: 0.2 },
    ]);
  });

  it("accumulates decimal placement, finish, bonus, and penalty values across matches", () => {
    const decimalConfig: ScoringConfig = {
      placementPoints: { 1: 0.25, 2: 0.5 },
      pointsPerKill: 0.1,
      tiebreakers: ["TOTAL_KILLS"],
    };
    const standings = calculateTournamentStandings(
      [
        match("match-1", 1, [
          { ...result("team-a", 1, 5), bonusPoints: 1.25 },
          result("team-b", 2, 0),
        ]),
        match("match-2", 2, [
          { ...result("team-a", 2, 2), penaltyPoints: 0.2 },
          result("team-b", 1, 0),
        ]),
        match("match-3", 3, [
          result("team-a", 1, 10),
          result("team-b", 2, 0),
        ]),
      ],
      decimalConfig,
    );

    expect(standings.find(({ teamId }) => teamId === "team-a")).toMatchObject({
      matchesPlayed: 3,
      placementPoints: 1,
      killPoints: 1.7,
      bonusPoints: 1.25,
      penaltyPoints: 0.2,
      totalPoints: 3.75,
    });
  });

  it("keeps explicit-zero DNP at zero while PLAYED with zero finishes still counts", () => {
    const dnp: MatchResult = {
      teamId: "team-a",
      placement: null,
      kills: null,
      didNotParticipate: true,
      bonusPoints: 0,
      penaltyPoints: 0,
    };
    const standings = calculateTournamentStandings(
      [match("match-1", 1, [dnp, result("team-b", 1, 0)])],
      {
        placementPoints: { 1: 0.25 },
        pointsPerKill: 0.1,
        tiebreakers: [],
      },
    );

    expect(standings.find(({ teamId }) => teamId === "team-a")).toMatchObject({
      matchesPlayed: 0,
      placementPoints: 0,
      killPoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      totalPoints: 0,
    });
    expect(standings.find(({ teamId }) => teamId === "team-b")).toMatchObject({
      matchesPlayed: 1,
      killPoints: 0,
      totalPoints: 0.25,
    });
  });
});
