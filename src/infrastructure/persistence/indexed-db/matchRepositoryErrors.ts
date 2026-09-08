export type MatchRepositoryErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "DUPLICATE_MATCH_NUMBER"
  | "INVALID_MATCH";

export class MatchRepositoryError extends Error {
  readonly code: MatchRepositoryErrorCode;

  constructor(code: MatchRepositoryErrorCode, message: string) {
    super(message);
    this.name = "MatchRepositoryError";
    this.code = code;
  }
}
