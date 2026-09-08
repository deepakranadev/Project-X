import { describe, expect, it } from "vitest";

import type { TiebreakerType } from "../../src/domain/scoring/types";
import {
  scoringConfigToDraft,
  scoringDraftToConfig,
  type ScoringConfigDraft,
} from "../../src/features/scoring/scoringConfigDraft";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";

function standardDraft(): ScoringConfigDraft {
  return scoringConfigToDraft(createBgmiStandardScoringConfig());
}

function replacePlacement(
  draft: ScoringConfigDraft,
  placement: number,
  points: string,
): ScoringConfigDraft {
  return {
    ...draft,
    preset: "CUSTOM",
    placementPoints: draft.placementPoints.map((row) =>
      row.placement === placement ? { ...row, points } : row,
    ),
  };
}

describe("scoring configuration UI mapper", () => {
  it("rejects negative placement points with an actionable message", () => {
    const result = scoringDraftToConfig(
      replacePlacement(standardDraft(), 4, "-1"),
    );

    expect(result).toEqual({
      valid: false,
      issues: [
        expect.objectContaining({
          field: "placementPoints.4",
          message: expect.stringContaining("zero or greater"),
        }),
      ],
    });
  });

  it.each(["", "not-a-number"])(
    "rejects invalid numeric placement value %j",
    (points) => {
      const result = scoringDraftToConfig(
        replacePlacement(standardDraft(), 2, points),
      );

      expect(result).toMatchObject({
        valid: false,
        issues: [expect.objectContaining({ field: "placementPoints.2" })],
      });
    },
  );

  it("rejects negative finish points", () => {
    const result = scoringDraftToConfig({
      ...standardDraft(),
      pointsPerFinish: "-0.5",
    });

    expect(result).toMatchObject({
      valid: false,
      issues: [
        expect.objectContaining({
          field: "pointsPerFinish",
          message: "Points per finish must be a valid number that is zero or greater.",
        }),
      ],
    });
  });

  it("rejects placement points with more than two decimals actionably", () => {
    const result = scoringDraftToConfig(
      replacePlacement(standardDraft(), 1, "10.999"),
    );

    expect(result).toEqual({
      valid: false,
      issues: [
        expect.objectContaining({
          field: "placementPoints.1",
          message: "Placement points for 1st must use at most 2 decimal places.",
        }),
      ],
    });
  });

  it("rejects finish points with more than two decimals actionably", () => {
    const result = scoringDraftToConfig({
      ...standardDraft(),
      pointsPerFinish: "0.001",
    });

    expect(result).toEqual({
      valid: false,
      issues: [
        expect.objectContaining({
          field: "pointsPerFinish",
          message: "Points per finish must use at most 2 decimal places.",
        }),
      ],
    });
  });

  it("rejects duplicate tiebreakers using the domain validator", () => {
    const result = scoringDraftToConfig({
      ...standardDraft(),
      tiebreakers: ["WWCD", "TOTAL_KILLS", "WWCD"],
    });

    expect(result).toMatchObject({
      valid: false,
      issues: [
        expect.objectContaining({
          field: "tiebreakers",
          message: "The same tiebreaker cannot be used twice.",
        }),
      ],
    });
  });

  it("accepts a valid custom scoring configuration", () => {
    const result = scoringDraftToConfig({
      ...replacePlacement(standardDraft(), 1, "12"),
      pointsPerFinish: "1.5",
      tiebreakers: ["TOTAL_KILLS", "WWCD"],
    });

    expect(result).toEqual({
      valid: true,
      config: expect.objectContaining({
        placementPoints: expect.objectContaining({ 1: 12, 16: 0 }),
        pointsPerKill: 1.5,
        tiebreakers: ["TOTAL_KILLS", "WWCD"],
      }),
    });
  });

  it("accepts and preserves two-decimal custom scoring", () => {
    const result = scoringDraftToConfig({
      ...replacePlacement(standardDraft(), 1, "10.75"),
      pointsPerFinish: "0.25",
    });

    expect(result).toMatchObject({
      valid: true,
      config: {
        placementPoints: { 1: 10.75 },
        pointsPerKill: 0.25,
      },
    });
  });

  it("preserves the selected tiebreak order exactly", () => {
    const order: readonly TiebreakerType[] = [
      "LATEST_MATCH_PLACEMENT",
      "TOTAL_KILLS",
      "BEST_PLACEMENT",
      "WWCD",
      "PLACEMENT_POINTS",
    ];
    const result = scoringDraftToConfig({
      ...standardDraft(),
      tiebreakers: order,
    });

    expect(result.valid).toBe(true);
    if (result.valid) expect(result.config.tiebreakers).toEqual(order);
  });

  it("preserves explicit placement values beyond the standard 16 rows", () => {
    const config = createBgmiStandardScoringConfig();
    const draft = scoringConfigToDraft({
      ...config,
      placementPoints: { ...config.placementPoints, 17: 2 },
    });
    const result = scoringDraftToConfig(draft);

    expect(result.valid).toBe(true);
    if (result.valid) expect(result.config.placementPoints[17]).toBe(2);
  });
});
