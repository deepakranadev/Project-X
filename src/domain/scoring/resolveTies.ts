import type { TiebreakerType, TournamentStanding } from "./types";

function compareDescending(left: number, right: number): number {
  return right - left;
}

function comparePlacement(
  left: number | null,
  right: number | null,
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
}

function compareByCriterion(
  left: TournamentStanding,
  right: TournamentStanding,
  criterion: TiebreakerType,
): number {
  switch (criterion) {
    case "TOTAL_POINTS":
      return compareDescending(left.totalPoints, right.totalPoints);
    case "WWCD":
      return compareDescending(left.wwcd, right.wwcd);
    case "PLACEMENT_POINTS":
      return compareDescending(left.placementPoints, right.placementPoints);
    case "TOTAL_KILLS":
      return compareDescending(left.totalKills, right.totalKills);
    case "BEST_PLACEMENT":
      return comparePlacement(left.bestPlacement, right.bestPlacement);
    case "LATEST_MATCH_PLACEMENT":
      return comparePlacement(
        left.latestMatchPlacement,
        right.latestMatchPlacement,
      );
  }
}

function compareTeamIds(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareCompetitively(
  left: TournamentStanding,
  right: TournamentStanding,
  orderedCriteria: readonly TiebreakerType[],
): number {
  for (const criterion of orderedCriteria) {
    const comparison = compareByCriterion(left, right, criterion);
    if (comparison !== 0) return comparison;
  }

  return 0;
}

export function resolveTies(
  standings: readonly TournamentStanding[],
  configuredTiebreakers: readonly TiebreakerType[],
): TournamentStanding[] {
  const orderedCriteria: TiebreakerType[] = ["TOTAL_POINTS"];

  for (const criterion of configuredTiebreakers) {
    if (!orderedCriteria.includes(criterion)) {
      orderedCriteria.push(criterion);
    }
  }

  const sorted = [...standings]
    .sort((left, right) => {
      const competitiveComparison = compareCompetitively(
        left,
        right,
        orderedCriteria,
      );
      if (competitiveComparison !== 0) return competitiveComparison;

      // Rendering fallback only. It does not affect the competitive rank below.
      return compareTeamIds(left.teamId, right.teamId);
    });

  let previous: TournamentStanding | undefined;
  let competitiveRank = 0;

  return sorted.map((standing, index) => {
    if (
      previous === undefined ||
      compareCompetitively(previous, standing, orderedCriteria) !== 0
    ) {
      competitiveRank = index + 1;
    }

    previous = standing;
    return { ...standing, rank: competitiveRank };
  });
}
