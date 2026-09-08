import type { Tournament } from "@/domain/tournaments/types";
import type { PersistedImage } from "@/infrastructure/browser/persistedImage";

export type GuestTournament = Tournament<PersistedImage>;

export interface CreateTournamentInput {
  readonly name: string;
  readonly game: string;
  readonly tournamentLogo: PersistedImage | null;
  readonly organizerName: string;
  readonly organizerLogo: PersistedImage | null;
}
