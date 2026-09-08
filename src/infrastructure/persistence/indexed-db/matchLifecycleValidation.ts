import {
  MATCH_STATUSES,
  PARTICIPATION_STATUSES,
  type StoredMatchResult,
  type TournamentMatch,
} from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";

import { MatchLifecycleRepositoryError } from "./matchLifecycleErrors";

export function normalizeLifecycleMatch(
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

export function assertValidDraftMatch(match: TournamentMatch): void {
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

export function assertValidResultSnapshot(
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

export function assertTeamReferences(
  tournamentId: string,
  results: readonly StoredMatchResult[],
  teams: readonly Team[],
): void {
  const teamIds = new Set(
    teams.filter((team) => team.tournamentId === tournamentId).map((team) => team.id),
  );
  const invalid = results.find((result) => !teamIds.has(result.teamId));
  if (invalid) {
    throw new MatchLifecycleRepositoryError(
      "INVALID_TEAM_REFERENCE",
      `Team "${invalid.teamId}" does not belong to this tournament.`,
    );
  }
}
