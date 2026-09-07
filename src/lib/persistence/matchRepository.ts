import type {
  MatchDetailsUpdate,
  TournamentMatch,
} from "@/domain/matches/types";

export interface MatchRepository {
  createMatch(match: TournamentMatch): Promise<TournamentMatch>;
  getMatch(tournamentId: string, matchId: string): Promise<TournamentMatch | null>;
  listMatchesByTournament(
    tournamentId: string,
  ): Promise<readonly TournamentMatch[]>;
  updateMatch(
    tournamentId: string,
    matchId: string,
    updates: MatchDetailsUpdate,
  ): Promise<TournamentMatch | null>;
  deleteMatch(tournamentId: string, matchId: string): Promise<void>;
}
