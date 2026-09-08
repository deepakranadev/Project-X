import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import { TeamDeletionError } from "../../src/domain/teams/errors";
import type {
  StoredMatchResult,
  TournamentMatch,
} from "../../src/domain/matches/types";
import type { GuestTeam as Team } from "../../src/features/teams/types";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import type { GuestTournament as Tournament } from "../../src/features/tournaments/types";
import {
  GuestDatabase,
  MATCH_RESULT_STORE,
} from "../../src/infrastructure/persistence/indexed-db/guestDatabase";
import { IndexedDbMatchRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchRepository";
import { IndexedDbMatchResultRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchResultRepository";
import { IndexedDbTeamRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTournamentRepository";
import { requestToPromise } from "../../src/infrastructure/persistence/indexed-db/indexedDbUtils";

const createdAt = "2026-09-07T08:00:00.000Z";

function tournament(id: string): Tournament {
  return {
    id,
    name: `Tournament ${id}`,
    game: "BGMI",
    tournamentLogo: null,
    organizerName: null,
    organizerLogo: null,
    scoringConfig: createBgmiStandardScoringConfig(),
    createdAt,
    updatedAt: createdAt,
  };
}

function team(
  id: string,
  tournamentId = "tournament-one",
  slotNumber = 1,
): Team {
  return {
    id,
    tournamentId,
    name: `Team ${id}`,
    shortName: null,
    slotNumber,
    logo: null,
    createdAt,
    updatedAt: createdAt,
  };
}

function match(
  id: string,
  matchNumber: number,
  tournamentId = "tournament-one",
): TournamentMatch {
  return {
    id,
    tournamentId,
    matchNumber,
    status: "DRAFT",
    createdAt,
    updatedAt: createdAt,
  };
}

function result(
  matchId: string,
  teamId: string,
  tournamentId = "tournament-one",
): StoredMatchResult {
  return {
    id: `${matchId}-${teamId}`,
    tournamentId,
    matchId,
    teamId,
    placement: null,
    kills: null,
    participationStatus: "PLAYED",
    source: "MANUAL",
    createdAt,
    updatedAt: createdAt,
  };
}

async function setup(databaseName: string) {
  const database = new GuestDatabase({
    databaseName,
    indexedDbFactory: new IDBFactory(),
  });
  const tournaments = new IndexedDbTournamentRepository({ database });
  const teams = new IndexedDbTeamRepository({
    database,
    now: () => "2026-09-07T09:00:00.000Z",
  });
  const matches = new IndexedDbMatchRepository({ database });
  const results = new IndexedDbMatchResultRepository({ database });

  await tournaments.createTournament(tournament("tournament-one"));
  await tournaments.createTournament(tournament("tournament-two"));
  await teams.bulkCreateTeams([
    team("one", "tournament-one", 1),
    team("two", "tournament-one", 2),
  ]);
  await teams.createTeam(team("other", "tournament-two", 1));

  return { database, matches, results, teams, tournaments };
}

async function addDraftReference(
  repositories: Awaited<ReturnType<typeof setup>>,
  matchId: string,
  matchNumber: number,
  teamId = "one",
): Promise<void> {
  await repositories.matches.createMatch(match(matchId, matchNumber));
  await repositories.results.saveDraftResults("tournament-one", matchId, [
    result(matchId, teamId),
  ]);
}

describe("team referential integrity", () => {
  it("blocks deletion for a Draft result with a typed domain error and changes nothing", async () => {
    const repositories = await setup("team-reference-draft-test");
    await addDraftReference(repositories, "match-one", 1);
    const teamBefore = await repositories.teams.getTeam("tournament-one", "one");
    const matchBefore = await repositories.matches.getMatch(
      "tournament-one",
      "match-one",
    );
    const resultsBefore = await repositories.results.getResultsByMatch(
      "tournament-one",
      "match-one",
    );

    let thrown: unknown;
    try {
      await repositories.teams.deleteTeam("tournament-one", "one");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(TeamDeletionError);
    expect(thrown).toMatchObject({
      code: "TEAM_HAS_MATCH_HISTORY",
      tournamentId: "tournament-one",
      teamId: "one",
      message: "This team can't be deleted because it already has match history.",
    });
    await expect(
      repositories.teams.getTeam("tournament-one", "one"),
    ).resolves.toEqual(teamBefore);
    await expect(
      repositories.matches.getMatch("tournament-one", "match-one"),
    ).resolves.toEqual(matchBefore);
    await expect(
      repositories.results.getResultsByMatch("tournament-one", "match-one"),
    ).resolves.toEqual(resultsBefore);
    await repositories.database.close();
  });

  it("blocks deletion when the team is referenced by multiple matches", async () => {
    const repositories = await setup("team-reference-multiple-test");
    await addDraftReference(repositories, "match-one", 1);
    await addDraftReference(repositories, "match-two", 2);

    await expect(
      repositories.teams.deleteTeam("tournament-one", "one"),
    ).rejects.toMatchObject({ code: "TEAM_HAS_MATCH_HISTORY" });
    await expect(
      repositories.matches.listMatchesByTournament("tournament-one"),
    ).resolves.toHaveLength(2);
    await expect(
      repositories.results.getResultsByMatch("tournament-one", "match-one"),
    ).resolves.toHaveLength(1);
    await expect(
      repositories.results.getResultsByMatch("tournament-one", "match-two"),
    ).resolves.toHaveLength(1);
    await repositories.database.close();
  });

  it("does not treat another tournament's match history as a reference", async () => {
    const repositories = await setup("team-reference-unrelated-test");
    await repositories.matches.createMatch(
      match("other-match", 1, "tournament-two"),
    );
    await repositories.results.saveDraftResults(
      "tournament-two",
      "other-match",
      [result("other-match", "other", "tournament-two")],
    );

    await repositories.teams.deleteTeam("tournament-one", "one");

    await expect(
      repositories.teams.getTeam("tournament-one", "one"),
    ).resolves.toBeNull();
    await expect(
      repositories.teams.getTeam("tournament-two", "other"),
    ).resolves.not.toBeNull();
    await expect(
      repositories.results.getResultsByMatch("tournament-two", "other-match"),
    ).resolves.toHaveLength(1);
    await repositories.database.close();
  });

  it("allows deletion after the only referencing match cascades its results", async () => {
    const repositories = await setup("team-reference-delete-match-test");
    await addDraftReference(repositories, "match-one", 1);

    await repositories.matches.deleteMatch("tournament-one", "match-one");
    await repositories.teams.deleteTeam("tournament-one", "one");

    await expect(
      repositories.results.getResultsByMatch("tournament-one", "match-one"),
    ).resolves.toEqual([]);
    await expect(
      repositories.teams.getTeam("tournament-one", "one"),
    ).resolves.toBeNull();
    await repositories.database.close();
  });

  it("stays blocked after one of two referencing matches is deleted, then succeeds after both", async () => {
    const repositories = await setup("team-reference-delete-all-matches-test");
    await addDraftReference(repositories, "match-one", 1);
    await addDraftReference(repositories, "match-two", 2);

    await repositories.matches.deleteMatch("tournament-one", "match-one");
    await expect(
      repositories.teams.deleteTeam("tournament-one", "one"),
    ).rejects.toMatchObject({ code: "TEAM_HAS_MATCH_HISTORY" });
    await repositories.matches.deleteMatch("tournament-one", "match-two");
    await repositories.teams.deleteTeam("tournament-one", "one");

    await expect(
      repositories.teams.getTeam("tournament-one", "one"),
    ).resolves.toBeNull();
    await repositories.database.close();
  });

  it("keeps team edits and roster reordering available when history exists", async () => {
    const repositories = await setup("team-reference-edit-reorder-test");
    await addDraftReference(repositories, "match-one", 1);

    await expect(
      repositories.teams.updateTeam("tournament-one", "one", {
        name: "Renamed Team",
        shortName: "RT",
      }),
    ).resolves.toMatchObject({ name: "Renamed Team", shortName: "RT" });
    await expect(
      repositories.teams.reorderTeams("tournament-one", ["two", "one"]),
    ).resolves.toMatchObject([
      { id: "two", slotNumber: 1 },
      { id: "one", slotNumber: 2 },
    ]);
    await expect(
      repositories.results.getResultsByMatch("tournament-one", "match-one"),
    ).resolves.toMatchObject([{ teamId: "one" }]);
    await repositories.database.close();
  });

  it("lets tournament deletion bypass the individual guard and cascade its full graph", async () => {
    const repositories = await setup("team-reference-tournament-cascade-test");
    await addDraftReference(repositories, "match-one", 1);
    await repositories.matches.createMatch(
      match("other-match", 1, "tournament-two"),
    );
    await repositories.results.saveDraftResults(
      "tournament-two",
      "other-match",
      [result("other-match", "other", "tournament-two")],
    );

    await repositories.tournaments.deleteTournament("tournament-one");

    await expect(
      repositories.tournaments.getTournament("tournament-one"),
    ).resolves.toBeNull();
    await expect(
      repositories.teams.listTeamsByTournament("tournament-one"),
    ).resolves.toEqual([]);
    await expect(
      repositories.matches.listMatchesByTournament("tournament-one"),
    ).resolves.toEqual([]);
    const connection = await repositories.database.getConnection();
    const transaction = connection.transaction(MATCH_RESULT_STORE, "readonly");
    await expect(
      requestToPromise<StoredMatchResult[]>(
        transaction.objectStore(MATCH_RESULT_STORE).getAll(),
      ),
    ).resolves.toMatchObject([
      {
        id: "other-match-other",
        tournamentId: "tournament-two",
        matchId: "other-match",
        teamId: "other",
      },
    ]);
    await expect(
      repositories.teams.getTeam("tournament-two", "other"),
    ).resolves.not.toBeNull();
    await repositories.database.close();
  });
});
