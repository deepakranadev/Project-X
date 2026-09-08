import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import type { StoredMatchResult, TournamentMatch } from "../../src/domain/matches/types";
import type { Team } from "../../src/domain/teams/types";
import type { Tournament } from "../../src/domain/tournaments/types";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import {
  GuestDatabase,
  MATCH_RESULT_STORE,
} from "../../src/infrastructure/persistence/indexed-db/guestDatabase";
import { IndexedDbMatchRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchRepository";
import {
  IndexedDbMatchResultRepository,
  MatchResultRepositoryError,
} from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchResultRepository";
import { IndexedDbTeamRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTournamentRepository";
import { requestToPromise } from "../../src/infrastructure/persistence/indexed-db/indexedDbUtils";

function tournament(id: string): Tournament {
  return {
    id,
    name: `Tournament ${id}`,
    game: "BGMI",
    tournamentLogo: null,
    organizerName: null,
    organizerLogo: null,
    scoringConfig: createBgmiStandardScoringConfig(),
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

function team(id: string, tournamentId = "tournament-one"): Team {
  return {
    id,
    tournamentId,
    name: `Team ${id}`,
    shortName: null,
    slotNumber: null,
    logo: null,
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

function match(id: string, tournamentId = "tournament-one"): TournamentMatch {
  return {
    id,
    tournamentId,
    matchNumber: 1,
    status: "DRAFT",
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

function result(teamId: string, overrides: Partial<StoredMatchResult> = {}): StoredMatchResult {
  return {
    id: `result-${teamId}`,
    tournamentId: "tournament-one",
    matchId: "match-one",
    teamId,
    placement: null,
    kills: null,
    participationStatus: "PLAYED",
    source: "MANUAL",
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
    ...overrides,
  };
}

async function setup(databaseName: string, factory = new IDBFactory()) {
  const database = new GuestDatabase({ databaseName, indexedDbFactory: factory });
  const tournaments = new IndexedDbTournamentRepository({ database });
  const teams = new IndexedDbTeamRepository({ database });
  const matches = new IndexedDbMatchRepository({ database });
  const results = new IndexedDbMatchResultRepository({
    database,
    now: () => "2026-09-06T12:00:00.000Z",
  });
  await tournaments.createTournament(tournament("tournament-one"));
  await tournaments.createTournament(tournament("tournament-two"));
  await teams.bulkCreateTeams([team("one"), team("two")]);
  await teams.createTeam(team("foreign", "tournament-two"));
  await matches.createMatch(match("match-one"));
  await matches.createMatch(match("foreign-match", "tournament-two"));
  return { database, tournaments, teams, matches, results };
}

describe("IndexedDbMatchResultRepository", () => {
  it("bulk saves one draft result per team and rejects duplicates", async () => {
    const { database, results } = await setup("result-bulk-test");
    await expect(results.bulkSaveResults("tournament-one", "match-one", [
      result("one", { placement: 1, kills: 5 }),
      result("two", { placement: 2, kills: 0 }),
    ])).resolves.toHaveLength(2);

    await expect(results.bulkSaveResults("tournament-one", "match-one", [
      result("one"),
      result("one", { id: "another-result" }),
    ])).rejects.toMatchObject<Partial<MatchResultRepositoryError>>({
      code: "DUPLICATE_TEAM_RESULT",
    });
    await expect(results.bulkSaveResults("tournament-one", "match-one", [
      result("one", { id: "shared-id" }),
      result("two", { id: "shared-id" }),
    ])).rejects.toMatchObject<Partial<MatchResultRepositoryError>>({
      code: "INVALID_RESULT",
    });
    await database.close();
  });

  it("persists a partial draft across an IndexedDB reopen", async () => {
    const factory = new IDBFactory();
    const databaseName = "result-reopen-test";
    const { database, results } = await setup(databaseName, factory);
    await results.saveDraftResults("tournament-one", "match-one", [
      result("one", { placement: 1, kills: null }),
    ]);
    await database.close();

    const reopened = new IndexedDbMatchResultRepository({
      databaseName,
      indexedDbFactory: factory,
    });
    await expect(reopened.getResultsByMatch("tournament-one", "match-one")).resolves.toMatchObject([
      { teamId: "one", placement: 1, kills: null, participationStatus: "PLAYED" },
    ]);
    await reopened.close();
  });

  it("edits placement and finishes while preserving result identity and createdAt", async () => {
    const { database, results } = await setup("result-edit-test");
    await results.saveResult("tournament-one", "match-one", result("one", { placement: 1, kills: 4 }));

    const edited = await results.saveResult(
      "tournament-one",
      "match-one",
      result("one", {
        id: "hostile-id",
        createdAt: "2099-01-01T00:00:00.000Z",
        placement: 2,
        kills: 7,
      }),
    );

    expect(edited).toMatchObject({
      id: "result-one",
      createdAt: "2026-09-06T10:00:00.000Z",
      updatedAt: "2026-09-06T12:00:00.000Z",
      placement: 2,
      kills: 7,
    });
    await database.close();
  });

  it("stores DNP as explicit null values and supports transition back to played", async () => {
    const { database, results } = await setup("result-dnp-transition-test");
    const dnp = await results.saveResult("tournament-one", "match-one", result("one", {
      participationStatus: "DNP",
      placement: null,
      kills: null,
    }));
    expect(dnp).toMatchObject({ participationStatus: "DNP", placement: null, kills: null });

    const played = await results.saveResult("tournament-one", "match-one", {
      ...dnp,
      participationStatus: "PLAYED",
      placement: 1,
      kills: 0,
    });
    expect(played).toMatchObject({ participationStatus: "PLAYED", placement: 1, kills: 0 });
    await database.close();
  });

  it("rejects cross-tournament teams, matches, and result context", async () => {
    const { database, results } = await setup("result-context-test");
    await expect(
      results.saveResult("tournament-one", "match-one", result("foreign")),
    ).rejects.toMatchObject<Partial<MatchResultRepositoryError>>({ code: "INVALID_TEAM_REFERENCE" });
    await expect(
      results.saveResult("tournament-one", "foreign-match", result("one", { matchId: "foreign-match" })),
    ).rejects.toMatchObject<Partial<MatchResultRepositoryError>>({ code: "MATCH_NOT_FOUND" });
    await expect(
      results.saveResult("tournament-one", "match-one", result("one", { tournamentId: "tournament-two" })),
    ).rejects.toMatchObject<Partial<MatchResultRepositoryError>>({ code: "RESULT_CONTEXT_MISMATCH" });
    await database.close();
  });

  it("deleting a match removes its associated results in the same persistence operation", async () => {
    const { database, matches, results } = await setup("result-cascade-test");
    await results.bulkSaveResults("tournament-one", "match-one", [result("one"), result("two")]);

    await matches.deleteMatch("tournament-one", "match-one");

    const connection = await database.getConnection();
    const transaction = connection.transaction(MATCH_RESULT_STORE, "readonly");
    await expect(
      requestToPromise(transaction.objectStore(MATCH_RESULT_STORE).getAll()),
    ).resolves.toEqual([]);
    await database.close();
  });
});
