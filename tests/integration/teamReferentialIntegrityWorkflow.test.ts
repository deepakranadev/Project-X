import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import type {
  StoredMatchResult,
  TournamentMatch,
} from "../../src/domain/matches/types";
import { TeamDeletionError } from "../../src/domain/teams/errors";
import type { GuestTeam as Team } from "../../src/features/teams/types";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import type { GuestTournament as Tournament } from "../../src/features/tournaments/types";
import { loadGuestOverallStandings } from "../../src/features/standings/loadGuestOverallStandings";
import { GuestDatabase } from "../../src/infrastructure/persistence/indexed-db/guestDatabase";
import { IndexedDbMatchLifecycleRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchLifecycleRepository";
import { IndexedDbMatchRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchRepository";
import { IndexedDbMatchResultRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchResultRepository";
import { IndexedDbTeamRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTournamentRepository";

const timestamp = "2026-09-07T08:00:00.000Z";
const tournament: Tournament = {
  id: "tournament-one",
  name: "Referential Masters",
  game: "BGMI",
  tournamentLogo: null,
  organizerName: null,
  organizerLogo: null,
  scoringConfig: createBgmiStandardScoringConfig(),
  createdAt: timestamp,
  updatedAt: timestamp,
};

function team(id: string, slotNumber: number): Team {
  return {
    id,
    tournamentId: tournament.id,
    name: `Team ${id}`,
    shortName: null,
    slotNumber,
    logo: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function result(
  matchId: string,
  teamId: string,
  placement: number,
  kills: number,
): StoredMatchResult {
  return {
    id: `${matchId}-${teamId}`,
    tournamentId: tournament.id,
    matchId,
    teamId,
    placement,
    kills,
    participationStatus: "PLAYED",
    source: "MANUAL",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("team deletion with finalized history", () => {
  it("rejects deletion and preserves the finalized match, raw rows, standings, identities, and timestamps", async () => {
    const database = new GuestDatabase({
      databaseName: "team-reference-finalized-workflow-test",
      indexedDbFactory: new IDBFactory(),
    });
    const tournaments = new IndexedDbTournamentRepository({ database });
    const teams = new IndexedDbTeamRepository({ database });
    const matches = new IndexedDbMatchRepository({ database });
    const results = new IndexedDbMatchResultRepository({ database });
    const lifecycle = new IndexedDbMatchLifecycleRepository({
      database,
      now: () => "2026-09-07T09:00:00.000Z",
    });
    await tournaments.createTournament(tournament);
    await teams.bulkCreateTeams([team("one", 1), team("two", 2)]);
    const draft: TournamentMatch = {
      id: "match-one",
      tournamentId: tournament.id,
      matchNumber: 1,
      status: "DRAFT",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await matches.createMatch(draft);
    await expect(
      lifecycle.finalizeMatch({
        tournamentId: tournament.id,
        matchId: draft.id,
        name: "Erangel",
        results: [
          result(draft.id, "one", 1, 7),
          result(draft.id, "two", 2, 0),
        ],
      }),
    ).resolves.toMatchObject({ ok: true });
    const teamBefore = await teams.getTeam(tournament.id, "one");
    const matchBefore = await matches.getMatch(tournament.id, draft.id);
    const resultsBefore = await results.getResultsByMatch(
      tournament.id,
      draft.id,
    );
    const standingsBefore = await loadGuestOverallStandings({
      tournament,
      teams: await teams.listTeamsByTournament(tournament.id),
      matchRepository: matches,
      matchResultRepository: results,
    });

    await expect(teams.deleteTeam(tournament.id, "one")).rejects.toBeInstanceOf(
      TeamDeletionError,
    );

    await expect(teams.getTeam(tournament.id, "one")).resolves.toEqual(
      teamBefore,
    );
    await expect(matches.getMatch(tournament.id, draft.id)).resolves.toEqual(
      matchBefore,
    );
    await expect(
      results.getResultsByMatch(tournament.id, draft.id),
    ).resolves.toEqual(resultsBefore);
    await expect(
      loadGuestOverallStandings({
        tournament,
        teams: await teams.listTeamsByTournament(tournament.id),
        matchRepository: matches,
        matchResultRepository: results,
      }),
    ).resolves.toEqual(standingsBefore);
    expect(matchBefore?.status).toBe("FINALIZED");
    expect(standingsBefore.standings).toMatchObject([
      { teamId: "one", rank: 1, matchesPlayed: 1 },
      { teamId: "two", rank: 2, matchesPlayed: 1 },
    ]);
    await database.close();
  });
});
