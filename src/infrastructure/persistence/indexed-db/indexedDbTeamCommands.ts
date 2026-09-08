import { TeamDeletionError } from "@/domain/teams/errors";
import { TeamRepositoryError } from "@/features/teams/teamRepository";

import {
  type GuestDatabase,
  MATCH_RESULT_MATCH_TEAM_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  MATCH_TOURNAMENT_INDEX,
  TEAM_STORE,
  TEAM_TOURNAMENT_INDEX,
} from "./guestDatabase";
import type { PersistedTeam } from "./indexedDbTeamRules";
import { abortTransaction, observeTransaction, requestToPromise } from "./indexedDbUtils";
import { parseTeamRecord } from "./parseStoredRecords";

export async function deleteStoredTeam(
  database: GuestDatabase,
  tournamentId: string,
  teamId: string,
): Promise<void> {
  const connection = await database.getConnection();
  const transaction = connection.transaction(
    [TEAM_STORE, MATCH_STORE, MATCH_RESULT_STORE],
    "readwrite",
  );
  const completion = observeTransaction(transaction);
  const store = transaction.objectStore(TEAM_STORE);
  const stored = await requestToPromise<unknown>(store.get(teamId));
  if (stored === undefined) {
    await completion;
    return;
  }
  const existing = parseTeamRecord(stored);
  if (existing.tournamentId !== tournamentId) {
    await completion;
    return;
  }
  const matchIds = await requestToPromise<IDBValidKey[]>(
    transaction.objectStore(MATCH_STORE).index(MATCH_TOURNAMENT_INDEX).getAllKeys(tournamentId),
  );
  const resultIndex = transaction.objectStore(MATCH_RESULT_STORE).index(MATCH_RESULT_MATCH_TEAM_INDEX);
  for (const matchId of matchIds) {
    const resultKey = await requestToPromise<IDBValidKey | undefined>(
      resultIndex.getKey([matchId, teamId]),
    );
    if (resultKey !== undefined) {
      await abortTransaction(transaction);
      throw new TeamDeletionError(tournamentId, teamId);
    }
  }
  await requestToPromise(store.delete(teamId));
  await completion;
}

export async function reorderStoredTeams(
  database: GuestDatabase,
  now: () => string,
  tournamentId: string,
  orderedTeamIds: readonly string[],
): Promise<readonly PersistedTeam[]> {
  const connection = await database.getConnection();
  const transaction = connection.transaction(TEAM_STORE, "readwrite");
  const completion = observeTransaction(transaction);
  const store = transaction.objectStore(TEAM_STORE);
  const storedRoster = await requestToPromise<unknown[]>(
    store.index(TEAM_TOURNAMENT_INDEX).getAll(tournamentId),
  );
  const roster = storedRoster.map(parseTeamRecord);
  const requestedIds = new Set(orderedTeamIds);
  if (
    requestedIds.size !== orderedTeamIds.length ||
    roster.length !== orderedTeamIds.length ||
    roster.some((team) => !requestedIds.has(team.id))
  ) {
    await abortTransaction(transaction);
    throw new TeamRepositoryError(
      "REORDER_MISMATCH",
      "The roster changed before it could be reordered. Reload and try again.",
    );
  }
  const byId = new Map(roster.map((team) => [team.id, team]));
  for (const team of roster) {
    await requestToPromise(store.put({ ...team, slotNumber: null }));
  }
  const timestamp = now();
  const reordered: PersistedTeam[] = [];
  for (const [index, teamId] of orderedTeamIds.entries()) {
    const existing = byId.get(teamId);
    if (!existing) continue;
    const updated: PersistedTeam = { ...existing, slotNumber: index + 1, updatedAt: timestamp };
    await requestToPromise(store.put(updated));
    reordered.push(updated);
  }
  await completion;
  return reordered;
}
