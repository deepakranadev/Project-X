import { calculateMatchScoreUnits } from "./calculateMatchScore";
import { resolveTies } from "./resolveTies";
import {
  addScoreUnits,
  fromScoreUnits,
  type ScoreUnits,
} from "./scorePrecision";
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
  placementPointUnits: ScoreUnits;
  totalKills: number;
  killPointUnits: ScoreUnits;
  bonusPointUnits: ScoreUnits;
  penaltyPointUnits: ScoreUnits;
  totalPointUnits: ScoreUnits;
  bestPlacement: number | null;
  latestMatchPlacement: number | null;
}

function createEmptyStanding(teamId: TeamId): MutableStanding {
  return {
    rank: 0,
    teamId,
    matchesPlayed: 0,
    wwcd: 0,
    placementPointUnits: 0,
    totalKills: 0,
    killPointUnits: 0,
    bonusPointUnits: 0,
    penaltyPointUnits: 0,
    totalPointUnits: 0,
    bestPlacement: null,
    latestMatchPlacement: null,
  };
}

function toTournamentStanding(
  standing: MutableStanding,
): TournamentStanding {
  return {
    rank: standing.rank,
    teamId: standing.teamId,
    matchesPlayed: standing.matchesPlayed,
    wwcd: standing.wwcd,
    placementPoints: fromScoreUnits(standing.placementPointUnits),
    totalKills: standing.totalKills,
    killPoints: fromScoreUnits(standing.killPointUnits),
    bonusPoints: fromScoreUnits(standing.bonusPointUnits),
    penaltyPoints: fromScoreUnits(standing.penaltyPointUnits),
    totalPoints: fromScoreUnits(standing.totalPointUnits),
    bestPlacement: standing.bestPlacement,
    latestMatchPlacement: standing.latestMatchPlacement,
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
      const score = calculateMatchScoreUnits(match.id, result, config);
      const standing =
        standings.get(result.teamId) ?? createEmptyStanding(result.teamId);

      standing.placementPointUnits = addScoreUnits(
        standing.placementPointUnits,
        score.placementPoints,
      );
      standing.killPointUnits = addScoreUnits(
        standing.killPointUnits,
        score.killPoints,
      );
      standing.bonusPointUnits = addScoreUnits(
        standing.bonusPointUnits,
        score.bonusPoints,
      );
      standing.penaltyPointUnits = addScoreUnits(
        standing.penaltyPointUnits,
        score.penaltyPoints,
      );
      standing.totalPointUnits = addScoreUnits(
        standing.totalPointUnits,
        score.totalPoints,
      );

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

  return resolveTies(
    [...standings.values()].map(toTournamentStanding),
    config.tiebreakers,
  );
}
