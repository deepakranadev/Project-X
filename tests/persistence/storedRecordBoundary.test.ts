import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it, vi } from "vitest";

import { calculateOverallStandings } from "../../src/domain/standings/calculateOverallStandings";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import {
  GuestDatabase,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  TEAM_STORE,
  TOURNAMENT_STORE,
} from "../../src/infrastructure/persistence/indexed-db/guestDatabase";
import { IndexedDbMatchRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchRepository";
import { IndexedDbMatchResultRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchResultRepository";
import { IndexedDbTeamRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTournamentRepository";
import {
  observeTransaction,
  requestToPromise,
} from "../../src/infrastructure/persistence/indexed-db/indexedDbUtils";
import { loadGuestOverallStandings } from "../../src/features/standings/loadGuestOverallStandings";
import type { PersistenceError } from "../../src/infrastructure/persistence/indexed-db/persistenceErrors";

vi.mock("../../src/domain/standings/calculateOverallStandings", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../src/domain/standings/calculateOverallStandings")
  >();
  return {
    ...actual,
    calculateOverallStandings: vi.fn(actual.calculateOverallStandings),
  };
});

const timestamp = "2026-09-08T10:00:00.000Z";

function validTournament(overrides: Record<string, unknown> = {}) {
  return {
    id: "tournament-one",
    name: "Boundary Masters",
    game: "BGMI",
    tournamentLogo: null,
    organizerName: null,
    organizerLogo: null,
    scoringConfig: createBgmiStandardScoringConfig(),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function validTeam(overrides: Record<string, unknown> = {}) {
  return {
    id: "team-one",
    tournamentId: "tournament-one",
    name: "Team One",
    shortName: null,
    slotNumber: 1,
    logo: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function validMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-one",
    tournamentId: "tournament-one",
    matchNumber: 1,
    status: "FINALIZED",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function validResult(overrides: Record<string, unknown> = {}) {
  return {
    id: "result-one",
    tournamentId: "tournament-one",
    matchId: "match-one",
    teamId: "team-one",
    placement: 1,
    kills: 2,
    participationStatus: "PLAYED",
    source: "MANUAL",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

async function seed(
  database: GuestDatabase,
  storeName: string,
  value: unknown,
): Promise<void> {
  const connection = await database.getConnection();
  const transaction = connection.transaction(storeName, "readwrite");
  const completion = observeTransaction(transaction);
  await requestToPromise(transaction.objectStore(storeName).add(value));
  await completion;
}

async function readRaw(
  database: GuestDatabase,
  storeName: string,
  id: string,
): Promise<unknown> {
  const connection = await database.getConnection();
  const transaction = connection.transaction(storeName, "readonly");
  const completion = observeTransaction(transaction);
  const stored = await requestToPromise<unknown>(
    transaction.objectStore(storeName).get(id),
  );
  await completion;
  return stored;
}

function corruptError(entityType: PersistenceError["entityType"]) {
  return expect.objectContaining({
    code: "CORRUPT_STORED_RECORD",
    entityType,
  });
}

describe("IndexedDB runtime record boundary", () => {
  it("rejects and does not rewrite a malformed tournament record", async () => {
    const database = new GuestDatabase({
      databaseName: "corrupt-tournament-boundary-test",
      indexedDbFactory: new IDBFactory(),
    });
    const malformed = validTournament({ name: 42 });
    await seed(database, TOURNAMENT_STORE, malformed);
    const repository = new IndexedDbTournamentRepository({ database });

    await expect(repository.getTournament("tournament-one")).rejects.toEqual(
      corruptError("TOURNAMENT"),
    );
    await expect(readRaw(database, TOURNAMENT_STORE, "tournament-one")).resolves.toEqual(
      malformed,
    );
    await database.close();
  });

  it("rejects and does not rewrite a malformed team record", async () => {
    const database = new GuestDatabase({
      databaseName: "corrupt-team-boundary-test",
      indexedDbFactory: new IDBFactory(),
    });
    const malformed = validTeam({ slotNumber: "first" });
    await seed(database, TEAM_STORE, malformed);
    const repository = new IndexedDbTeamRepository({ database });

    await expect(
      repository.listTeamsByTournament("tournament-one"),
    ).rejects.toEqual(corruptError("TEAM"));
    await expect(readRaw(database, TEAM_STORE, "team-one")).resolves.toEqual(
      malformed,
    );
    await database.close();
  });

  it("rejects and does not normalize a malformed match record", async () => {
    const database = new GuestDatabase({
      databaseName: "corrupt-match-boundary-test",
      indexedDbFactory: new IDBFactory(),
    });
    const malformed = validMatch({ status: "LOCKED", name: "  bad  " });
    await seed(database, MATCH_STORE, malformed);
    const repository = new IndexedDbMatchRepository({ database });

    await expect(
      repository.listMatchesByTournament("tournament-one"),
    ).rejects.toEqual(corruptError("MATCH"));
    await expect(readRaw(database, MATCH_STORE, "match-one")).resolves.toEqual(
      malformed,
    );
    await database.close();
  });

  it("rejects corrupt competitive data before it can reach scoring", async () => {
    vi.mocked(calculateOverallStandings).mockClear();
    const database = new GuestDatabase({
      databaseName: "corrupt-result-boundary-test",
      indexedDbFactory: new IDBFactory(),
    });
    await seed(database, TOURNAMENT_STORE, validTournament());
    await seed(database, TEAM_STORE, validTeam());
    await seed(database, MATCH_STORE, validMatch());
    const malformed = validResult({ kills: "many" });
    await seed(database, MATCH_RESULT_STORE, malformed);
    const tournaments = new IndexedDbTournamentRepository({ database });
    const teams = new IndexedDbTeamRepository({ database });
    const matches = new IndexedDbMatchRepository({ database });
    const results = new IndexedDbMatchResultRepository({ database });
    const tournament = await tournaments.getTournament("tournament-one");
    if (!tournament) throw new Error("The valid tournament fixture was not loaded.");

    await expect(
      loadGuestOverallStandings({
        tournament,
        teams: await teams.listTeamsByTournament(tournament.id),
        matchRepository: matches,
        matchResultRepository: results,
      }),
    ).rejects.toEqual(corruptError("MATCH_RESULT"));
    expect(calculateOverallStandings).not.toHaveBeenCalled();
    await expect(
      readRaw(database, MATCH_RESULT_STORE, "result-one"),
    ).resolves.toEqual(malformed);
    await database.close();
  });

  it("accepts valid current-v4 records through every repository read boundary", async () => {
    const database = new GuestDatabase({
      databaseName: "valid-v4-record-boundary-test",
      indexedDbFactory: new IDBFactory(),
    });
    await seed(database, TOURNAMENT_STORE, validTournament());
    await seed(database, TEAM_STORE, validTeam());
    await seed(database, MATCH_STORE, validMatch());
    await seed(database, MATCH_RESULT_STORE, validResult());

    const tournaments = new IndexedDbTournamentRepository({ database });
    const teams = new IndexedDbTeamRepository({ database });
    const matches = new IndexedDbMatchRepository({ database });
    const results = new IndexedDbMatchResultRepository({ database });
    await expect(tournaments.getTournament("tournament-one")).resolves.toMatchObject({
      id: "tournament-one",
    });
    await expect(teams.listTeamsByTournament("tournament-one")).resolves.toHaveLength(1);
    await expect(matches.listMatchesByTournament("tournament-one")).resolves.toHaveLength(1);
    await expect(
      results.getResultsByMatch("tournament-one", "match-one"),
    ).resolves.toHaveLength(1);
    await database.close();
  });
});
