import { createBgmiStandardScoringConfig } from "@/domain/tournaments/scoringPresets";

import {
  classifyPersistenceFailure,
  PersistenceError,
} from "./persistenceErrors";

export const DEFAULT_GUEST_DATABASE_NAME = "pt-forge-guest";
export const GUEST_DATABASE_VERSION = 4;
export const TOURNAMENT_STORE = "tournaments";
export const TEAM_STORE = "teams";
export const TEAM_TOURNAMENT_INDEX = "byTournament";
export const TEAM_TOURNAMENT_SLOT_INDEX = "byTournamentAndSlot";
export const MATCH_STORE = "matches";
export const MATCH_TOURNAMENT_INDEX = "byTournament";
export const MATCH_TOURNAMENT_NUMBER_INDEX = "byTournamentAndNumber";
export const MATCH_RESULT_STORE = "matchResults";
export const MATCH_RESULT_MATCH_INDEX = "byMatch";
export const MATCH_RESULT_MATCH_TEAM_INDEX = "byMatchAndTeam";

export interface GuestDatabaseOptions {
  readonly databaseName?: string;
  readonly indexedDbFactory?: IDBFactory;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addDefaultScoringConfigToLegacyTournaments(
  tournamentStore: IDBObjectStore,
): void {
  const cursorRequest = tournamentStore.openCursor();
  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;
    if (!cursor) return;

    const stored: unknown = cursor.value;
    if (
      isObjectRecord(stored) &&
      (!Object.hasOwn(stored, "scoringConfig") ||
        stored.scoringConfig === undefined)
    ) {
      cursor.update({
        ...stored,
        scoringConfig: createBgmiStandardScoringConfig(),
      });
    }
    cursor.continue();
  };
}

export class GuestDatabase {
  private connection: Promise<IDBDatabase> | null = null;
  private readonly databaseName: string;
  private readonly factory: IDBFactory;

  constructor(options: GuestDatabaseOptions = {}) {
    const factory = options.indexedDbFactory ?? globalThis.indexedDB;
    if (!factory) {
      throw new Error(
        "IndexedDB is unavailable in this browser. Guest data cannot be saved on this device.",
      );
    }

    this.databaseName = options.databaseName ?? DEFAULT_GUEST_DATABASE_NAME;
    this.factory = factory;
  }

  getConnection(): Promise<IDBDatabase> {
    if (!this.connection) {
      const connection = this.openDatabase();
      this.connection = connection;
      void connection.catch(() => {
        if (this.connection === connection) this.connection = null;
      });
    }

    return this.connection;
  }

  async close(): Promise<void> {
    if (!this.connection) return;
    const database = await this.connection;
    database.close();
    this.connection = null;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const request = this.factory.open(
        this.databaseName,
        GUEST_DATABASE_VERSION,
      );

      const rejectOnce = (error: unknown): void => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      request.onupgradeneeded = (event) => {
        const database = request.result;
        if (!database.objectStoreNames.contains(TOURNAMENT_STORE)) {
          database.createObjectStore(TOURNAMENT_STORE, { keyPath: "id" });
        }

        const teamStore = database.objectStoreNames.contains(TEAM_STORE)
          ? request.transaction?.objectStore(TEAM_STORE)
          : database.createObjectStore(TEAM_STORE, { keyPath: "id" });

        if (!teamStore) {
          throw new Error("Unable to prepare guest team storage.");
        }

        if (!teamStore.indexNames.contains(TEAM_TOURNAMENT_INDEX)) {
          teamStore.createIndex(TEAM_TOURNAMENT_INDEX, "tournamentId", {
            unique: false,
          });
        }
        if (!teamStore.indexNames.contains(TEAM_TOURNAMENT_SLOT_INDEX)) {
          teamStore.createIndex(
            TEAM_TOURNAMENT_SLOT_INDEX,
            ["tournamentId", "slotNumber"],
            { unique: true },
          );
        }

        const matchStore = database.objectStoreNames.contains(MATCH_STORE)
          ? request.transaction?.objectStore(MATCH_STORE)
          : database.createObjectStore(MATCH_STORE, { keyPath: "id" });
        if (!matchStore) {
          throw new Error("Unable to prepare guest match storage.");
        }
        if (!matchStore.indexNames.contains(MATCH_TOURNAMENT_INDEX)) {
          matchStore.createIndex(MATCH_TOURNAMENT_INDEX, "tournamentId", {
            unique: false,
          });
        }
        if (!matchStore.indexNames.contains(MATCH_TOURNAMENT_NUMBER_INDEX)) {
          matchStore.createIndex(
            MATCH_TOURNAMENT_NUMBER_INDEX,
            ["tournamentId", "matchNumber"],
            { unique: true },
          );
        }

        const resultStore = database.objectStoreNames.contains(
          MATCH_RESULT_STORE,
        )
          ? request.transaction?.objectStore(MATCH_RESULT_STORE)
          : database.createObjectStore(MATCH_RESULT_STORE, { keyPath: "id" });
        if (!resultStore) {
          throw new Error("Unable to prepare guest match-result storage.");
        }
        if (!resultStore.indexNames.contains(MATCH_RESULT_MATCH_INDEX)) {
          resultStore.createIndex(MATCH_RESULT_MATCH_INDEX, "matchId", {
            unique: false,
          });
        }
        if (!resultStore.indexNames.contains(MATCH_RESULT_MATCH_TEAM_INDEX)) {
          resultStore.createIndex(
            MATCH_RESULT_MATCH_TEAM_INDEX,
            ["matchId", "teamId"],
            { unique: true },
          );
        }

        if (event.oldVersion < 3) {
          const tournamentStore = request.transaction?.objectStore(
            TOURNAMENT_STORE,
          );
          if (!tournamentStore) {
            throw new Error("Unable to migrate tournament scoring settings.");
          }
          addDefaultScoringConfigToLegacyTournaments(tournamentStore);
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        if (settled) {
          database.close();
          return;
        }
        settled = true;
        database.onversionchange = () => {
          database.close();
          this.connection = null;
        };
        resolve(database);
      };
      request.onerror = () =>
        rejectOnce(
          classifyPersistenceFailure(request.error, "DATABASE_OPEN_FAILED"),
        );
      request.onblocked = () =>
        rejectOnce(
          new PersistenceError(
            "DATABASE_OPEN_BLOCKED",
            "Guest storage is open in another tab. Close that tab and try again.",
          ),
        );
    });
  }
}
