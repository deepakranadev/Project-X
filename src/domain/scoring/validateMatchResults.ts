import type {
  MatchResult,
  MatchValidationIssue,
  MatchValidationOptions,
  MatchValidationResult,
} from "./types";

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function validateMatchResults(
  results: readonly MatchResult[],
  options: MatchValidationOptions = {},
): MatchValidationResult {
  const issues: MatchValidationIssue[] = [];
  const participantIds = options.participantTeamIds
    ? new Set(options.participantTeamIds)
    : null;
  const participantCount =
    options.participantCount ?? options.participantTeamIds?.length ?? results.length;
  const seenTeams = new Set<string>();
  const seenPlacements = new Map<number, string>();

  results.forEach((result, resultIndex) => {
    const teamId = result.teamId.trim();

    if (teamId.length === 0) {
      issues.push({
        code: "INVALID_TEAM",
        message: "Every result must identify a team.",
        resultIndex,
      });
    } else {
      if (seenTeams.has(teamId)) {
        issues.push({
          code: "DUPLICATE_TEAM",
          message: `Team "${teamId}" appears more than once.`,
          resultIndex,
          teamId,
        });
      }
      seenTeams.add(teamId);

      if (participantIds && !participantIds.has(teamId)) {
        issues.push({
          code: "UNKNOWN_TEAM",
          message: `Team "${teamId}" is not a participant in this match.`,
          resultIndex,
          teamId,
        });
      }
    }

    const bonusPoints = result.bonusPoints ?? 0;
    if (!isFiniteNonNegative(bonusPoints)) {
      issues.push({
        code: "INVALID_BONUS",
        message: "Bonus points must be a finite, non-negative number.",
        resultIndex,
        teamId: teamId || undefined,
      });
    }

    const penaltyPoints = result.penaltyPoints ?? 0;
    if (!isFiniteNonNegative(penaltyPoints)) {
      issues.push({
        code: "INVALID_PENALTY",
        message: "Penalty points must be a finite, non-negative number.",
        resultIndex,
        teamId: teamId || undefined,
      });
    }

    if (result.didNotParticipate) {
      if (result.placement !== null || result.kills !== null) {
        issues.push({
          code: "DNP_HAS_SCORING_DATA",
          message: "DNP results must leave placement and kills empty.",
          resultIndex,
          teamId: teamId || undefined,
        });
      }
      return;
    }

    const placementIsValid =
      Number.isInteger(result.placement) &&
      (result.placement ?? 0) > 0 &&
      (result.placement ?? Number.POSITIVE_INFINITY) <= participantCount;

    if (!placementIsValid) {
      issues.push({
        code: "INVALID_PLACEMENT",
        message: `Placement must be an integer from 1 to ${participantCount}.`,
        resultIndex,
        teamId: teamId || undefined,
      });
    } else {
      const placement = result.placement as number;
      const firstTeamAtPlacement = seenPlacements.get(placement);
      if (firstTeamAtPlacement !== undefined) {
        issues.push({
          code: "DUPLICATE_PLACEMENT",
          message: `Placement #${placement} is assigned to both "${firstTeamAtPlacement}" and "${teamId}".`,
          resultIndex,
          teamId: teamId || undefined,
          placement,
        });
      } else {
        seenPlacements.set(placement, teamId);
      }
    }

    if (!Number.isInteger(result.kills) || (result.kills ?? -1) < 0) {
      issues.push({
        code: "INVALID_KILLS",
        message: "Kills must be a non-negative integer.",
        resultIndex,
        teamId: teamId || undefined,
      });
    }
  });

  if (participantIds) {
    for (const participantId of participantIds) {
      if (!seenTeams.has(participantId)) {
        issues.push({
          code: "MISSING_TEAM",
          message: `Team "${participantId}" is missing from the match results.`,
          teamId: participantId,
        });
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
