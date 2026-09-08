import { createEmptyManualResults } from "@/domain/matches/createEmptyManualResults";
import type { StoredMatchResult } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";

export interface MatchDraftRows {
  readonly created: readonly StoredMatchResult[];
  readonly results: readonly StoredMatchResult[];
}

interface BuildMatchDraftRowsOptions {
  readonly stored: readonly StoredMatchResult[];
  readonly teams: readonly Team[];
  readonly tournamentId: string;
  readonly matchId: string;
  readonly createId: () => string;
  readonly now: () => string;
}

export function buildMatchDraftRows({
  stored,
  teams,
  tournamentId,
  matchId,
  createId,
  now,
}: BuildMatchDraftRowsOptions): MatchDraftRows {
  const storedByTeam = new Map(stored.map((result) => [result.teamId, result]));
  const missingTeams = teams.filter((team) => !storedByTeam.has(team.id));
  const created = createEmptyManualResults({
    tournamentId,
    matchId,
    teams: missingTeams,
    createId,
    now,
  });
  const createdByTeam = new Map(created.map((result) => [result.teamId, result]));
  const currentTeamIds = new Set(teams.map((team) => team.id));
  const results = [
    ...teams.map((team) => storedByTeam.get(team.id) ?? createdByTeam.get(team.id)),
    ...stored.filter((result) => !currentTeamIds.has(result.teamId)),
  ].filter((result): result is StoredMatchResult => result !== undefined);
  return { created, results };
}

export function updateMatchResultNumber(
  results: readonly StoredMatchResult[],
  resultId: string,
  field: "placement" | "kills",
  rawValue: string,
): readonly StoredMatchResult[] {
  const value = rawValue === "" ? null : Number(rawValue);
  return results.map((result) =>
    result.id === resultId ? { ...result, [field]: value } : result,
  );
}

export function toggleMatchResultDnp(
  results: readonly StoredMatchResult[],
  resultId: string,
): readonly StoredMatchResult[] {
  return results.map((result) => {
    if (result.id !== resultId) return result;
    if (result.participationStatus === "PLAYED") {
      return { ...result, placement: null, kills: null, participationStatus: "DNP" };
    }
    return { ...result, participationStatus: "PLAYED" };
  });
}

export function autoFillMatchPlacements(
  results: readonly StoredMatchResult[],
): readonly StoredMatchResult[] {
  let placement = 0;
  return results.map((result) => {
    if (result.participationStatus === "DNP") return result;
    placement += 1;
    return { ...result, placement };
  });
}
