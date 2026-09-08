export type MatchLifecycleRepositoryErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "MATCH_NOT_FOUND"
  | "MATCH_NOT_DRAFT"
  | "MATCH_NOT_FINALIZED"
  | "DUPLICATE_MATCH_NUMBER"
  | "INVALID_MATCH"
  | "INVALID_RESULT"
  | "INVALID_TEAM_REFERENCE"
  | "INITIAL_RESULTS_MISMATCH";

export class MatchLifecycleRepositoryError extends Error {
  readonly code: MatchLifecycleRepositoryErrorCode;

  constructor(code: MatchLifecycleRepositoryErrorCode, message: string) {
    super(message);
    this.name = "MatchLifecycleRepositoryError";
    this.code = code;
  }
}
