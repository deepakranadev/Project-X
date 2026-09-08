import { PARTICIPATION_STATUSES, type StoredMatchResult } from "@/domain/matches/types";

import { MatchResultRepositoryError } from "./matchResultRepositoryErrors";

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
    throw new MatchResultRepositoryError("INVALID_RESULT", "A manual result row is incomplete or malformed.");
  }
  if (result.tournamentId !== tournamentId || result.matchId !== matchId) {
    throw new MatchResultRepositoryError("RESULT_CONTEXT_MISMATCH", "A result cannot be saved into another tournament or match.");
  }
  if (result.participationStatus === "DNP" && (result.placement !== null || result.kills !== null)) {
    throw new MatchResultRepositoryError("INVALID_RESULT", "DNP results must leave placement and finishes empty.");
  }
}

export function assertValidDraftResults(
  tournamentId: string,
  matchId: string,
  results: readonly StoredMatchResult[],
): void {
  results.forEach((result) => assertValidDraftResult(tournamentId, matchId, result));
  if (new Set(results.map((result) => result.teamId)).size !== results.length) {
    throw new MatchResultRepositoryError("DUPLICATE_TEAM_RESULT", "Each team can have only one result in a match.");
  }
  if (new Set(results.map((result) => result.id)).size !== results.length) {
    throw new MatchResultRepositoryError("INVALID_RESULT", "Every result row must have a unique identity.");
  }
}
