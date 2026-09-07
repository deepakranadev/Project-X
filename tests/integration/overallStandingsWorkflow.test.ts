import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import type {
  StoredMatchResult,
  TournamentMatch,
} from "../../src/domain/matches/types";
import type { Team } from "../../src/domain/teams/types";
import type { Tournament } from "../../src/domain/tournaments/types";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import { finalizeGuestMatch } from "../../src/lib/persistence/finalizeGuestMatch";
import { GuestDatabase } from "../../src/lib/persistence/guestDatabase";
import { IndexedDbMatchRepository } from "../../src/lib/persistence/indexedDbMatchRepository";
import { IndexedDbMatchResultRepository } from "../../src/lib/persistence/indexedDbMatchResultRepository";
import { IndexedDbTeamRepository } from "../../src/lib/persistence/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/lib/persistence/indexedDbTournamentRepository";
import { loadGuestOverallStandings } from "../../src/lib/persistence/loadGuestOverallStandings";

const tournament: Tournament = {
  id: "tournament-one",
  name: "Standings Masters",
  game: "BGMI",
  tournamentLogo: null,
  organizerName: null,
  organizerLogo: null,
  scoringConfig: createBgmiStandardScoringConfig(),
  createdAt: "2026-09-06T10:00:00.000Z",
  updatedAt: "2026-09-06T10:00:00.000Z",
};

function team(id: string, slotNumber: number): Team {
  return {
    id,
    tournamentId: tournament.id,
    name: `Team ${id}`,
    shortName: null,
    slotNumber,
    logo: null,
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

function match(id: string, matchNumber: number): TournamentMatch {
  return {
    id,
    tournamentId: tournament.id,
    matchNumber,
    status: "DRAFT",
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

function result(
  matchId: string,
  teamId: string,
  placement: number | null,
  kills: number | null,
  participationStatus: "PLAYED" | "DNP" = "PLAYED",
): StoredMatchResult {
  return {
    id: `${matchId}-${teamId}`,
    tournamentId: tournament.id,
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

describe("overall standings persistence workflow", () => {
  it("derives standings from finalized raw data through reopen, re-finalize, and delete transitions", async () => {
    const database = new GuestDatabase({
      databaseName: "overall-standings-workflow-test",
      indexedDbFactory: new IDBFactory(),
    });
    const tournaments = new IndexedDbTournamentRepository({ database });
    const teams = new IndexedDbTeamRepository({ database });
    const matches = new IndexedDbMatchRepository({ database });
    const results = new IndexedDbMatchResultRepository({ database });
    await tournaments.createTournament(tournament);
    await teams.bulkCreateTeams([
      team("one", 1),
      team("two", 2),
      team("three", 3),
    ]);
    await matches.createMatch(match("match-one", 1));
    await matches.createMatch(match("match-two", 2));
    const finalizedRows = [
      result("match-one", "one", 1, 3),
      result("match-one", "two", 2, 0),
      result("match-one", "three", null, null, "DNP"),
    ];
    await finalizeGuestMatch({
      tournamentId: tournament.id,
      matchId: "match-one",
      results: finalizedRows,
      matchRepository: matches,
      matchResultRepository: results,
      teamRepository: teams,
    });
    await results.saveDraftResults(tournament.id, "match-two", [
      result("match-two", "one", 2, 99),
    ]);
    await teams.createTeam(team("new-team", 4));

    const load = () =>
      loadGuestOverallStandings({
        tournament,
        matchRepository: matches,
        matchResultRepository: results,
        teamRepository: teams,
      });
    const finalized = await load();
    expect(finalized).toMatchObject({
      totalMatchCount: 2,
      finalizedMatchCount: 1,
      draftMatchCount: 1,
    });
    expect(finalized.standings.find((row) => row.teamId === "one")).toMatchObject({
      matchesPlayed: 1,
      placementPoints: 10,
      killPoints: 3,
      totalPoints: 13,
    });
    expect(finalized.standings.find((row) => row.teamId === "two")).toMatchObject({
      matchesPlayed: 1,
      killPoints: 0,
    });
    expect(finalized.standings.find((row) => row.teamId === "three")).toMatchObject({
      matchesPlayed: 0,
      totalPoints: 0,
    });
    expect(finalized.standings.find((row) => row.teamId === "new-team")).toMatchObject({
      matchesPlayed: 0,
      totalPoints: 0,
    });

    const storedRawRows = await results.getResultsByMatch(
      tournament.id,
      "match-one",
    );
    for (const stored of storedRawRows) {
      expect(stored).not.toHaveProperty("placementPoints");
      expect(stored).not.toHaveProperty("killPoints");
      expect(stored).not.toHaveProperty("totalPoints");
    }

    await matches.updateMatch(tournament.id, "match-one", { status: "DRAFT" });
    const reopened = await load();
    expect(reopened.finalizedMatchCount).toBe(0);
    expect(reopened.standings.every((row) => row.totalPoints === 0)).toBe(true);

    await finalizeGuestMatch({
      tournamentId: tournament.id,
      matchId: "match-one",
      results: [
        ...finalizedRows,
        result("match-one", "new-team", null, null, "DNP"),
      ],
      matchRepository: matches,
      matchResultRepository: results,
      teamRepository: teams,
    });
    const restored = await load();
    expect(restored.finalizedMatchCount).toBe(1);
    expect(restored.standings.find((row) => row.teamId === "one")?.totalPoints).toBe(13);

    await matches.deleteMatch(tournament.id, "match-one");
    const deleted = await load();
    expect(deleted).toMatchObject({
      totalMatchCount: 1,
      finalizedMatchCount: 0,
      draftMatchCount: 1,
    });
    expect(deleted.standings.every((row) => row.totalPoints === 0)).toBe(true);
    await database.close();
  });
});
