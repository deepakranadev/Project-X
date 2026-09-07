import type {
  CalculatedMatchScore,
  MatchId,
  MatchResult,
  ScoringConfig,
} from "./types";
import { assertValidScoringConfig } from "./validateScoringConfig";

function assertFiniteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${field} must be a finite, non-negative number.`);
  }
}

export function calculateMatchScore(
  matchId: MatchId,
  result: MatchResult,
  config: ScoringConfig,
): CalculatedMatchScore {
  assertValidScoringConfig(config);

  const bonusPoints = result.bonusPoints ?? 0;
  const penaltyPoints = result.penaltyPoints ?? 0;
  assertFiniteNonNegative(bonusPoints, "bonusPoints");
  assertFiniteNonNegative(penaltyPoints, "penaltyPoints");

  if (result.didNotParticipate) {
    if (result.placement !== null || result.kills !== null) {
      throw new RangeError("DNP results must not include placement or kills.");
    }

    return {
      matchId,
      teamId: result.teamId,
      didNotParticipate: true,
      placement: null,
      kills: null,
      placementPoints: 0,
      killPoints: 0,
      bonusPoints,
      penaltyPoints,
      totalPoints: bonusPoints - penaltyPoints,
    };
  }

  if (!Number.isInteger(result.placement) || (result.placement ?? 0) <= 0) {
    throw new RangeError("placement must be a positive integer.");
  }

  if (!Number.isInteger(result.kills) || (result.kills ?? -1) < 0) {
    throw new RangeError("kills must be a non-negative integer.");
  }

  const placement = result.placement as number;
  const kills = result.kills as number;
  const placementPoints = config.placementPoints[placement] ?? 0;

  if (!Number.isFinite(placementPoints)) {
    throw new RangeError(`placementPoints[${placement}] must be a finite number.`);
  }

  const killPoints = kills * config.pointsPerKill;

  return {
    matchId,
    teamId: result.teamId,
    didNotParticipate: false,
    placement,
    kills,
    placementPoints,
    killPoints,
    bonusPoints,
    penaltyPoints,
    totalPoints: placementPoints + killPoints + bonusPoints - penaltyPoints,
  };
}
