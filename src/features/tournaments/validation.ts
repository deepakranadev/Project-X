import {
  validateTournament,
  type TournamentValidationIssue as DomainTournamentValidationIssue,
  type TournamentValidationIssueCode as DomainTournamentValidationIssueCode,
} from "@/domain/tournaments/validation";
import {
  validatePersistedImage,
  type PersistedImage,
  type PersistedImageValidationIssueCode,
} from "@/infrastructure/browser/persistedImage";

import type { CreateTournamentInput } from "./types";

export type TournamentValidationField =
  | DomainTournamentValidationIssue["field"]
  | "tournamentLogo"
  | "organizerLogo";

export type TournamentValidationIssueCode =
  | DomainTournamentValidationIssueCode
  | PersistedImageValidationIssueCode;

export interface TournamentValidationIssue {
  readonly field: TournamentValidationField;
  readonly code: TournamentValidationIssueCode;
  readonly message: string;
}

export interface TournamentValidationResult {
  readonly valid: boolean;
  readonly issues: readonly TournamentValidationIssue[];
}

export class TournamentValidationError extends Error {
  readonly issues: readonly TournamentValidationIssue[];

  constructor(issues: readonly TournamentValidationIssue[]) {
    super(issues.map((issue) => issue.message).join(" "));
    this.name = "TournamentValidationError";
    this.issues = issues;
  }
}

export function validateTournamentImage(
  image: PersistedImage,
  field: "tournamentLogo" | "organizerLogo",
): readonly TournamentValidationIssue[] {
  return validatePersistedImage(image).map((issue) => ({ ...issue, field }));
}

export function validateTournamentInput(
  input: CreateTournamentInput,
): TournamentValidationResult {
  const domainValidation = validateTournament(input);
  const issues: TournamentValidationIssue[] = [...domainValidation.issues];

  if (input.tournamentLogo) {
    issues.push(
      ...validateTournamentImage(input.tournamentLogo, "tournamentLogo"),
    );
  }

  if (input.organizerLogo) {
    issues.push(
      ...validateTournamentImage(input.organizerLogo, "organizerLogo"),
    );
  }

  return { valid: issues.length === 0, issues };
}
