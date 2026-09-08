export const MAX_TEAM_NAME_LENGTH = 80;
export const MAX_TEAM_SHORT_NAME_LENGTH = 16;
export const MAX_TEAM_SLOT_NUMBER = 999;

export interface TeamValidationCandidate {
  readonly tournamentId: string;
  readonly name: string;
  readonly shortName?: string | null;
  readonly slotNumber?: number | null;
}

export type TeamValidationField =
  | "tournamentId"
  | "name"
  | "shortName"
  | "slotNumber";

export type TeamValidationIssueCode =
  | "REQUIRED"
  | "TOO_LONG"
  | "INVALID_SLOT";

export interface TeamValidationIssue {
  readonly field: TeamValidationField;
  readonly code: TeamValidationIssueCode;
  readonly message: string;
}

export interface TeamValidationResult {
  readonly valid: boolean;
  readonly issues: readonly TeamValidationIssue[];
}

export function normalizeTeamWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeTeamNameKey(value: string): string {
  return normalizeTeamWhitespace(value).toLowerCase();
}

export function validateTeam(
  input: TeamValidationCandidate,
): TeamValidationResult {
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

  return { valid: issues.length === 0, issues };
}
