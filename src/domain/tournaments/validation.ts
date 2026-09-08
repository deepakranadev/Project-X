export const MAX_TOURNAMENT_NAME_LENGTH = 80;
export const MAX_ORGANIZER_NAME_LENGTH = 80;

export interface TournamentValidationCandidate {
  readonly name: string;
  readonly game: string;
  readonly organizerName: string;
}

export type TournamentValidationField = "name" | "game" | "organizerName";

export type TournamentValidationIssueCode =
  | "REQUIRED"
  | "TOO_LONG"
  | "UNSUPPORTED_GAME";

export interface TournamentValidationIssue {
  readonly field: TournamentValidationField;
  readonly code: TournamentValidationIssueCode;
  readonly message: string;
}

export interface TournamentValidationResult {
  readonly valid: boolean;
  readonly issues: readonly TournamentValidationIssue[];
}

export function validateTournament(
  input: TournamentValidationCandidate,
): TournamentValidationResult {
  const issues: TournamentValidationIssue[] = [];
  const name = input.name.trim();
  const organizerName = input.organizerName.trim();

  if (name.length === 0) {
    issues.push({
      field: "name",
      code: "REQUIRED",
      message: "Enter a tournament name.",
    });
  } else if (name.length > MAX_TOURNAMENT_NAME_LENGTH) {
    issues.push({
      field: "name",
      code: "TOO_LONG",
      message: `Tournament name must be ${MAX_TOURNAMENT_NAME_LENGTH} characters or fewer.`,
    });
  }

  if (input.game !== "BGMI") {
    issues.push({
      field: "game",
      code: "UNSUPPORTED_GAME",
      message: "BGMI is the only supported game right now.",
    });
  }

  if (organizerName.length > MAX_ORGANIZER_NAME_LENGTH) {
    issues.push({
      field: "organizerName",
      code: "TOO_LONG",
      message: `Organizer name must be ${MAX_ORGANIZER_NAME_LENGTH} characters or fewer.`,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
