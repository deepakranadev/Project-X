export type MatchResultRepositoryErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "MATCH_NOT_FOUND"
  | "MATCH_NOT_DRAFT"
  | "RESULT_CONTEXT_MISMATCH"
  | "DUPLICATE_TEAM_RESULT"
  | "INVALID_TEAM_REFERENCE"
  | "INVALID_RESULT";

export class MatchResultRepositoryError extends Error {
  readonly code: MatchResultRepositoryErrorCode;

  constructor(code: MatchResultRepositoryErrorCode, message: string) {
    super(message);
    this.name = "MatchResultRepositoryError";
    this.code = code;
  }
}
