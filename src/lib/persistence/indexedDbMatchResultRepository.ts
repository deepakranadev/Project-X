import {
  PARTICIPATION_STATUSES,
  type StoredMatchResult,
} from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";

import {
  GuestDatabase,
  type GuestDatabaseOptions,
  MATCH_RESULT_MATCH_INDEX,
  MATCH_RESULT_MATCH_TEAM_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  TEAM_STORE,
  TOURNAMENT_STORE,
} from "./guestDatabase";
import {
  abortTransaction,
  observeTransaction,
  requestToPromise,
} from "./indexedDbUtils";
import type { MatchResultRepository } from "./matchResultRepository";
import type { TournamentMatch } from "@/domain/matches/types";

export type MatchResultRepositoryErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "MATCH_NOT_FOUND"
  | "RESULT_CONTEXT_MISMATCH"
  | "DUPLICATE_TEAM_RESULT"
  | "INVALID_TEAM_REFERENCE"
  | "INVALID_RESULT";

export class MatchResultRepositoryError extends Error {
  readonly code: MatchResultRepositoryErrorCode;

  constructor(code: MatchResultRepositoryErrorCode, message: string) {
    super(message);
    this.name = "MatchResultRepositoryError";
    this.code = code;
  }
}

export interface IndexedDbMatchResultRepositoryOptions
  extends GuestDatabaseOptions {
  readonly database?: GuestDatabase;
  readonly now?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function isDraftNumber(value: number | null): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function assertValidDraftResult(
  tournamentId: string,
  matchId: string,
  result: StoredMatchResult,
): void {
  if (
    !result.id.trim() ||
    !result.teamId.trim() ||
    !result.createdAt ||
    !result.updatedAt ||
    !PARTICIPATION_STATUSES.includes(result.participationStatus) ||
    result.source !== "MANUAL" ||
    !isDraftNumber(result.placement) ||
    !isDraftNumber(result.kills)
  ) {
    throw new MatchResultRepositoryError(
      "INVALID_RESULT",
      "A manual result row is incomplete or malformed.",
    );
  }
  if (result.tournamentId !== tournamentId || result.matchId !== matchId) {
    throw new MatchResultRepositoryError(
      "RESULT_CONTEXT_MISMATCH",
      "A result cannot be saved into another tournament or match.",
    );
  }
  if (
    result.participationStatus === "DNP" &&
    (result.placement !== null || result.kills !== null)
  ) {
    throw new MatchResultRepositoryError(
      "INVALID_RESULT",
      "DNP results must leave placement and finishes empty.",
    );
  }
}

export class IndexedDbMatchResultRepository
  implements MatchResultRepository
{
  private readonly database: GuestDatabase;
  private readonly now: () => string;

  constructor(options: IndexedDbMatchResultRepositoryOptions = {}) {
    this.database =
      options.database ??
      new GuestDatabase({
        databaseName: options.databaseName,
        indexedDbFactory: options.indexedDbFactory,
      });
    this.now = options.now ?? defaultNow;
  }

  async getResultsByMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<readonly StoredMatchResult[]> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [MATCH_STORE, MATCH_RESULT_STORE],
      "readonly",
    );
    const completion = observeTransaction(transaction);
    const match = await requestToPromise<TournamentMatch | undefined>(
      transaction.objectStore(MATCH_STORE).get(matchId),
    );
    if (!match || match.tournamentId !== tournamentId) {
      await completion;
      return [];
    }
    const results = await requestToPromise<StoredMatchResult[]>(
      transaction
        .objectStore(MATCH_RESULT_STORE)
        .index(MATCH_RESULT_MATCH_INDEX)
        .getAll(matchId),
    );
    await completion;
    return results;
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

  async bulkSaveResults(
    tournamentId: string,
    matchId: string,
    results: readonly StoredMatchResult[],
  ): Promise<readonly StoredMatchResult[]> {
    results.forEach((result) =>
      assertValidDraftResult(tournamentId, matchId, result),
    );
    const teamIds = new Set(results.map((result) => result.teamId));
    if (teamIds.size !== results.length) {
      throw new MatchResultRepositoryError(
        "DUPLICATE_TEAM_RESULT",
        "Each team can have only one result in a match.",
      );
    }
    const resultIds = new Set(results.map((result) => result.id));
    if (resultIds.size !== results.length) {
      throw new MatchResultRepositoryError(
        "INVALID_RESULT",
        "Every result row must have a unique identity.",
      );
    }
    if (results.length === 0) return [];

    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [TOURNAMENT_STORE, MATCH_STORE, TEAM_STORE, MATCH_RESULT_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);
    const tournament = await requestToPromise<unknown>(
      transaction.objectStore(TOURNAMENT_STORE).get(tournamentId),
    );
    if (!tournament) {
      await abortTransaction(transaction);
      throw new MatchResultRepositoryError(
        "TOURNAMENT_NOT_FOUND",
        "This tournament no longer exists on this device.",
      );
    }
    const match = await requestToPromise<TournamentMatch | undefined>(
      transaction.objectStore(MATCH_STORE).get(matchId),
    );
    if (!match || match.tournamentId !== tournamentId) {
      await abortTransaction(transaction);
      throw new MatchResultRepositoryError(
        "MATCH_NOT_FOUND",
        "This match does not belong to the selected tournament.",
      );
    }

    const teamStore = transaction.objectStore(TEAM_STORE);
    for (const teamId of teamIds) {
      const team = await requestToPromise<Team | undefined>(teamStore.get(teamId));
      if (!team || team.tournamentId !== tournamentId) {
        await abortTransaction(transaction);
        throw new MatchResultRepositoryError(
          "INVALID_TEAM_REFERENCE",
          `Team "${teamId}" does not belong to this tournament.`,
        );
      }
    }

    const resultStore = transaction.objectStore(MATCH_RESULT_STORE);
    const timestamp = this.now();
    const saved: StoredMatchResult[] = [];
    for (const candidate of results) {
      const existing = await requestToPromise<StoredMatchResult | undefined>(
        resultStore
          .index(MATCH_RESULT_MATCH_TEAM_INDEX)
          .get([matchId, candidate.teamId]),
      );
      const identityOwner = await requestToPromise<
        StoredMatchResult | undefined
      >(resultStore.get(candidate.id));
      if (
        !existing &&
        identityOwner &&
        (identityOwner.matchId !== matchId ||
          identityOwner.teamId !== candidate.teamId)
      ) {
        await abortTransaction(transaction);
        throw new MatchResultRepositoryError(
          "INVALID_RESULT",
          "A result identity is already used by another team or match.",
        );
      }
      const normalized: StoredMatchResult = {
        ...candidate,
        id: existing?.id ?? candidate.id,
        tournamentId,
        matchId,
        source: "MANUAL",
        createdAt: existing?.createdAt ?? candidate.createdAt,
        updatedAt: timestamp,
      };
      await requestToPromise(resultStore.put(normalized));
      saved.push(normalized);
    }
    await completion;
    return saved;
  }

  async deleteResultsByMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<void> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [MATCH_STORE, MATCH_RESULT_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);
    const match = await requestToPromise<TournamentMatch | undefined>(
      transaction.objectStore(MATCH_STORE).get(matchId),
    );
    if (!match || match.tournamentId !== tournamentId) {
      await completion;
      return;
    }
    const store = transaction.objectStore(MATCH_RESULT_STORE);
    const resultIds = await requestToPromise<IDBValidKey[]>(
      store.index(MATCH_RESULT_MATCH_INDEX).getAllKeys(matchId),
    );
    for (const resultId of resultIds) {
      await requestToPromise(store.delete(resultId));
    }
    await completion;
  }

  close(): Promise<void> {
    return this.database.close();
  }
}
