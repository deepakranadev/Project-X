import type { StoredMatchResult } from "@/domain/matches/types";

import {
  type GuestDatabase,
  MATCH_RESULT_MATCH_TEAM_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  TEAM_STORE,
  TOURNAMENT_STORE,
} from "./guestDatabase";
import { assertValidDraftResults } from "./indexedDbMatchResultRules";
import { abortTransaction, observeTransaction, requestToPromise } from "./indexedDbUtils";
import { MatchResultRepositoryError } from "./matchResultRepositoryErrors";
import {
  parseMatchRecord,
  parseMatchResultRecord,
  parseTeamRecord,
  parseTournamentRecord,
  tournamentRecordToTournament,
} from "./parseStoredRecords";

export async function saveStoredMatchResults(
  database: GuestDatabase,
  now: () => string,
  tournamentId: string,
  matchId: string,
  results: readonly StoredMatchResult[],
): Promise<readonly StoredMatchResult[]> {
  assertValidDraftResults(tournamentId, matchId, results);
  if (results.length === 0) return [];
  const connection = await database.getConnection();
  const transaction = connection.transaction(
    [TOURNAMENT_STORE, MATCH_STORE, TEAM_STORE, MATCH_RESULT_STORE],
    "readwrite",
  );
  const completion = observeTransaction(transaction);

  const storedTournament = await requestToPromise<unknown>(
    transaction.objectStore(TOURNAMENT_STORE).get(tournamentId),
  );
  if (storedTournament === undefined) {
    await abortTransaction(transaction);
    throw new MatchResultRepositoryError("TOURNAMENT_NOT_FOUND", "This tournament no longer exists on this device.");
  }
  tournamentRecordToTournament(parseTournamentRecord(storedTournament));
  const storedMatch = await requestToPromise<unknown>(
    transaction.objectStore(MATCH_STORE).get(matchId),
  );
  if (storedMatch === undefined || parseMatchRecord(storedMatch).tournamentId !== tournamentId) {
    await abortTransaction(transaction);
    throw new MatchResultRepositoryError("MATCH_NOT_FOUND", "This match does not belong to the selected tournament.");
  }
  if (parseMatchRecord(storedMatch).status !== "DRAFT") {
    await abortTransaction(transaction);
    throw new MatchResultRepositoryError("MATCH_NOT_DRAFT", "Reopen this finalized match before changing its results.");
  }

  const teamIds = new Set(results.map((result) => result.teamId));
  const teamStore = transaction.objectStore(TEAM_STORE);
  for (const teamId of teamIds) {
    const storedTeam = await requestToPromise<unknown>(teamStore.get(teamId));
    if (storedTeam === undefined || parseTeamRecord(storedTeam).tournamentId !== tournamentId) {
      await abortTransaction(transaction);
      throw new MatchResultRepositoryError(
        "INVALID_TEAM_REFERENCE",
        `Team "${teamId}" does not belong to this tournament.`,
      );
    }
  }

  const resultStore = transaction.objectStore(MATCH_RESULT_STORE);
  const timestamp = now();
  const saved: StoredMatchResult[] = [];
  for (const candidate of results) {
    const storedExisting = await requestToPromise<unknown>(
      resultStore.index(MATCH_RESULT_MATCH_TEAM_INDEX).get([matchId, candidate.teamId]),
    );
    const existing = storedExisting === undefined ? undefined : parseMatchResultRecord(storedExisting);
    const storedOwner = await requestToPromise<unknown>(resultStore.get(candidate.id));
    const identityOwner = storedOwner === undefined ? undefined : parseMatchResultRecord(storedOwner);
    if (
      !existing &&
      identityOwner &&
      (identityOwner.matchId !== matchId || identityOwner.teamId !== candidate.teamId)
    ) {
      await abortTransaction(transaction);
      throw new MatchResultRepositoryError("INVALID_RESULT", "A result identity is already used by another team or match.");
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
