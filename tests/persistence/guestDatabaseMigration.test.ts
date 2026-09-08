import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import { validateScoringConfig } from "../../src/domain/scoring/validateScoringConfig";
import type { Team } from "../../src/domain/teams/types";
import type { Tournament } from "../../src/domain/tournaments/types";
import { BGMI_STANDARD_SCORING_CONFIG } from "../../src/domain/tournaments/scoringPresets";
import {
  GUEST_DATABASE_VERSION,
  MATCH_RESULT_MATCH_INDEX,
  MATCH_RESULT_MATCH_TEAM_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  MATCH_TOURNAMENT_INDEX,
  MATCH_TOURNAMENT_NUMBER_INDEX,
  TEAM_STORE,
  TEAM_TOURNAMENT_INDEX,
  TEAM_TOURNAMENT_SLOT_INDEX,
  TOURNAMENT_STORE,
} from "../../src/infrastructure/persistence/indexed-db/guestDatabase";
import { IndexedDbTeamRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTournamentRepository";

const legacyTournament: Omit<Tournament, "scoringConfig"> = {
  id: "legacy-tournament",
  name: "Earlier Task Tournament",
  game: "BGMI",
  tournamentLogo: null,
  organizerName: "Legacy Organizer",
  organizerLogo: null,
  createdAt: "2026-09-06T10:00:00.000Z",
  updatedAt: "2026-09-06T10:00:00.000Z",
};

const legacyTeam: Team = {
  id: "legacy-team",
  tournamentId: "legacy-tournament",
  name: "Team Soul",
  shortName: "SOUL",
  slotNumber: 1,
  logo: null,
  createdAt: "2026-09-06T11:00:00.000Z",
  updatedAt: "2026-09-06T11:00:00.000Z",
};

function seedLegacyDatabase(
  factory: IDBFactory,
  databaseName: string,
  version: 1 | 2 | 3,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = factory.open(databaseName, version);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore(TOURNAMENT_STORE, { keyPath: "id" });
      if (version >= 2) {
        const teamStore = database.createObjectStore(TEAM_STORE, {
          keyPath: "id",
        });
        teamStore.createIndex(TEAM_TOURNAMENT_INDEX, "tournamentId", {
          unique: false,
        });
        teamStore.createIndex(
          TEAM_TOURNAMENT_SLOT_INDEX,
          ["tournamentId", "slotNumber"],
          { unique: true },
        );
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const storeNames = version >= 2
        ? [TOURNAMENT_STORE, TEAM_STORE]
        : [TOURNAMENT_STORE];
      const transaction = database.transaction(storeNames, "readwrite");
      transaction.objectStore(TOURNAMENT_STORE).add(
        version === 3
          ? { ...legacyTournament, scoringConfig: BGMI_STANDARD_SCORING_CONFIG }
          : legacyTournament,
      );
      if (version >= 2) {
        transaction.objectStore(TEAM_STORE).add(legacyTeam);
      }
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
    };
  });
}

describe("guest database migrations", () => {
  it("upgrades a Task 002A v1 tournament directly to the current schema", async () => {
    const factory = new IDBFactory();
    const databaseName = "guest-database-v1-current-migration-test";
    await seedLegacyDatabase(factory, databaseName, 1);
    const tournaments = new IndexedDbTournamentRepository({
      databaseName,
      indexedDbFactory: factory,
    });

    const migrated = await tournaments.getTournament("legacy-tournament");

    expect(migrated).toMatchObject(legacyTournament);
    expect(migrated?.scoringConfig).toEqual(BGMI_STANDARD_SCORING_CONFIG);
    expect(validateScoringConfig(migrated?.scoringConfig).valid).toBe(true);
    await tournaments.close();
  });

  it("upgrades Task 002B v2 data to v3 while preserving teams and adding default scoring", async () => {
    const factory = new IDBFactory();
    const databaseName = "guest-database-v2-v3-migration-test";
    await seedLegacyDatabase(factory, databaseName, 2);
    const tournaments = new IndexedDbTournamentRepository({
      databaseName,
      indexedDbFactory: factory,
    });
    const teams = new IndexedDbTeamRepository({
      databaseName,
      indexedDbFactory: factory,
    });

    const migrated = await tournaments.getTournament("legacy-tournament");

    expect(migrated).toMatchObject({
      ...legacyTournament,
      scoringConfig: BGMI_STANDARD_SCORING_CONFIG,
    });
    await expect(
      teams.listTeamsByTournament("legacy-tournament"),
    ).resolves.toEqual([legacyTeam]);

    const inspectRequest = factory.open(databaseName);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      inspectRequest.onsuccess = () => resolve(inspectRequest.result);
      inspectRequest.onerror = () => reject(inspectRequest.error);
    });
    expect(database.version).toBe(GUEST_DATABASE_VERSION);
    expect(database.objectStoreNames.contains(TOURNAMENT_STORE)).toBe(true);
    expect(database.objectStoreNames.contains(TEAM_STORE)).toBe(true);
    database.close();
    await teams.close();
    await tournaments.close();
  });

  it("upgrades the Task 002C v3 schema without touching tournament, team, or scoring data", async () => {
    const factory = new IDBFactory();
    const databaseName = "guest-database-v3-v4-migration-test";
    await seedLegacyDatabase(factory, databaseName, 3);
    const tournaments = new IndexedDbTournamentRepository({
      databaseName,
      indexedDbFactory: factory,
    });
    const teams = new IndexedDbTeamRepository({
      databaseName,
      indexedDbFactory: factory,
    });

    await expect(tournaments.getTournament("legacy-tournament")).resolves.toEqual({
      ...legacyTournament,
      scoringConfig: BGMI_STANDARD_SCORING_CONFIG,
    });
    await expect(teams.listTeamsByTournament("legacy-tournament")).resolves.toEqual([
      legacyTeam,
    ]);

    const inspectRequest = factory.open(databaseName);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      inspectRequest.onsuccess = () => resolve(inspectRequest.result);
      inspectRequest.onerror = () => reject(inspectRequest.error);
    });
    expect(database.version).toBe(4);
    expect([...database.objectStoreNames]).toEqual([
      MATCH_RESULT_STORE,
      MATCH_STORE,
      TEAM_STORE,
      TOURNAMENT_STORE,
    ]);
    const transaction = database.transaction(
      [MATCH_STORE, MATCH_RESULT_STORE],
      "readonly",
    );
    const matchStore = transaction.objectStore(MATCH_STORE);
    expect(matchStore.index(MATCH_TOURNAMENT_INDEX).unique).toBe(false);
    expect(matchStore.index(MATCH_TOURNAMENT_NUMBER_INDEX).unique).toBe(true);
    const resultStore = transaction.objectStore(MATCH_RESULT_STORE);
    expect(resultStore.index(MATCH_RESULT_MATCH_INDEX).unique).toBe(false);
    expect(resultStore.index(MATCH_RESULT_MATCH_TEAM_INDEX).unique).toBe(true);
    database.close();
    await teams.close();
    await tournaments.close();
  });
});
