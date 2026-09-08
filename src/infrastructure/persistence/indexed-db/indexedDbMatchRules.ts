import { MATCH_STATUSES, type TournamentMatch } from "@/domain/matches/types";

import { MatchRepositoryError } from "./matchRepositoryErrors";

export function normalizeStoredMatch(match: TournamentMatch): TournamentMatch {
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

export function assertValidStoredMatch(match: TournamentMatch): void {
  if (
    !match.id.trim() ||
    !match.tournamentId.trim() ||
    !Number.isInteger(match.matchNumber) ||
    match.matchNumber < 1 ||
    !MATCH_STATUSES.includes(match.status) ||
    !match.createdAt ||
    !match.updatedAt
  ) {
    throw new MatchRepositoryError("INVALID_MATCH", "Match data is incomplete or malformed.");
  }
}
