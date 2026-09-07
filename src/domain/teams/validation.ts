import type { PersistedImage } from "@/domain/tournaments/types";
import {
  validatePersistedImage,
  type PersistedImageValidationIssueCode,
} from "@/domain/tournaments/validation";

import type { CreateTeamInput } from "./types";

export const MAX_TEAM_NAME_LENGTH = 80;
export const MAX_TEAM_SHORT_NAME_LENGTH = 16;
export const MAX_TEAM_SLOT_NUMBER = 999;

export type TeamValidationField =
  | "tournamentId"
  | "name"
  | "shortName"
  | "slotNumber"
  | "logo";

export type TeamValidationIssueCode =
  | "REQUIRED"
  | "TOO_LONG"
  | "INVALID_SLOT"
  | PersistedImageValidationIssueCode;

export interface TeamValidationIssue {
  readonly field: TeamValidationField;
  readonly code: TeamValidationIssueCode;
  readonly message: string;
}

export interface TeamValidationResult {
  readonly valid: boolean;
  readonly issues: readonly TeamValidationIssue[];
}

export class TeamValidationError extends Error {
  readonly issues: readonly TeamValidationIssue[];

  constructor(issues: readonly TeamValidationIssue[]) {
    super(issues.map((issue) => issue.message).join(" "));
    this.name = "TeamValidationError";
    this.issues = issues;
  }
}

export function normalizeTeamWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeTeamNameKey(value: string): string {
  return normalizeTeamWhitespace(value).toLowerCase();
}

export function validateTeamLogo(
  image: PersistedImage,
): readonly TeamValidationIssue[] {
  return validatePersistedImage(image).map((issue) => ({
    ...issue,
    field: "logo" as const,
  }));
}

export function validateTeamInput(input: CreateTeamInput): TeamValidationResult {
  const issues: TeamValidationIssue[] = [];
  const tournamentId = input.tournamentId.trim();
  const name = normalizeTeamWhitespace(input.name);
  const shortName = normalizeTeamWhitespace(input.shortName ?? "");

  if (tournamentId.length === 0) {
    issues.push({
      field: "tournamentId",
      code: "REQUIRED",
      message: "A team must belong to a tournament.",
    });
  }

  if (name.length === 0) {
    issues.push({
      field: "name",
      code: "REQUIRED",
      message: "Enter a team name.",
    });
  } else if (name.length > MAX_TEAM_NAME_LENGTH) {
    issues.push({
      field: "name",
      code: "TOO_LONG",
      message: `Team name must be ${MAX_TEAM_NAME_LENGTH} characters or fewer.`,
    });
  }

  if (shortName.length > MAX_TEAM_SHORT_NAME_LENGTH) {
    issues.push({
      field: "shortName",
      code: "TOO_LONG",
      message: `Short name must be ${MAX_TEAM_SHORT_NAME_LENGTH} characters or fewer.`,
    });
  }

  if (
    input.slotNumber !== undefined &&
    input.slotNumber !== null &&
    (!Number.isInteger(input.slotNumber) ||
      input.slotNumber < 1 ||
      input.slotNumber > MAX_TEAM_SLOT_NUMBER)
  ) {
    issues.push({
      field: "slotNumber",
      code: "INVALID_SLOT",
      message: `Slot must be a whole number from 1 to ${MAX_TEAM_SLOT_NUMBER}.`,
    });
  }

  if (input.logo) {
    issues.push(...validateTeamLogo(input.logo));
  }

  return { valid: issues.length === 0, issues };
}

export function assertValidTeamInput(
  input: CreateTeamInput,
): asserts input is CreateTeamInput {
  const validation = validateTeamInput(input);
  if (!validation.valid) throw new TeamValidationError(validation.issues);
}
