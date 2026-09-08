import type {
  CalculatedMatchScore,
  MatchId,
  MatchResult,
  ScoringConfig,
} from "./types";
import {
  addScoreUnits,
  fromScoreUnits,
  multiplyScoreUnits,
  type ScoreUnits,
  toScoreUnits,
} from "./scorePrecision";
import { assertValidScoringConfig } from "./validateScoringConfig";

function assertFiniteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${field} must be a finite, non-negative number.`);
  }
}

export interface CalculatedMatchScoreUnits {
  readonly matchId: MatchId;
  readonly teamId: MatchResult["teamId"];
  readonly didNotParticipate: boolean;
  readonly placement: number | null;
  readonly kills: number | null;
  readonly placementPoints: ScoreUnits;
  readonly killPoints: ScoreUnits;
  readonly bonusPoints: ScoreUnits;
  readonly penaltyPoints: ScoreUnits;
  readonly totalPoints: ScoreUnits;
}

export function calculateMatchScoreUnits(
  matchId: MatchId,
  result: MatchResult,
  config: ScoringConfig,
): CalculatedMatchScoreUnits {
  assertValidScoringConfig(config);

  const bonusPoints = result.bonusPoints ?? 0;
  const penaltyPoints = result.penaltyPoints ?? 0;
  assertFiniteNonNegative(bonusPoints, "bonusPoints");
  assertFiniteNonNegative(penaltyPoints, "penaltyPoints");

  if (result.didNotParticipate) {
    if (
      result.placement !== null ||
      result.kills !== null ||
      bonusPoints !== 0 ||
      penaltyPoints !== 0
    ) {
      throw new RangeError(
        "DNP results must not include placement, kills, bonus points, or penalty points.",
      );
    }

    return {
      matchId,
      teamId: result.teamId,
      didNotParticipate: true,
      placement: null,
      kills: null,
      placementPoints: 0,
      killPoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      totalPoints: 0,
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
  const placementPointUnits = toScoreUnits(placementPoints);
  const killPointUnits = multiplyScoreUnits(
    toScoreUnits(config.pointsPerKill),
    kills,
  );
  const bonusPointUnits = toScoreUnits(bonusPoints);
  const penaltyPointUnits = toScoreUnits(penaltyPoints);

  return {
    matchId,
    teamId: result.teamId,
    didNotParticipate: false,
    placement,
    kills,
    placementPoints: placementPointUnits,
    killPoints: killPointUnits,
    bonusPoints: bonusPointUnits,
    penaltyPoints: penaltyPointUnits,
    totalPoints: addScoreUnits(
      placementPointUnits,
      killPointUnits,
      bonusPointUnits,
      -penaltyPointUnits,
    ),
  };
}

export function calculateMatchScore(
  matchId: MatchId,
  result: MatchResult,
  config: ScoringConfig,
): CalculatedMatchScore {
  const score = calculateMatchScoreUnits(matchId, result, config);
  return {
    ...score,
    placementPoints: fromScoreUnits(score.placementPoints),
    killPoints: fromScoreUnits(score.killPoints),
    bonusPoints: fromScoreUnits(score.bonusPoints),
    penaltyPoints: fromScoreUnits(score.penaltyPoints),
    totalPoints: fromScoreUnits(score.totalPoints),
  };
}
