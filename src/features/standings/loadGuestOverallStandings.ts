import {
  calculateOverallStandings,
  type MatchWithStoredResults,
} from "@/domain/standings/calculateOverallStandings";
import type { TournamentStanding } from "@/domain/scoring/types";
import type { Team } from "@/domain/teams/types";
import type { Tournament } from "@/domain/tournaments/types";

import type { MatchRepository } from "@/features/matches/matchRepository";
import type { MatchResultRepository } from "@/features/matches/matchResultRepository";

export interface GuestOverallStandingsSnapshot {
  readonly teams: readonly Team[];
  readonly standings: readonly TournamentStanding[];
  readonly totalMatchCount: number;
  readonly finalizedMatchCount: number;
  readonly draftMatchCount: number;
}

export interface LoadGuestOverallStandingsOptions {
  readonly tournament: Tournament;
  readonly teams: readonly Team[];
  readonly matchRepository: MatchRepository;
  readonly matchResultRepository: MatchResultRepository;
}

export async function loadGuestOverallStandings({
  tournament,
  teams,
  matchRepository,
  matchResultRepository,
}: LoadGuestOverallStandingsOptions): Promise<GuestOverallStandingsSnapshot> {
  const matches = await matchRepository.listMatchesByTournament(tournament.id);
  const finalizedMatches = matches.filter(
    (match) => match.status === "FINALIZED",
  );
  const matchesWithResults: MatchWithStoredResults[] = await Promise.all(
    finalizedMatches.map(async (match) => ({
      match,
      results: await matchResultRepository.getResultsByMatch(
        tournament.id,
        match.id,
      ),
    })),
  );

  return {
    teams,
    standings: calculateOverallStandings({
      teamIds: teams.map((team) => team.id),
      matches: matchesWithResults,
      scoringConfig: tournament.scoringConfig,
    }),
    totalMatchCount: matches.length,
    finalizedMatchCount: finalizedMatches.length,
    draftMatchCount: matches.length - finalizedMatches.length,
  };
}
