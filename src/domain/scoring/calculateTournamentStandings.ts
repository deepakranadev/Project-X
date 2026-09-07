import { calculateMatchScore } from "./calculateMatchScore";
import { resolveTies } from "./resolveTies";
import type {
  Match,
  ScoringConfig,
  TeamId,
  TournamentStanding,
} from "./types";
import { validateMatchResults } from "./validateMatchResults";
import { assertValidScoringConfig } from "./validateScoringConfig";

interface MutableStanding {
  rank: number;
  teamId: TeamId;
  matchesPlayed: number;
  wwcd: number;
  placementPoints: number;
  totalKills: number;
  killPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  totalPoints: number;
  bestPlacement: number | null;
  latestMatchPlacement: number | null;
}

function createEmptyStanding(teamId: TeamId): MutableStanding {
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

function compareMatches(left: Match, right: Match): number {
  const numberDifference = left.matchNumber - right.matchNumber;
  if (numberDifference !== 0) return numberDifference;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

export function calculateTournamentStandings(
  matches: readonly Match[],
  config: ScoringConfig,
): TournamentStanding[] {
  assertValidScoringConfig(config);
  const standings = new Map<TeamId, MutableStanding>();

  for (const match of [...matches].sort(compareMatches)) {
    const validation = validateMatchResults(match.results, {
      participantTeamIds: match.participantTeamIds,
      participantCount:
        match.participantTeamIds?.length ?? match.results.length,
    });

    if (!validation.valid) {
      const details = validation.issues
        .map((issue) => issue.message)
        .join(" ");
      throw new Error(`Match "${match.id}" is invalid. ${details}`);
    }

    for (const result of match.results) {
      const score = calculateMatchScore(match.id, result, config);
      const standing =
        standings.get(result.teamId) ?? createEmptyStanding(result.teamId);

      standing.placementPoints += score.placementPoints;
      standing.killPoints += score.killPoints;
      standing.bonusPoints += score.bonusPoints;
      standing.penaltyPoints += score.penaltyPoints;
      standing.totalPoints += score.totalPoints;

      if (!score.didNotParticipate) {
        const placement = score.placement as number;
        const kills = score.kills as number;
        standing.matchesPlayed += 1;
        standing.totalKills += kills;
        standing.wwcd += placement === 1 ? 1 : 0;
        standing.bestPlacement =
          standing.bestPlacement === null
            ? placement
            : Math.min(standing.bestPlacement, placement);
        standing.latestMatchPlacement = placement;
      }

      standings.set(result.teamId, standing);
    }
  }

  return resolveTies([...standings.values()], config.tiebreakers);
}
