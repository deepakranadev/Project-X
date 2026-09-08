import {
  validateTeam,
  type TeamValidationIssue as DomainTeamValidationIssue,
  type TeamValidationIssueCode as DomainTeamValidationIssueCode,
} from "@/domain/teams/validation";
import {
  MAX_LOGO_FILE_SIZE_BYTES,
  validatePersistedImage,
  type PersistedImage,
  type PersistedImageValidationIssueCode,
} from "@/infrastructure/browser/persistedImage";

import type { CreateTeamInput } from "./types";

export const TEAM_LOGO_FILE_SIZE_LIMIT_MB =
  MAX_LOGO_FILE_SIZE_BYTES / 1024 / 1024;

export type TeamValidationField =
  | DomainTeamValidationIssue["field"]
  | "logo";

export type TeamValidationIssueCode =
  | DomainTeamValidationIssueCode
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

export function validateTeamLogo(
  image: PersistedImage,
): readonly TeamValidationIssue[] {
  return validatePersistedImage(image).map((issue) => ({
    ...issue,
    field: "logo" as const,
  }));
}

export function validateTeamInput(input: CreateTeamInput): TeamValidationResult {
  const domainValidation = validateTeam(input);
  const issues: TeamValidationIssue[] = [...domainValidation.issues];

  if (input.logo) issues.push(...validateTeamLogo(input.logo));

  return { valid: issues.length === 0, issues };
}

export function assertValidTeamInput(
  input: CreateTeamInput,
): asserts input is CreateTeamInput {
  const validation = validateTeamInput(input);
  if (!validation.valid) throw new TeamValidationError(validation.issues);
}
