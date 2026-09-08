import type { Team } from "@/domain/teams/types";

import type { GuestTeam } from "./types";

export type TeamUpdate<Image = unknown> = Partial<
  Pick<Team<Image>, "name" | "shortName" | "slotNumber" | "logo">
>;

export type TeamRepositoryErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "DUPLICATE_NAME"
  | "SLOT_CONFLICT"
  | "REORDER_MISMATCH";

export class TeamRepositoryError extends Error {
  readonly code: TeamRepositoryErrorCode;

  constructor(code: TeamRepositoryErrorCode, message: string) {
    super(message);
    this.name = "TeamRepositoryError";
    this.code = code;
  }
}

export interface TeamRepository<Image = unknown> {
  createTeam(team: Team<Image>): Promise<Team<Image>>;
  bulkCreateTeams(
    teams: readonly Team<Image>[],
  ): Promise<readonly Team<Image>[]>;
  getTeam(
    tournamentId: string,
    teamId: string,
  ): Promise<Team<Image> | null>;
  listTeamsByTournament(
    tournamentId: string,
  ): Promise<readonly Team<Image>[]>;
  updateTeam(
    tournamentId: string,
    teamId: string,
    updates: TeamUpdate<Image>,
  ): Promise<Team<Image> | null>;
  deleteTeam(tournamentId: string, teamId: string): Promise<void>;
  reorderTeams(
    tournamentId: string,
    orderedTeamIds: readonly string[],
  ): Promise<readonly Team<Image>[]>;
}

export type GuestTeamRepository = TeamRepository<
  NonNullable<GuestTeam["logo"]>
>;
