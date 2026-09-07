import {
  MATCH_STATUSES,
  PARTICIPATION_STATUSES,
  type StoredMatchResult,
  type TournamentMatch,
} from "@/domain/matches/types";
import { validateManualMatchResults } from "@/domain/matches/validation";
import type { Team } from "@/domain/teams/types";

import {
  GuestDatabase,
  type GuestDatabaseOptions,
  MATCH_RESULT_MATCH_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  MATCH_TOURNAMENT_NUMBER_INDEX,
  TEAM_STORE,
  TEAM_TOURNAMENT_INDEX,
  TOURNAMENT_STORE,
} from "./guestDatabase";
import {
  abortTransaction,
  observeTransaction,
  requestToPromise,
} from "./indexedDbUtils";
import type {
  FinalizeMatchResult,
  MatchLifecycleRepository,
  MatchSnapshotCommand,
  PersistedMatchSnapshot,
} from "./matchLifecycleRepository";

export type MatchLifecycleRepositoryErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "MATCH_NOT_FOUND"
  | "MATCH_NOT_DRAFT"
  | "MATCH_NOT_FINALIZED"
  | "DUPLICATE_MATCH_NUMBER"
  | "INVALID_MATCH"
  | "INVALID_RESULT"
  | "INVALID_TEAM_REFERENCE"
  | "INITIAL_RESULTS_MISMATCH";

export class MatchLifecycleRepositoryError extends Error {
  readonly code: MatchLifecycleRepositoryErrorCode;

  constructor(code: MatchLifecycleRepositoryErrorCode, message: string) {
    super(message);
    this.name = "MatchLifecycleRepositoryError";
    this.code = code;
  }
}

