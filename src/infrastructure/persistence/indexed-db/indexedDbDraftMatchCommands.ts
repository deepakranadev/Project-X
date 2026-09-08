import type { StoredMatchResult, TournamentMatch } from "@/domain/matches/types";
import type { MatchSnapshotCommand, PersistedMatchSnapshot } from "@/features/matches/matchLifecycleRepository";

import {
  type GuestDatabase,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  MATCH_TOURNAMENT_NUMBER_INDEX,
  TEAM_STORE,
  TOURNAMENT_STORE,
} from "./guestDatabase";
import { MatchLifecycleRepositoryError } from "./matchLifecycleErrors";
import {
  abortAndRethrow,
  assertStoredTournament,
  readMatchForTournament,
  readTournamentTeams,
  writeAuthoritativeResults,
} from "./matchLifecycleTransactionSupport";
import {
  assertTeamReferences,
  assertValidDraftMatch,
  assertValidResultSnapshot,
  normalizeLifecycleMatch,
} from "./matchLifecycleValidation";
import { observeTransaction, requestToPromise } from "./indexedDbUtils";

export async function createMatchWithInitialResults(
  database: GuestDatabase,
  match: TournamentMatch,
  results: readonly StoredMatchResult[],
): Promise<PersistedMatchSnapshot> {
  assertValidDraftMatch(match);
  assertValidResultSnapshot(match.tournamentId, match.id, results);
  const connection = await database.getConnection();
  const transaction = connection.transaction(
    [TOURNAMENT_STORE, MATCH_STORE, TEAM_STORE, MATCH_RESULT_STORE],
    "readwrite",
  );
  const completion = observeTransaction(transaction);

  try {
    await assertStoredTournament(transaction, match.tournamentId);
    const matchStore = transaction.objectStore(MATCH_STORE);
    const duplicateNumber = await requestToPromise<IDBValidKey | undefined>(
      matchStore.index(MATCH_TOURNAMENT_NUMBER_INDEX).getKey([
        match.tournamentId,
        match.matchNumber,
      ]),
    );
    if (duplicateNumber !== undefined) {
      throw new MatchLifecycleRepositoryError(
        "DUPLICATE_MATCH_NUMBER",
        `Match ${match.matchNumber} already exists in this tournament.`,
      );
    }

    const teams = await readTournamentTeams(transaction, match.tournamentId);
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

    const normalized = normalizeLifecycleMatch(match, match.name, "DRAFT", match.updatedAt);
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

export async function saveMatchDraft(
  database: GuestDatabase,
  now: () => string,
  command: MatchSnapshotCommand,
): Promise<PersistedMatchSnapshot> {
  assertValidResultSnapshot(command.tournamentId, command.matchId, command.results);
  const connection = await database.getConnection();
  const transaction = connection.transaction(
    [TOURNAMENT_STORE, MATCH_STORE, TEAM_STORE, MATCH_RESULT_STORE],
    "readwrite",
  );
  const completion = observeTransaction(transaction);

  try {
    await assertStoredTournament(transaction, command.tournamentId);
    const match = await readMatchForTournament(transaction, command.tournamentId, command.matchId);
    if (match.status !== "DRAFT") {
      throw new MatchLifecycleRepositoryError(
        "MATCH_NOT_DRAFT",
        "Reopen this finalized match before saving draft changes.",
      );
    }
    const teams = await readTournamentTeams(transaction, command.tournamentId);
    assertTeamReferences(command.tournamentId, command.results, teams);
    const timestamp = now();
    const savedResults = await writeAuthoritativeResults(
      transaction,
      command.tournamentId,
      command.matchId,
      command.results,
      timestamp,
    );
    const updated = normalizeLifecycleMatch(match, command.name, "DRAFT", timestamp);
    await requestToPromise(transaction.objectStore(MATCH_STORE).put(updated));
    await completion;
    return { match: updated, results: savedResults };
  } catch (error) {
    return abortAndRethrow(transaction, error);
  }
}
