import {
  MATCH_STATUSES,
  type MatchDetailsUpdate,
  type TournamentMatch,
} from "@/domain/matches/types";

import {
  GuestDatabase,
  type GuestDatabaseOptions,
  MATCH_RESULT_MATCH_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  MATCH_TOURNAMENT_INDEX,
  MATCH_TOURNAMENT_NUMBER_INDEX,
  TOURNAMENT_STORE,
} from "./guestDatabase";
import {
  abortTransaction,
  observeTransaction,
  requestToPromise,
} from "./indexedDbUtils";
import {
  parseMatchRecord,
  parseTournamentRecord,
  tournamentRecordToDomain,
} from "./parseStoredRecords";
import type { MatchRepository } from "@/features/matches/matchRepository";

export type MatchRepositoryErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "DUPLICATE_MATCH_NUMBER"
  | "INVALID_MATCH";

export class MatchRepositoryError extends Error {
  readonly code: MatchRepositoryErrorCode;

  constructor(code: MatchRepositoryErrorCode, message: string) {
    super(message);
    this.name = "MatchRepositoryError";
    this.code = code;
  }
}

export interface IndexedDbMatchRepositoryOptions extends GuestDatabaseOptions {
  readonly database?: GuestDatabase;
  readonly now?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function normalizeMatch(match: TournamentMatch): TournamentMatch {
  const name = match.name?.trim();
  return {
    id: match.id.trim(),
    tournamentId: match.tournamentId.trim(),
    matchNumber: match.matchNumber,
    ...(name ? { name } : {}),
    status: match.status,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
}

function assertValidMatch(match: TournamentMatch): void {
  if (
    !match.id.trim() ||
    !match.tournamentId.trim() ||
    !Number.isInteger(match.matchNumber) ||
    match.matchNumber < 1 ||
    !MATCH_STATUSES.includes(match.status) ||
    !match.createdAt ||
    !match.updatedAt
  ) {
    throw new MatchRepositoryError(
      "INVALID_MATCH",
      "Match data is incomplete or malformed.",
    );
  }
}

export class IndexedDbMatchRepository implements MatchRepository {
  private readonly database: GuestDatabase;
  private readonly now: () => string;

  constructor(options: IndexedDbMatchRepositoryOptions = {}) {
    this.database =
      options.database ??
      new GuestDatabase({
        databaseName: options.databaseName,
        indexedDbFactory: options.indexedDbFactory,
      });
    this.now = options.now ?? defaultNow;
  }

  async createMatch(match: TournamentMatch): Promise<TournamentMatch> {
    const normalized = normalizeMatch(match);
    assertValidMatch(normalized);
    if (normalized.status !== "DRAFT") {
      throw new MatchRepositoryError(
        "INVALID_MATCH",
        "Matches must be created as drafts and finalized through the lifecycle command.",
      );
    }
    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [TOURNAMENT_STORE, MATCH_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);
    const storedTournament = await requestToPromise<unknown>(
      transaction.objectStore(TOURNAMENT_STORE).get(normalized.tournamentId),
    );
    if (storedTournament === undefined) {
      await abortTransaction(transaction);
      throw new MatchRepositoryError(
        "TOURNAMENT_NOT_FOUND",
        "This tournament no longer exists on this device.",
      );
    }
    tournamentRecordToDomain(parseTournamentRecord(storedTournament));

    const store = transaction.objectStore(MATCH_STORE);
    const numberKey = [normalized.tournamentId, normalized.matchNumber];
    const existingNumber = await requestToPromise<IDBValidKey | undefined>(
      store.index(MATCH_TOURNAMENT_NUMBER_INDEX).getKey(numberKey),
    );
    if (existingNumber !== undefined) {
      await abortTransaction(transaction);
      throw new MatchRepositoryError(
        "DUPLICATE_MATCH_NUMBER",
        `Match ${normalized.matchNumber} already exists in this tournament.`,
      );
    }

    await requestToPromise(store.add(normalized));
    await completion;
    return normalized;
  }

  async getMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<TournamentMatch | null> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(MATCH_STORE, "readonly");
    const completion = observeTransaction(transaction);
    const stored = await requestToPromise<unknown>(
      transaction.objectStore(MATCH_STORE).get(matchId),
    );
    await completion;
    const match = stored === undefined ? undefined : parseMatchRecord(stored);
    return match?.tournamentId === tournamentId ? match : null;
  }

  async listMatchesByTournament(
    tournamentId: string,
  ): Promise<readonly TournamentMatch[]> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(MATCH_STORE, "readonly");
    const completion = observeTransaction(transaction);
    const storedMatches = await requestToPromise<unknown[]>(
      transaction
        .objectStore(MATCH_STORE)
        .index(MATCH_TOURNAMENT_INDEX)
        .getAll(tournamentId),
    );
    await completion;
    return storedMatches
      .map(parseMatchRecord)
      .sort((left, right) => {
      const numberComparison = left.matchNumber - right.matchNumber;
      return numberComparison || left.createdAt.localeCompare(right.createdAt);
      });
  }

  async updateMatch(
    tournamentId: string,
    matchId: string,
    updates: MatchDetailsUpdate,
  ): Promise<TournamentMatch | null> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(MATCH_STORE, "readwrite");
    const completion = observeTransaction(transaction);
    const store = transaction.objectStore(MATCH_STORE);
    const stored = await requestToPromise<unknown>(store.get(matchId));
    if (stored === undefined) {
      await completion;
      return null;
    }
    const existing = parseMatchRecord(stored);
    if (existing.tournamentId !== tournamentId) {
      await completion;
      return null;
    }

    const updated = normalizeMatch({
      id: existing.id,
      tournamentId: existing.tournamentId,
      matchNumber: updates.matchNumber ?? existing.matchNumber,
      name: Object.hasOwn(updates, "name") ? updates.name : existing.name,
      status: existing.status,
      createdAt: existing.createdAt,
      updatedAt: this.now(),
    });
    assertValidMatch(updated);

    if (updated.matchNumber !== existing.matchNumber) {
      const duplicate = await requestToPromise<IDBValidKey | undefined>(
        store
          .index(MATCH_TOURNAMENT_NUMBER_INDEX)
          .getKey([tournamentId, updated.matchNumber]),
      );
      if (duplicate !== undefined && duplicate !== matchId) {
        await abortTransaction(transaction);
        throw new MatchRepositoryError(
          "DUPLICATE_MATCH_NUMBER",
          `Match ${updated.matchNumber} already exists in this tournament.`,
        );
      }
    }

    await requestToPromise(store.put(updated));
    await completion;
    return updated;
  }

  async deleteMatch(tournamentId: string, matchId: string): Promise<void> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [MATCH_STORE, MATCH_RESULT_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);
    const matchStore = transaction.objectStore(MATCH_STORE);
    const stored = await requestToPromise<unknown>(matchStore.get(matchId));
    if (stored === undefined) {
      await completion;
      return;
    }
    const existing = parseMatchRecord(stored);
    if (existing.tournamentId !== tournamentId) {
      await completion;
      return;
    }

    const resultStore = transaction.objectStore(MATCH_RESULT_STORE);
    const resultIds = await requestToPromise<IDBValidKey[]>(
      resultStore.index(MATCH_RESULT_MATCH_INDEX).getAllKeys(matchId),
    );
    for (const resultId of resultIds) {
      await requestToPromise(resultStore.delete(resultId));
    }
    await requestToPromise(matchStore.delete(matchId));
    await completion;
  }

  close(): Promise<void> {
    return this.database.close();
  }
}
