import type { Team } from "@/domain/teams/types";

import type { StoredMatchResult } from "./types";

export interface CreateEmptyManualResultsOptions {
  readonly tournamentId: string;
  readonly matchId: string;
  readonly teams: readonly Team[];
  readonly createId: () => string;
  readonly now: () => string;
}

export function createEmptyManualResults({
  tournamentId,
  matchId,
  teams,
  createId,
  now,
}: CreateEmptyManualResultsOptions): readonly StoredMatchResult[] {
  const timestamp = now();
  return teams.map((team) => ({
    id: createId(),
    tournamentId,
    matchId,
    teamId: team.id,
    placement: null,
    kills: null,
    participationStatus: "PLAYED",
    source: "MANUAL",
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}
