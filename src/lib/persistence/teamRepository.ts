import type { Team, TeamUpdate } from "@/domain/teams/types";

export interface TeamRepository {
  createTeam(team: Team): Promise<Team>;
  bulkCreateTeams(teams: readonly Team[]): Promise<readonly Team[]>;
  getTeam(tournamentId: string, teamId: string): Promise<Team | null>;
  listTeamsByTournament(tournamentId: string): Promise<readonly Team[]>;
  updateTeam(
    tournamentId: string,
    teamId: string,
    updates: TeamUpdate,
  ): Promise<Team | null>;
  deleteTeam(tournamentId: string, teamId: string): Promise<void>;
  reorderTeams(
    tournamentId: string,
    orderedTeamIds: readonly string[],
  ): Promise<readonly Team[]>;
}
