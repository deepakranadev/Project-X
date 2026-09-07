import type { PersistedImage } from "@/domain/tournaments/types";

export interface Team {
  readonly id: string;
  readonly tournamentId: string;
  readonly name: string;
  readonly shortName: string | null;
  readonly slotNumber: number | null;
  readonly logo: PersistedImage | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateTeamInput {
  readonly tournamentId: string;
  readonly name: string;
  readonly shortName?: string | null;
  readonly slotNumber?: number | null;
  readonly logo?: PersistedImage | null;
}

export type TeamUpdate = Partial<
  Pick<Team, "name" | "shortName" | "slotNumber" | "logo">
>;
