import type {
  MatchValidationIssue,
  MatchValidationIssueCode,
} from "@/domain/scoring/types";
import { validateMatchResults } from "@/domain/scoring/validateMatchResults";

import type { StoredMatchResult } from "./types";

export type ManualMatchValidationIssueCode =
  | MatchValidationIssueCode
  | "RESULT_TOURNAMENT_MISMATCH"
  | "RESULT_MATCH_MISMATCH"
  | "INVALID_SOURCE";

export interface ManualMatchValidationIssue
  extends Omit<MatchValidationIssue, "code"> {
  readonly code: ManualMatchValidationIssueCode;
}

export interface ManualMatchValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ManualMatchValidationIssue[];
}

export interface ManualMatchValidationOptions {
  readonly tournamentId: string;
  readonly matchId: string;
  readonly participantTeamIds: readonly string[];
}

export function validateManualMatchResults(
  results: readonly StoredMatchResult[],
  options: ManualMatchValidationOptions,
): ManualMatchValidationResult {
  const contextIssues: ManualMatchValidationIssue[] = [];

  results.forEach((result, resultIndex) => {
    if (result.tournamentId !== options.tournamentId) {
      contextIssues.push({
        code: "RESULT_TOURNAMENT_MISMATCH",
        message: `Team "${result.teamId}" has a result from another tournament.`,
        resultIndex,
        teamId: result.teamId,
      });
    }
    if (result.matchId !== options.matchId) {
      contextIssues.push({
        code: "RESULT_MATCH_MISMATCH",
        message: `Team "${result.teamId}" has a result from another match.`,
        resultIndex,
        teamId: result.teamId,
      });
    }
    if (result.source !== "MANUAL") {
      contextIssues.push({
        code: "INVALID_SOURCE",
        message: "Manual entry can only save manually entered results.",
        resultIndex,
        teamId: result.teamId,
      });
    }
  });

  const scoringValidation = validateMatchResults(
    results.map((result) => ({
      teamId: result.teamId,
      placement: result.placement,
      kills: result.kills,
      didNotParticipate: result.participationStatus === "DNP",
    })),
    { participantTeamIds: options.participantTeamIds },
  );
  const issues: ManualMatchValidationIssue[] = [
    ...contextIssues,
    ...scoringValidation.issues,
  ];

  return { valid: issues.length === 0, issues };
}

