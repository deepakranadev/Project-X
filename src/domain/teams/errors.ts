export type TeamDeletionErrorCode = "TEAM_HAS_MATCH_HISTORY";

export class TeamDeletionError extends Error {
  readonly code: TeamDeletionErrorCode;
  readonly tournamentId: string;
  readonly teamId: string;

  constructor(tournamentId: string, teamId: string) {
    super("This team can't be deleted because it already has match history.");
    this.name = "TeamDeletionError";
    this.code = "TEAM_HAS_MATCH_HISTORY";
    this.tournamentId = tournamentId;
    this.teamId = teamId;
  }
}
