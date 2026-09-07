export const MATCH_STATUSES = ["DRAFT", "FINALIZED"] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export interface TournamentMatch {
  readonly id: string;
  readonly tournamentId: string;
  readonly matchNumber: number;
  readonly name?: string;
  readonly status: MatchStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type MatchUpdate = Partial<
  Pick<TournamentMatch, "matchNumber" | "name" | "status">
>;

export const PARTICIPATION_STATUSES = ["PLAYED", "DNP"] as const;

export type ParticipationStatus = (typeof PARTICIPATION_STATUSES)[number];

export interface StoredMatchResult {
  readonly id: string;
  readonly tournamentId: string;
  readonly matchId: string;
  readonly teamId: string;
  readonly placement: number | null;
  readonly kills: number | null;
  readonly participationStatus: ParticipationStatus;
  readonly source: "MANUAL";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type MatchResultUpdate = Partial<
  Pick<
    StoredMatchResult,
    "placement" | "kills" | "participationStatus" | "source"
  >
>;

