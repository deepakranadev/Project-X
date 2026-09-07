import type {
  ScoringConfig,
  TiebreakerType,
} from "@/domain/scoring/types";

export const STANDARD_BGMI_PLACEMENTS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
] as const;

export const OPTIONAL_TIEBREAKER_TYPES = [
  "WWCD",
  "PLACEMENT_POINTS",
  "TOTAL_KILLS",
  "BEST_PLACEMENT",
  "LATEST_MATCH_PLACEMENT",
] as const satisfies readonly TiebreakerType[];

export type OptionalTiebreakerType =
  (typeof OPTIONAL_TIEBREAKER_TYPES)[number];

export const BGMI_STANDARD_SCORING_CONFIG: ScoringConfig = {
  placementPoints: {
    1: 10,
    2: 6,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
    7: 1,
    8: 1,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0,
    16: 0,
  },
  pointsPerKill: 1,
  tiebreakers: [
    "WWCD",
    "PLACEMENT_POINTS",
    "TOTAL_KILLS",
    "LATEST_MATCH_PLACEMENT",
  ],
};

export function copyScoringConfig(config: ScoringConfig): ScoringConfig {
  return {
    placementPoints: { ...config.placementPoints },
    pointsPerKill: config.pointsPerKill,
    tiebreakers: [...config.tiebreakers],
  };
}

export function createBgmiStandardScoringConfig(): ScoringConfig {
  return copyScoringConfig(BGMI_STANDARD_SCORING_CONFIG);
}

export function isBgmiStandardScoringConfig(config: ScoringConfig): boolean {
  const standard = BGMI_STANDARD_SCORING_CONFIG;
  const placementKeys = Object.keys(config.placementPoints);
  const standardKeys = Object.keys(standard.placementPoints);

  return (
    config.pointsPerKill === standard.pointsPerKill &&
    placementKeys.length === standardKeys.length &&
    standardKeys.every(
      (placement) =>
        config.placementPoints[Number(placement)] ===
        standard.placementPoints[Number(placement)],
    ) &&
    config.tiebreakers.length === standard.tiebreakers.length &&
    config.tiebreakers.every(
      (criterion, index) => criterion === standard.tiebreakers[index],
    )
  );
}
