import type {
  StoredMatchResult,
  TournamentMatch,
} from "@/domain/matches/types";
import { calculateTournamentStandings } from "@/domain/scoring/calculateTournamentStandings";
import { resolveTies } from "@/domain/scoring/resolveTies";
import type {
  Match,
  ScoringConfig,
  TournamentStanding,
} from "@/domain/scoring/types";

export interface MatchWithStoredResults {
  readonly match: TournamentMatch;
  readonly results: readonly StoredMatchResult[];
}

export interface CalculateOverallStandingsInput {
  readonly teamIds: readonly string[];
  readonly matches: readonly MatchWithStoredResults[];
  readonly scoringConfig: ScoringConfig;
}

function toScoringMatch({
  match,
  results,
}: MatchWithStoredResults): Match {
  return {
    id: match.id,
    matchNumber: match.matchNumber,
    participantTeamIds: results.map((result) => result.teamId),
    results: results.map((result) => ({
      teamId: result.teamId,
      placement: result.placement,
      kills: result.kills,
      didNotParticipate: result.participationStatus === "DNP",
    })),
  };
}

function createEmptyStanding(teamId: string): TournamentStanding {
  return {
    rank: 0,
    teamId,
    matchesPlayed: 0,
    wwcd: 0,
    placementPoints: 0,
    totalKills: 0,
    killPoints: 0,
    bonusPoints: 0,
    penaltyPoints: 0,
    totalPoints: 0,
    bestPlacement: null,
    latestMatchPlacement: null,
  };
}

export function calculateOverallStandings({
  teamIds,
  matches,
  scoringConfig,
}: CalculateOverallStandingsInput): readonly TournamentStanding[] {
  const finalizedMatches = matches
    .filter(({ match }) => match.status === "FINALIZED")
    .map(toScoringMatch);
  const calculated = calculateTournamentStandings(
    finalizedMatches,
    scoringConfig,
  );
  const includedTeamIds = new Set(calculated.map((row) => row.teamId));
  const completeRows = [...calculated];

  for (const teamId of new Set(teamIds)) {
    if (!includedTeamIds.has(teamId)) {
      completeRows.push(createEmptyStanding(teamId));
    }
  }

  return resolveTies(completeRows, scoringConfig.tiebreakers);
}

