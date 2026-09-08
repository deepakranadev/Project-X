export { calculateMatchScore } from "./calculateMatchScore";
export { calculateTournamentStandings } from "./calculateTournamentStandings";
export { resolveTies } from "./resolveTies";
export {
  addScoreUnits,
  fromScoreUnits,
  hasSupportedScorePrecision,
  isScoreValueInExactRange,
  MAX_SCORE_DECIMAL_PLACES,
  multiplyScoreUnits,
  SCORE_SCALE,
  toScoreUnits,
} from "./scorePrecision";
export type { ScoreUnits } from "./scorePrecision";
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
