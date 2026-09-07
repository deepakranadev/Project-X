import type {
  ScoringConfig,
  ScoringConfigValidationIssue,
  TiebreakerType,
} from "@/domain/scoring/types";
import {
  assertValidScoringConfig,
  validateScoringConfig,
} from "@/domain/scoring/validateScoringConfig";

import {
  isBgmiStandardScoringConfig,
  STANDARD_BGMI_PLACEMENTS,
} from "./scoringPresets";

export type ScoringPresetSelection = "BGMI_STANDARD" | "CUSTOM";

export interface PlacementPointsDraftRow {
  readonly placement: number;
  readonly points: string;
}

export interface ScoringConfigDraft {
  readonly preset: ScoringPresetSelection;
  readonly placementPoints: readonly PlacementPointsDraftRow[];
  readonly pointsPerFinish: string;
  readonly tiebreakers: readonly TiebreakerType[];
}

export interface ScoringDraftIssue {
  readonly field: string;
  readonly message: string;
}

export type ScoringDraftMappingResult =
  | { readonly valid: true; readonly config: ScoringConfig }
  | { readonly valid: false; readonly issues: readonly ScoringDraftIssue[] };

export function placementLabel(placement: number): string {
  const finalTwoDigits = placement % 100;
  if (finalTwoDigits >= 11 && finalTwoDigits <= 13) return `${placement}th`;

  switch (placement % 10) {
    case 1:
      return `${placement}st`;
    case 2:
      return `${placement}nd`;
    case 3:
      return `${placement}rd`;
    default:
      return `${placement}th`;
  }
}

function configuredPlacements(config: ScoringConfig): readonly number[] {
  const placements = new Set<number>(STANDARD_BGMI_PLACEMENTS);
  for (const key of Object.keys(config.placementPoints)) {
    const placement = Number(key);
    if (Number.isInteger(placement) && placement > 0) placements.add(placement);
  }
  return [...placements].sort((left, right) => left - right);
}

export function scoringConfigToDraft(config: ScoringConfig): ScoringConfigDraft {
  assertValidScoringConfig(config);
  return {
    preset: isBgmiStandardScoringConfig(config) ? "BGMI_STANDARD" : "CUSTOM",
    placementPoints: configuredPlacements(config).map((placement) => ({
      placement,
      points: String(config.placementPoints[placement] ?? 0),
    })),
    pointsPerFinish: String(config.pointsPerKill),
    tiebreakers: [...config.tiebreakers],
  };
}

function draftNumber(value: string): number {
  return value.trim().length === 0 ? Number.NaN : Number(value);
}

function actionableIssue(
  issue: ScoringConfigValidationIssue,
): ScoringDraftIssue {
  if (issue.code === "INVALID_PLACEMENT_VALUE") {
    const placement = Number(issue.field.split(".").at(-1));
    return {
      field: issue.field,
      message: Number.isInteger(placement)
        ? `Placement points for ${placementLabel(placement)} must be a valid number that is zero or greater.`
        : "Placement points must be valid numbers that are zero or greater.",
    };
  }

  if (issue.code === "INVALID_POINTS_PER_KILL") {
    return {
      field: "pointsPerFinish",
      message: "Points per finish must be a valid number that is zero or greater.",
    };
  }

  if (issue.code === "DUPLICATE_TIEBREAKER") {
    return {
      field: "tiebreakers",
      message: "The same tiebreaker cannot be used twice.",
    };
  }

  if (issue.code === "UNKNOWN_TIEBREAKER") {
    return {
      field: "tiebreakers",
      message: "Choose only supported tiebreak rules.",
    };
  }

  return { field: issue.field, message: issue.message };
}

export function scoringDraftToConfig(
  draft: ScoringConfigDraft,
): ScoringDraftMappingResult {
  const placementPoints: Record<number, number> = {};
  for (const row of draft.placementPoints) {
    placementPoints[row.placement] = draftNumber(row.points);
  }

  const candidate = {
    placementPoints,
    pointsPerKill: draftNumber(draft.pointsPerFinish),
    tiebreakers: [...draft.tiebreakers],
  };
  const validation = validateScoringConfig(candidate);

  if (!validation.valid) {
    return {
      valid: false,
      issues: validation.issues.map(actionableIssue),
    };
  }

  assertValidScoringConfig(candidate);
  return { valid: true, config: candidate };
}
