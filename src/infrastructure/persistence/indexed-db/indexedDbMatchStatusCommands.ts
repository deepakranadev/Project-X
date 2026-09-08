import type { TournamentMatch } from "@/domain/matches/types";
import { validateManualMatchResults } from "@/domain/matches/validation";
import type { FinalizeMatchResult, MatchSnapshotCommand } from "@/features/matches/matchLifecycleRepository";

import {
  type GuestDatabase,
  MATCH_RESULT_STORE,
  MATCH_STORE,
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
import { assertValidResultSnapshot, normalizeLifecycleMatch } from "./matchLifecycleValidation";
import { abortTransaction, observeTransaction, requestToPromise } from "./indexedDbUtils";

export async function finalizeMatch(
  database: GuestDatabase,
  now: () => string,
  command: MatchSnapshotCommand,
): Promise<FinalizeMatchResult> {
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
        "This match is already finalized. Reopen it before finalizing again.",
      );
    }
    const teams = await readTournamentTeams(transaction, command.tournamentId);
    const validation = validateManualMatchResults(command.results, {
      tournamentId: command.tournamentId,
      matchId: command.matchId,
      participantTeamIds: teams.map((team) => team.id),
    });
    if (!validation.valid) {
      await abortTransaction(transaction);
      return { ok: false, issues: validation.issues };
    }

    const timestamp = now();
    const savedResults = await writeAuthoritativeResults(
      transaction,
      command.tournamentId,
      command.matchId,
      command.results,
      timestamp,
    );
    const finalized = normalizeLifecycleMatch(match, command.name, "FINALIZED", timestamp);
    await requestToPromise(transaction.objectStore(MATCH_STORE).put(finalized));
    await completion;
    return { ok: true, match: finalized, results: savedResults };
  } catch (error) {
    return abortAndRethrow(transaction, error);
  }
}

export async function reopenMatch(
  database: GuestDatabase,
  now: () => string,
  tournamentId: string,
  matchId: string,
): Promise<TournamentMatch> {
  const connection = await database.getConnection();
  const transaction = connection.transaction(MATCH_STORE, "readwrite");
  const completion = observeTransaction(transaction);

  try {
    const match = await readMatchForTournament(transaction, tournamentId, matchId);
    if (match.status !== "FINALIZED") {
      throw new MatchLifecycleRepositoryError(
        "MATCH_NOT_FINALIZED",
        "Only a finalized match can be reopened.",
      );
    }
    const reopened = normalizeLifecycleMatch(match, match.name, "DRAFT", now());
    await requestToPromise(transaction.objectStore(MATCH_STORE).put(reopened));
    await completion;
    return reopened;
  } catch (error) {
    return abortAndRethrow(transaction, error);
  }
}