export interface IndexedDbMatchLifecycleRepositoryOptions
  extends GuestDatabaseOptions {
  readonly database?: GuestDatabase;
  readonly now?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function normalizedMatch(
  match: TournamentMatch,
  name: string | undefined,
  status: TournamentMatch["status"],
  updatedAt: string,
): TournamentMatch {
  const normalizedName = name?.trim();
  return {
    id: match.id,
    tournamentId: match.tournamentId,
    matchNumber: match.matchNumber,
    ...(normalizedName ? { name: normalizedName } : {}),
    status,
    createdAt: match.createdAt,
    updatedAt,
  };
}

function assertValidDraftMatch(match: TournamentMatch): void {
  if (
    !match.id.trim() ||
    !match.tournamentId.trim() ||
    !Number.isInteger(match.matchNumber) ||
    match.matchNumber < 1 ||
    !MATCH_STATUSES.includes(match.status) ||
    match.status !== "DRAFT" ||
    !match.createdAt ||
    !match.updatedAt
  ) {
    throw new MatchLifecycleRepositoryError(
      "INVALID_MATCH",
      "A new match must be a complete Draft match.",
    );
  }
}

function isDraftNumber(value: number | null): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function assertValidResultSnapshot(
  tournamentId: string,
  matchId: string,
  results: readonly StoredMatchResult[],
): void {
  const teamIds = new Set<string>();
  const resultIds = new Set<string>();

  for (const result of results) {
    if (
      !result.id.trim() ||
      !result.teamId.trim() ||
      !result.createdAt ||
      !result.updatedAt ||
      !PARTICIPATION_STATUSES.includes(result.participationStatus) ||
      result.source !== "MANUAL" ||
      !isDraftNumber(result.placement) ||
      !isDraftNumber(result.kills) ||
      (result.participationStatus === "DNP" &&
        (result.placement !== null || result.kills !== null))
    ) {
      throw new MatchLifecycleRepositoryError(
        "INVALID_RESULT",
        "A manual result row is incomplete or malformed.",
      );
    }
    if (result.tournamentId !== tournamentId || result.matchId !== matchId) {
      throw new MatchLifecycleRepositoryError(
        "INVALID_RESULT",
        "A result cannot be saved into another tournament or match.",
      );
    }
    if (teamIds.has(result.teamId) || resultIds.has(result.id)) {
      throw new MatchLifecycleRepositoryError(
        "INVALID_RESULT",
        "Each team and result row must have one unique identity per match.",
      );
    }
    teamIds.add(result.teamId);
    resultIds.add(result.id);
  }
}

function assertTeamReferences(
  tournamentId: string,
  results: readonly StoredMatchResult[],
  teams: readonly Team[],
): void {
  const teamIds = new Set(
    teams
      .filter((team) => team.tournamentId === tournamentId)
      .map((team) => team.id),
  );
  const invalid = results.find((result) => !teamIds.has(result.teamId));
  if (invalid) {
    throw new MatchLifecycleRepositoryError(
      "INVALID_TEAM_REFERENCE",
      `Team "${invalid.teamId}" does not belong to this tournament.`,
    );
  }
}

async function writeAuthoritativeResults(
  transaction: IDBTransaction,
  tournamentId: string,
  matchId: string,
  results: readonly StoredMatchResult[],
  timestamp: string,
): Promise<readonly StoredMatchResult[]> {
  const store = transaction.objectStore(MATCH_RESULT_STORE);
  const existingResults = await requestToPromise<StoredMatchResult[]>(
    store.index(MATCH_RESULT_MATCH_INDEX).getAll(matchId),
  );
  const existingByTeam = new Map(
    existingResults.map((result) => [result.teamId, result]),
  );

  for (const existing of existingResults) {
    await requestToPromise(store.delete(existing.id));
  }

  const saved: StoredMatchResult[] = [];
  for (const candidate of results) {
    const existing = existingByTeam.get(candidate.teamId);
    const resultId = existing?.id ?? candidate.id;
    const identityOwner = await requestToPromise<StoredMatchResult | undefined>(
      store.get(resultId),
    );
    if (identityOwner) {
      await abortTransaction(transaction);
      throw new MatchLifecycleRepositoryError(
        "INVALID_RESULT",
        "A result identity is already used by another team or match.",
      );
    }

    const normalized: StoredMatchResult = {
      ...candidate,
      id: resultId,
      tournamentId,
      matchId,
      source: "MANUAL",
      createdAt: existing?.createdAt ?? candidate.createdAt,
      updatedAt: timestamp,
    };
    await requestToPromise(store.add(normalized));
    saved.push(normalized);
  }
  return saved;
}

async function abortAndRethrow(
  transaction: IDBTransaction,
  error: unknown,
): Promise<never> {
  await abortTransaction(transaction);
  throw error;
}

export class IndexedDbMatchLifecycleRepository
  implements MatchLifecycleRepository
{
  private readonly database: GuestDatabase;
  private readonly now: () => string;

  constructor(options: IndexedDbMatchLifecycleRepositoryOptions = {}) {
    this.database =
      options.database ??
      new GuestDatabase({
        databaseName: options.databaseName,
        indexedDbFactory: options.indexedDbFactory,
      });
    this.now = options.now ?? defaultNow;
  }

  async createMatchWithInitialResults(
    match: TournamentMatch,
    results: readonly StoredMatchResult[],
  ): Promise<PersistedMatchSnapshot> {
    assertValidDraftMatch(match);
    assertValidResultSnapshot(match.tournamentId, match.id, results);

    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [TOURNAMENT_STORE, MATCH_STORE, TEAM_STORE, MATCH_RESULT_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);

    try {
      const tournament = await requestToPromise<unknown>(
        transaction.objectStore(TOURNAMENT_STORE).get(match.tournamentId),
      );
      if (!tournament) {
        throw new MatchLifecycleRepositoryError(
          "TOURNAMENT_NOT_FOUND",
          "This tournament no longer exists on this device.",
        );
      }

      const matchStore = transaction.objectStore(MATCH_STORE);
      const duplicateNumber = await requestToPromise<IDBValidKey | undefined>(
        matchStore
          .index(MATCH_TOURNAMENT_NUMBER_INDEX)
          .getKey([match.tournamentId, match.matchNumber]),
      );
      if (duplicateNumber !== undefined) {
        throw new MatchLifecycleRepositoryError(
          "DUPLICATE_MATCH_NUMBER",
          `Match ${match.matchNumber} already exists in this tournament.`,
        );
      }

      const teams = await requestToPromise<Team[]>(
        transaction
          .objectStore(TEAM_STORE)
          .index(TEAM_TOURNAMENT_INDEX)
          .getAll(match.tournamentId),
      );
      assertTeamReferences(match.tournamentId, results, teams);
      const resultTeamIds = new Set(results.map((result) => result.teamId));
      if (
        teams.length === 0 ||
        teams.length !== results.length ||
        teams.some((team) => !resultTeamIds.has(team.id))
      ) {
        throw new MatchLifecycleRepositoryError(
          "INITIAL_RESULTS_MISMATCH",
          "A new match must initialize one result row for every current team.",
        );
      }

      const normalized = normalizedMatch(
        match,
        match.name,
        "DRAFT",
        match.updatedAt,
      );
      await requestToPromise(matchStore.add(normalized));
      const savedResults = await writeAuthoritativeResults(
        transaction,
        match.tournamentId,
        match.id,
        results,
        match.updatedAt,
      );
      await completion;
      return { match: normalized, results: savedResults };
    } catch (error) {
      return abortAndRethrow(transaction, error);
    }
  }

  async saveMatchDraft(
    command: MatchSnapshotCommand,
  ): Promise<PersistedMatchSnapshot> {
    assertValidResultSnapshot(
      command.tournamentId,
      command.matchId,
      command.results,
    );
    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [TOURNAMENT_STORE, MATCH_STORE, TEAM_STORE, MATCH_RESULT_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);

    try {
      const tournament = await requestToPromise<unknown>(
        transaction.objectStore(TOURNAMENT_STORE).get(command.tournamentId),
      );
      if (!tournament) {
        throw new MatchLifecycleRepositoryError(
          "TOURNAMENT_NOT_FOUND",
          "This tournament no longer exists on this device.",
        );
      }
      const matchStore = transaction.objectStore(MATCH_STORE);
      const match = await requestToPromise<TournamentMatch | undefined>(
        matchStore.get(command.matchId),
      );
      if (!match || match.tournamentId !== command.tournamentId) {
        throw new MatchLifecycleRepositoryError(
          "MATCH_NOT_FOUND",
          "This match does not belong to the selected tournament.",
        );
      }
      if (match.status !== "DRAFT") {
        throw new MatchLifecycleRepositoryError(
          "MATCH_NOT_DRAFT",
          "Reopen this finalized match before saving draft changes.",
        );
      }

      const teams = await requestToPromise<Team[]>(
        transaction
          .objectStore(TEAM_STORE)
          .index(TEAM_TOURNAMENT_INDEX)
          .getAll(command.tournamentId),
      );
      assertTeamReferences(command.tournamentId, command.results, teams);
      const timestamp = this.now();
      const savedResults = await writeAuthoritativeResults(
        transaction,
        command.tournamentId,
        command.matchId,
        command.results,
        timestamp,
      );
      const updated = normalizedMatch(
        match,
        command.name,
        "DRAFT",
        timestamp,
      );
      await requestToPromise(matchStore.put(updated));
      await completion;
      return { match: updated, results: savedResults };
    } catch (error) {
      return abortAndRethrow(transaction, error);
    }
  }

  async finalizeMatch(
    command: MatchSnapshotCommand,
  ): Promise<FinalizeMatchResult> {
    assertValidResultSnapshot(
      command.tournamentId,
      command.matchId,
      command.results,
    );
    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [TOURNAMENT_STORE, MATCH_STORE, TEAM_STORE, MATCH_RESULT_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);

    try {
      const tournament = await requestToPromise<unknown>(
        transaction.objectStore(TOURNAMENT_STORE).get(command.tournamentId),
      );
      if (!tournament) {
        throw new MatchLifecycleRepositoryError(
          "TOURNAMENT_NOT_FOUND",
          "This tournament no longer exists on this device.",
        );
      }
      const matchStore = transaction.objectStore(MATCH_STORE);
      const match = await requestToPromise<TournamentMatch | undefined>(
        matchStore.get(command.matchId),
      );
      if (!match || match.tournamentId !== command.tournamentId) {
        throw new MatchLifecycleRepositoryError(
          "MATCH_NOT_FOUND",
          "This match does not belong to the selected tournament.",
        );
      }
      if (match.status !== "DRAFT") {
        throw new MatchLifecycleRepositoryError(
          "MATCH_NOT_DRAFT",
          "This match is already finalized. Reopen it before finalizing again.",
        );
      }

      const teams = await requestToPromise<Team[]>(
        transaction
          .objectStore(TEAM_STORE)
          .index(TEAM_TOURNAMENT_INDEX)
          .getAll(command.tournamentId),
      );
      const validation = validateManualMatchResults(command.results, {
        tournamentId: command.tournamentId,
        matchId: command.matchId,
        participantTeamIds: teams.map((team) => team.id),
      });
      if (!validation.valid) {
        await abortTransaction(transaction);
        return { ok: false, issues: validation.issues };
      }

      const timestamp = this.now();
      const savedResults = await writeAuthoritativeResults(
        transaction,
        command.tournamentId,
        command.matchId,
        command.results,
        timestamp,
      );
      const finalized = normalizedMatch(
        match,
        command.name,
        "FINALIZED",
        timestamp,
      );
      await requestToPromise(matchStore.put(finalized));
      await completion;
      return { ok: true, match: finalized, results: savedResults };
    } catch (error) {
      return abortAndRethrow(transaction, error);
    }
  }

  async reopenMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<TournamentMatch> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(MATCH_STORE, "readwrite");
    const completion = observeTransaction(transaction);
    const store = transaction.objectStore(MATCH_STORE);

    try {
      const match = await requestToPromise<TournamentMatch | undefined>(
        store.get(matchId),
      );
      if (!match || match.tournamentId !== tournamentId) {
        throw new MatchLifecycleRepositoryError(
          "MATCH_NOT_FOUND",
          "This match does not belong to the selected tournament.",
        );
      }
      if (match.status !== "FINALIZED") {
        throw new MatchLifecycleRepositoryError(
          "MATCH_NOT_FINALIZED",
          "Only a finalized match can be reopened.",
        );
      }

      const reopened = normalizedMatch(match, match.name, "DRAFT", this.now());
      await requestToPromise(store.put(reopened));
      await completion;
      return reopened;
    } catch (error) {
      return abortAndRethrow(transaction, error);
    }
  }

  close(): Promise<void> {
    return this.database.close();
  }
}
