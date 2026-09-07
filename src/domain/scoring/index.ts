export { calculateMatchScore } from "./calculateMatchScore";
export { calculateTournamentStandings } from "./calculateTournamentStandings";
export { resolveTies } from "./resolveTies";
export { validateMatchResults } from "./validateMatchResults";
export {
  assertValidScoringConfig,
  InvalidScoringConfigError,
  validateScoringConfig,
} from "./validateScoringConfig";
export type {
  CalculatedMatchScore,
  Match,
  MatchId,
  MatchResult,
  MatchValidationIssue,
  MatchValidationIssueCode,
  MatchValidationOptions,
  MatchValidationResult,
  ScoringConfig,
  ScoringConfigValidationIssue,
  ScoringConfigValidationIssueCode,
  ScoringConfigValidationResult,
  TeamId,
  TiebreakerType,
  TournamentStanding,
} from "./types";
