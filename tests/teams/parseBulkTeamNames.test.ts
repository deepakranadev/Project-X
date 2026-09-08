import { describe, expect, it } from "vitest";

import { parseBulkTeamNames } from "../../src/features/teams/parseBulkTeamNames";

describe("parseBulkTeamNames", () => {
  it("creates one candidate per line", () => {
    const result = parseBulkTeamNames(
      "Team Soul\nGodLike Esports\nTeam XSpark",
    );

    expect(result.detectedCount).toBe(3);
    expect(result.candidates.map(({ name }) => name)).toEqual([
      "Team Soul",
      "GodLike Esports",
      "Team XSpark",
    ]);
  });

  it("ignores blank lines without changing valid input", () => {
    const result = parseBulkTeamNames("\nTeam Soul\n  \nGodLike\n");

    expect(result.candidates.map(({ name }) => name)).toEqual([
      "Team Soul",
      "GodLike",
    ]);
    expect(result.issues).toEqual([]);
  });

  it("supports Windows line endings", () => {
    const result = parseBulkTeamNames("Team Soul\r\nGodLike\r\n8Bit");

    expect(result.candidates.map(({ name }) => name)).toEqual([
      "Team Soul",
      "GodLike",
      "8Bit",
    ]);
  });

  it("normalizes surrounding and repeated whitespace while preserving casing", () => {
    const result = parseBulkTeamNames("  Team   SoUl  \nGodLike\t Esports ");

    expect(result.candidates.map(({ name }) => name)).toEqual([
      "Team SoUl",
      "GodLike Esports",
    ]);
  });

  it("flags an exact duplicate without silently removing either line", () => {
    const result = parseBulkTeamNames("Team Soul\nTeam Soul");

    expect(result.detectedCount).toBe(2);
    expect(result.candidates).toHaveLength(2);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "DUPLICATE_IN_BATCH",
        lineNumbers: [1, 2],
      }),
    );
  });

  it("flags a case-insensitive duplicate", () => {
    const result = parseBulkTeamNames("Team Soul\nteam soul");

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "DUPLICATE_IN_BATCH" }),
    );
  });

  it("flags a duplicate after whitespace normalization", () => {
    const result = parseBulkTeamNames("Team Soul\nTEAM   SOUL");

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "DUPLICATE_IN_BATCH" }),
    );
  });
});
