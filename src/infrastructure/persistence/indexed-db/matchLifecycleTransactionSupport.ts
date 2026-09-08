import type { StoredMatchResult, TournamentMatch } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";

import {
  MATCH_RESULT_MATCH_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  TEAM_STORE,
  TEAM_TOURNAMENT_INDEX,
  TOURNAMENT_STORE,
} from "./guestDatabase";
import { MatchLifecycleRepositoryError } from "./matchLifecycleErrors";
import { abortTransaction, requestToPromise } from "./indexedDbUtils";
import {
  parseMatchRecord,
  parseMatchResultRecord,
  parseTeamRecord,
  parseTournamentRecord,
  tournamentRecordToTournament,
} from "./parseStoredRecords";

export async function assertStoredTournament(
  transaction: IDBTransaction,
  tournamentId: string,
): Promise<void> {
  const stored = await requestToPromise<unknown>(
    transaction.objectStore(TOURNAMENT_STORE).get(tournamentId),
  );
  if (stored === undefined) {
    throw new MatchLifecycleRepositoryError(
      "TOURNAMENT_NOT_FOUND",
      "This tournament no longer exists on this device.",
    );
  }
  tournamentRecordToTournament(parseTournamentRecord(stored));
}

export async function readMatchForTournament(
  transaction: IDBTransaction,
  tournamentId: string,
  matchId: string,
): Promise<TournamentMatch> {
  const stored = await requestToPromise<unknown>(
    transaction.objectStore(MATCH_STORE).get(matchId),
  );
  if (stored === undefined) {
    throw new MatchLifecycleRepositoryError(
      "MATCH_NOT_FOUND",
      "This match does not belong to the selected tournament.",
    );
  }
  const match = parseMatchRecord(stored);
  if (match.tournamentId !== tournamentId) {
    throw new MatchLifecycleRepositoryError(
      "MATCH_NOT_FOUND",
      "This match does not belong to the selected tournament.",
    );
  }
  return match;
}

export async function readTournamentTeams(
  transaction: IDBTransaction,
  tournamentId: string,
): Promise<readonly Team[]> {
  const stored = await requestToPromise<unknown[]>(
    transaction.objectStore(TEAM_STORE).index(TEAM_TOURNAMENT_INDEX).getAll(tournamentId),
  );
  return stored.map(parseTeamRecord);
}

export async function writeAuthoritativeResults(
  transaction: IDBTransaction,
  tournamentId: string,
  matchId: string,
  results: readonly StoredMatchResult[],
  timestamp: string,
): Promise<readonly StoredMatchResult[]> {
  const store = transaction.objectStore(MATCH_RESULT_STORE);
  const stored = await requestToPromise<unknown[]>(
    store.index(MATCH_RESULT_MATCH_INDEX).getAll(matchId),
  );
  const existingResults = stored.map(parseMatchResultRecord);
  const existingByTeam = new Map(existingResults.map((result) => [result.teamId, result]));
  for (const existing of existingResults) {
    await requestToPromise(store.delete(existing.id));
  }

  const saved: StoredMatchResult[] = [];
  for (const candidate of results) {
    const existing = existingByTeam.get(candidate.teamId);
    const resultId = existing?.id ?? candidate.id;
    const storedOwner = await requestToPromise<unknown>(store.get(resultId));
    const identityOwner = storedOwner === undefined ? undefined : parseMatchResultRecord(storedOwner);
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

export async function abortAndRethrow(
  transaction: IDBTransaction,
  error: unknown,
): Promise<never> {
  await abortTransaction(transaction);
  throw error;
}
