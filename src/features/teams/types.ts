import type { Team } from "@/domain/teams/types";
import type { PersistedImage } from "@/infrastructure/browser/persistedImage";

export type GuestTeam = Team<PersistedImage>;

export interface CreateTeamInput {
  readonly tournamentId: string;
  readonly name: string;
  readonly shortName?: string | null;
  readonly slotNumber?: number | null;
  readonly logo?: PersistedImage | null;
}
