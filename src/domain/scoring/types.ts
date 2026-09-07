export type TeamId = string;
export type MatchId = string;

export type TiebreakerType =
  | "TOTAL_POINTS"
  | "WWCD"
  | "PLACEMENT_POINTS"
  | "TOTAL_KILLS"
  | "BEST_PLACEMENT"
  | "LATEST_MATCH_PLACEMENT";

export interface ScoringConfig {
  readonly placementPoints: Readonly<Record<number, number>>;
  readonly pointsPerKill: number;
  /** Applied after total points, which is always the primary ranking criterion. */
  readonly tiebreakers: readonly TiebreakerType[];
}

/**
 * Raw result data. DNP is explicit and requires both placement and kills to be null.
 * Bonus and penalty values are non-negative; penalties are subtracted by the engine.
 */
export interface MatchResult {
  readonly teamId: TeamId;
  readonly placement: number | null;
  readonly kills: number | null;
  readonly didNotParticipate: boolean;
  readonly bonusPoints?: number;
  readonly penaltyPoints?: number;
}

export interface Match {
  readonly id: MatchId;
  readonly matchNumber: number;
  /** When supplied, validation requires exactly one result for every participant. */
  readonly participantTeamIds?: readonly TeamId[];
  readonly results: readonly MatchResult[];
}

export interface CalculatedMatchScore {
  readonly matchId: MatchId;
  readonly teamId: TeamId;
  readonly didNotParticipate: boolean;
  readonly placement: number | null;
  readonly kills: number | null;
  readonly placementPoints: number;
  readonly killPoints: number;
  readonly bonusPoints: number;
  readonly penaltyPoints: number;
  readonly totalPoints: number;
}

export interface TournamentStanding {
  /** Competition rank. Teams tied on every criterion share the same rank. */
  readonly rank: number;
  readonly teamId: TeamId;
  readonly matchesPlayed: number;
  readonly wwcd: number;
  readonly placementPoints: number;
  readonly totalKills: number;
  readonly killPoints: number;
  readonly bonusPoints: number;
  readonly penaltyPoints: number;
  readonly totalPoints: number;
  readonly bestPlacement: number | null;
  readonly latestMatchPlacement: number | null;
}

export type MatchValidationIssueCode =
  | "INVALID_TEAM"
  | "DUPLICATE_TEAM"
  | "UNKNOWN_TEAM"
  | "MISSING_TEAM"
  | "DUPLICATE_PLACEMENT"
  | "INVALID_PLACEMENT"
  | "INVALID_KILLS"
  | "DNP_HAS_SCORING_DATA"
  | "INVALID_BONUS"
  | "INVALID_PENALTY";

export interface MatchValidationIssue {
  readonly code: MatchValidationIssueCode;
  readonly message: string;
  readonly resultIndex?: number;
  readonly teamId?: TeamId;
  readonly placement?: number;
}

export interface MatchValidationOptions {
  readonly participantTeamIds?: readonly TeamId[];
  readonly participantCount?: number;
}

export interface MatchValidationResult {
  readonly valid: boolean;
  readonly issues: readonly MatchValidationIssue[];
}

export type ScoringConfigValidationIssueCode =
  | "INVALID_CONFIG"
  | "INVALID_PLACEMENT_MAP"
  | "INVALID_PLACEMENT_KEY"
  | "INVALID_PLACEMENT_VALUE"
  | "INVALID_POINTS_PER_KILL"
  | "INVALID_TIEBREAKERS"
  | "UNKNOWN_TIEBREAKER"
  | "DUPLICATE_TIEBREAKER";

export interface ScoringConfigValidationIssue {
  readonly code: ScoringConfigValidationIssueCode;
  readonly message: string;
  readonly field: string;
}

export interface ScoringConfigValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ScoringConfigValidationIssue[];
}
