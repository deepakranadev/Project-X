import type {
  Tournament,
  TournamentUpdate,
} from "@/domain/tournaments/types";

export interface TournamentRepository {
  createTournament(tournament: Tournament): Promise<Tournament>;
  getTournament(id: string): Promise<Tournament | null>;
  updateTournament(
    id: string,
    updates: TournamentUpdate,
  ): Promise<Tournament | null>;
  listTournaments(): Promise<readonly Tournament[]>;
  deleteTournament(id: string): Promise<void>;
}
