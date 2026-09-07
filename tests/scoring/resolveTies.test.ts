import { describe, expect, it } from "vitest";

import { resolveTies } from "../../src/domain/scoring/resolveTies";
import type {
  TiebreakerType,
  TournamentStanding,
} from "../../src/domain/scoring/types";

function standing(
  teamId: string,
  overrides: Partial<TournamentStanding> = {},
): TournamentStanding {
  return {
    rank: 0,
    teamId,
    matchesPlayed: 1,
    wwcd: 0,
    placementPoints: 5,
    totalKills: 5,
    killPoints: 5,
    bonusPoints: 0,
    penaltyPoints: 0,
    totalPoints: 10,
    bestPlacement: 3,
    latestMatchPlacement: 3,
    ...overrides,
  };
}

const criterionCases: ReadonlyArray<
  readonly [
    TiebreakerType,
    Partial<TournamentStanding>,
    Partial<TournamentStanding>,
  ]
> = [
  ["WWCD", { wwcd: 0 }, { wwcd: 1 }],
  ["PLACEMENT_POINTS", { placementPoints: 5 }, { placementPoints: 6 }],
  ["TOTAL_KILLS", { totalKills: 5 }, { totalKills: 6 }],
  ["BEST_PLACEMENT", { bestPlacement: 3 }, { bestPlacement: 2 }],
  [
    "LATEST_MATCH_PLACEMENT",
    { latestMatchPlacement: 4 },
    { latestMatchPlacement: 2 },
  ],
];

describe("resolveTies", () => {
  it.each(criterionCases)(
    "orders equal totals by %s",
    (criterion, leftOverrides, rightOverrides) => {
      const resolved = resolveTies(
        [
          standing("team-a", leftOverrides),
          standing("team-b", rightOverrides),
        ],
        [criterion],
      );

      expect(resolved.map(({ teamId }) => teamId)).toEqual([
        "team-b",
        "team-a",
      ]);
      expect(resolved.map(({ rank }) => rank)).toEqual([1, 2]);
    },
  );

  it("keeps total points as the primary ranking criterion", () => {
    const resolved = resolveTies(
      [
        standing("team-a", { totalPoints: 11, totalKills: 0 }),
        standing("team-b", { totalPoints: 10, totalKills: 99 }),
      ],
      ["TOTAL_KILLS"],
    );

    expect(resolved[0]?.teamId).toBe("team-a");
  });

  it("preserves a full competitive tie after every criterion is exhausted", () => {
    const resolved = resolveTies(
      [
        standing("team-b"),
        standing("team-c", { totalPoints: 9 }),
        standing("team-a"),
      ],
      [],
    );

    expect(resolved.map(({ teamId }) => teamId)).toEqual([
      "team-a",
      "team-b",
      "team-c",
    ]);
    expect(resolved.map(({ rank }) => rank)).toEqual([1, 1, 3]);
  });
});
