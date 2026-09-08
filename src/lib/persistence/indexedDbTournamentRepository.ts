import type {
  Tournament,
  TournamentUpdate,
} from "@/domain/tournaments/types";
import { assertValidScoringConfig } from "@/domain/scoring/validateScoringConfig";
import { copyScoringConfig } from "@/domain/tournaments/scoringPresets";

import {
  GuestDatabase,
  type GuestDatabaseOptions,
  MATCH_RESULT_MATCH_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  MATCH_TOURNAMENT_INDEX,
  TEAM_STORE,
  TEAM_TOURNAMENT_INDEX,
  TOURNAMENT_STORE,
} from "./guestDatabase";
import { observeTransaction, requestToPromise } from "./indexedDbUtils";
import {
  parseTournamentRecord,
  tournamentRecordToDomain,
} from "./parseStoredRecords";
import type { TournamentRepository } from "./tournamentRepository";

export interface IndexedDbTournamentRepositoryOptions
  extends GuestDatabaseOptions {
  readonly database?: GuestDatabase;
  readonly now?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function prepareTournamentForWrite(tournament: Tournament): Tournament {
  assertValidScoringConfig(tournament.scoringConfig);
  return {
    ...tournament,
    scoringConfig: copyScoringConfig(tournament.scoringConfig),
  };
}

export class IndexedDbTournamentRepository implements TournamentRepository {
  private readonly database: GuestDatabase;
  private readonly now: () => string;

  constructor(options: IndexedDbTournamentRepositoryOptions = {}) {
    this.database =
      options.database ??
      new GuestDatabase({
        databaseName: options.databaseName,
        indexedDbFactory: options.indexedDbFactory,
      });
    this.now = options.now ?? defaultNow;
  }

  async createTournament(tournament: Tournament): Promise<Tournament> {
    const normalized = prepareTournamentForWrite(tournament);
    const database = await this.database.getConnection();
    const transaction = database.transaction(TOURNAMENT_STORE, "readwrite");
    const completion = observeTransaction(transaction);
    await requestToPromise(
      transaction.objectStore(TOURNAMENT_STORE).add(normalized),
    );
    await completion;
    return normalized;
  }

  async getTournament(id: string): Promise<Tournament | null> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(TOURNAMENT_STORE, "readonly");
    const completion = observeTransaction(transaction);
    const stored = await requestToPromise<unknown>(
      transaction.objectStore(TOURNAMENT_STORE).get(id),
    );
    await completion;
    return stored === undefined
      ? null
      : tournamentRecordToDomain(parseTournamentRecord(stored));
  }

  async updateTournament(
    id: string,
    updates: TournamentUpdate,
  ): Promise<Tournament | null> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(TOURNAMENT_STORE, "readwrite");
    const completion = observeTransaction(transaction);
    const store = transaction.objectStore(TOURNAMENT_STORE);
    const stored = await requestToPromise<unknown>(store.get(id));

    if (stored === undefined) {
      await completion;
      return null;
    }

    const existing = tournamentRecordToDomain(parseTournamentRecord(stored));
    const updated = prepareTournamentForWrite({
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: this.now(),
    });

    await requestToPromise(store.put(updated));
    await completion;
    return updated;
  }

  async listTournaments(): Promise<readonly Tournament[]> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(TOURNAMENT_STORE, "readonly");
    const completion = observeTransaction(transaction);
    const storedTournaments = await requestToPromise<unknown[]>(
      transaction.objectStore(TOURNAMENT_STORE).getAll(),
    );
    await completion;

    const tournaments = storedTournaments.map((stored) =>
      tournamentRecordToDomain(parseTournamentRecord(stored)),
    );

    return tournaments.sort((left, right) => {
      const updatedComparison = right.updatedAt.localeCompare(left.updatedAt);
      if (updatedComparison !== 0) return updatedComparison;
      if (left.id === right.id) return 0;
      return left.id < right.id ? -1 : 1;
    });
  }

  async deleteTournament(id: string): Promise<void> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [TOURNAMENT_STORE, TEAM_STORE, MATCH_STORE, MATCH_RESULT_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);
    const teamStore = transaction.objectStore(TEAM_STORE);
    const teamIds = await requestToPromise<IDBValidKey[]>(
      teamStore.index(TEAM_TOURNAMENT_INDEX).getAllKeys(id),
    );

    for (const teamId of teamIds) {
      await requestToPromise(teamStore.delete(teamId));
    }

    const matchStore = transaction.objectStore(MATCH_STORE);
    const matchIds = await requestToPromise<IDBValidKey[]>(
      matchStore.index(MATCH_TOURNAMENT_INDEX).getAllKeys(id),
    );
    const resultStore = transaction.objectStore(MATCH_RESULT_STORE);
    for (const matchId of matchIds) {
      const resultIds = await requestToPromise<IDBValidKey[]>(
        resultStore.index(MATCH_RESULT_MATCH_INDEX).getAllKeys(matchId),
      );
      for (const resultId of resultIds) {
        await requestToPromise(resultStore.delete(resultId));
      }
      await requestToPromise(matchStore.delete(matchId));
    }
    await requestToPromise(
      transaction.objectStore(TOURNAMENT_STORE).delete(id),
    );
    await completion;
  }

  close(): Promise<void> {
    return this.database.close();
  }
}
