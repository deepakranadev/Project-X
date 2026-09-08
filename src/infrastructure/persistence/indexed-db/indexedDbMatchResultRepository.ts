import type { StoredMatchResult } from "@/domain/matches/types";
import type { MatchResultRepository } from "@/features/matches/matchResultRepository";

import {
  GuestDatabase,
  type GuestDatabaseOptions,
  MATCH_RESULT_MATCH_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
} from "./guestDatabase";
import { observeTransaction, requestToPromise } from "./indexedDbUtils";
import { parseMatchRecord, parseMatchResultRecord } from "./parseStoredRecords";
import { saveStoredMatchResults } from "./saveStoredMatchResults";

export {
  MatchResultRepositoryError,
  type MatchResultRepositoryErrorCode,
} from "./matchResultRepositoryErrors";

export interface IndexedDbMatchResultRepositoryOptions extends GuestDatabaseOptions {
  readonly database?: GuestDatabase;
  readonly now?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

export class IndexedDbMatchResultRepository implements MatchResultRepository {
  private readonly database: GuestDatabase;
  private readonly now: () => string;

  constructor(options: IndexedDbMatchResultRepositoryOptions = {}) {
    this.database = options.database ?? new GuestDatabase({
      databaseName: options.databaseName,
      indexedDbFactory: options.indexedDbFactory,
    });
    this.now = options.now ?? defaultNow;
  }

  async getResultsByMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<readonly StoredMatchResult[]> {
    const connection = await this.database.getConnection();
    const transaction = connection.transaction([MATCH_STORE, MATCH_RESULT_STORE], "readonly");
    const completion = observeTransaction(transaction);
    const storedMatch = await requestToPromise<unknown>(
      transaction.objectStore(MATCH_STORE).get(matchId),
    );
    if (storedMatch === undefined || parseMatchRecord(storedMatch).tournamentId !== tournamentId) {
      await completion;
      return [];
    }
    const storedResults = await requestToPromise<unknown[]>(
      transaction.objectStore(MATCH_RESULT_STORE).index(MATCH_RESULT_MATCH_INDEX).getAll(matchId),
    );
    await completion;
    return storedResults.map(parseMatchResultRecord);
  }

  saveDraftResults(
    tournamentId: string,
    matchId: string,
    results: readonly StoredMatchResult[],
  ): Promise<readonly StoredMatchResult[]> {
    return this.bulkSaveResults(tournamentId, matchId, results);
  }

  async saveResult(
    tournamentId: string,
    matchId: string,
    result: StoredMatchResult,
  ): Promise<StoredMatchResult> {
    const saved = await this.bulkSaveResults(tournamentId, matchId, [result]);
    const first = saved[0];
    if (!first) throw new Error("Result save did not return a result.");
    return first;
  }

  bulkSaveResults(
    tournamentId: string,
    matchId: string,
    results: readonly StoredMatchResult[],
  ): Promise<readonly StoredMatchResult[]> {
    return saveStoredMatchResults(this.database, this.now, tournamentId, matchId, results);
  }

  async deleteResultsByMatch(tournamentId: string, matchId: string): Promise<void> {
    const connection = await this.database.getConnection();
    const transaction = connection.transaction([MATCH_STORE, MATCH_RESULT_STORE], "readwrite");
    const completion = observeTransaction(transaction);
    const storedMatch = await requestToPromise<unknown>(
      transaction.objectStore(MATCH_STORE).get(matchId),
    );
    if (storedMatch === undefined || parseMatchRecord(storedMatch).tournamentId !== tournamentId) {
      await completion;
      return;
    }
    const store = transaction.objectStore(MATCH_RESULT_STORE);
    const resultIds = await requestToPromise<IDBValidKey[]>(
      store.index(MATCH_RESULT_MATCH_INDEX).getAllKeys(matchId),
    );
    for (const resultId of resultIds) await requestToPromise(store.delete(resultId));
    await completion;
  }

  close(): Promise<void> {
    return this.database.close();
  }
}
