import type { StoredMatchResult } from "@/domain/matches/types";
import type { ManualMatchValidationIssue } from "@/domain/matches/validation";

export function formatMatchEntryIssue(
  issue: ManualMatchValidationIssue,
): string {
  switch (issue.code) {
    case "DUPLICATE_PLACEMENT":
      return `Two teams currently have placement #${issue.placement}.`;
    case "INVALID_KILLS":
      return "Finishes must be a non-negative whole number.";
    case "INVALID_PLACEMENT":
      return "Placement must be a valid whole number within the team count.";
    case "DNP_HAS_SCORING_DATA":
      return "DNP teams must leave placement and finishes empty.";
    case "MISSING_TEAM":
      return `A required team result is missing (${issue.teamId}).`;
    case "UNKNOWN_TEAM":
      return `A saved result references an invalid team (${issue.teamId}).`;
    default:
      return issue.message.replaceAll("kills", "finishes");
  }
}

export function matchResultHasIssue(
  result: StoredMatchResult,
  index: number,
  issues: readonly ManualMatchValidationIssue[],
): boolean {
  return issues.some(
    (issue) =>
      issue.resultIndex === index ||
      issue.teamId === result.teamId ||
      (issue.code === "DUPLICATE_PLACEMENT" &&
        issue.placement !== undefined &&
        result.placement === issue.placement),
  );
}

