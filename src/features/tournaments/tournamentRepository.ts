import type { Tournament } from "@/domain/tournaments/types";

export type TournamentUpdate<Image = unknown> = Partial<
  Pick<
    Tournament<Image>,
    | "name"
    | "game"
    | "tournamentLogo"
    | "organizerName"
    | "organizerLogo"
    | "scoringConfig"
  >
>;

export interface TournamentRepository<Image = unknown> {
  createTournament(tournament: Tournament<Image>): Promise<Tournament<Image>>;
  getTournament(id: string): Promise<Tournament<Image> | null>;
  updateTournament(
    id: string,
    updates: TournamentUpdate<Image>,
  ): Promise<Tournament<Image> | null>;
  listTournaments(): Promise<readonly Tournament<Image>[]>;
  deleteTournament(id: string): Promise<void>;
}
