import type {
  ScoringConfig,
  ScoringConfigValidationIssue,
  ScoringConfigValidationResult,
  TiebreakerType,
} from "./types";
import {
  hasSupportedScorePrecision,
  isScoreValueInExactRange,
  MAX_SCORE_DECIMAL_PLACES,
} from "./scorePrecision";

const VALID_TIEBREAKERS = new Set<TiebreakerType>([
  "TOTAL_POINTS",
  "WWCD",
  "PLACEMENT_POINTS",
  "TOTAL_KILLS",
  "BEST_PLACEMENT",
  "LATEST_MATCH_PLACEMENT",
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isValidPlacementKey(key: string): boolean {
  const placement = Number(key);
  return (
    Number.isInteger(placement) && placement > 0 && String(placement) === key
  );
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export class InvalidScoringConfigError extends Error {
  readonly issues: readonly ScoringConfigValidationIssue[];

  constructor(issues: readonly ScoringConfigValidationIssue[]) {
    super(
      `Invalid scoring configuration: ${issues
        .map((issue) => issue.message)
        .join(" ")}`,
    );
    this.name = "InvalidScoringConfigError";
    this.issues = issues;
  }
}

export function validateScoringConfig(
  config: unknown,
): ScoringConfigValidationResult {
  const issues: ScoringConfigValidationIssue[] = [];

  if (!isPlainRecord(config)) {
    return {
      valid: false,
      issues: [
        {
          code: "INVALID_CONFIG",
          field: "config",
          message: "Scoring configuration must be an object.",
        },
      ],
    };
  }

  if (!isPlainRecord(config.placementPoints)) {
    issues.push({
      code: "INVALID_PLACEMENT_MAP",
      field: "placementPoints",
      message: "Placement points must be a plain key-value map.",
    });
  } else {
    for (const [key, value] of Object.entries(config.placementPoints)) {
      if (!isValidPlacementKey(key)) {
        issues.push({
          code: "INVALID_PLACEMENT_KEY",
          field: `placementPoints.${key}`,
          message: `Placement key "${key}" must be a canonical positive integer.`,
        });
      }

      const field = `placementPoints.${key}`;
      if (!isFiniteNonNegativeNumber(value)) {
        issues.push({
          code: "INVALID_PLACEMENT_VALUE",
          field,
          message: `Points for placement "${key}" must be a finite, non-negative number.`,
        });
      } else if (!hasSupportedScorePrecision(value)) {
        issues.push({
          code: "UNSUPPORTED_SCORE_PRECISION",
          field,
          message: `Points for placement "${key}" must use at most ${MAX_SCORE_DECIMAL_PLACES} decimal places.`,
        });
      } else if (!isScoreValueInExactRange(value)) {
        issues.push({
          code: "SCORE_OUT_OF_RANGE",
          field,
          message: `Points for placement "${key}" exceed the supported exact score range.`,
        });
      }
    }
  }

  if (!isFiniteNonNegativeNumber(config.pointsPerKill)) {
    issues.push({
      code: "INVALID_POINTS_PER_KILL",
      field: "pointsPerKill",
      message: "Points per kill must be a finite, non-negative number.",
    });
  } else if (!hasSupportedScorePrecision(config.pointsPerKill)) {
    issues.push({
      code: "UNSUPPORTED_SCORE_PRECISION",
      field: "pointsPerKill",
      message: `Points per kill must use at most ${MAX_SCORE_DECIMAL_PLACES} decimal places.`,
    });
  } else if (!isScoreValueInExactRange(config.pointsPerKill)) {
    issues.push({
      code: "SCORE_OUT_OF_RANGE",
      field: "pointsPerKill",
      message: "Points per kill exceed the supported exact score range.",
    });
  }

  if (!Array.isArray(config.tiebreakers)) {
    issues.push({
      code: "INVALID_TIEBREAKERS",
      field: "tiebreakers",
      message: "Tiebreakers must be an ordered array.",
    });
  } else {
    const seen = new Set<string>();

    config.tiebreakers.forEach((criterion, index) => {
      if (typeof criterion !== "string" || !VALID_TIEBREAKERS.has(criterion as TiebreakerType)) {
        issues.push({
          code: "UNKNOWN_TIEBREAKER",
          field: `tiebreakers.${index}`,
          message: `Tiebreaker at index ${index} is not supported.`,
        });
        return;
      }

      if (seen.has(criterion)) {
        issues.push({
          code: "DUPLICATE_TIEBREAKER",
          field: `tiebreakers.${index}`,
          message: `Tiebreaker "${criterion}" is duplicated.`,
        });
      } else {
        seen.add(criterion);
      }
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function assertValidScoringConfig(
  config: unknown,
): asserts config is ScoringConfig {
  const validation = validateScoringConfig(config);
  if (!validation.valid) {
    throw new InvalidScoringConfigError(validation.issues);
  }
}
