import { describe, expect, it } from "vitest";

import {
  MAX_TEAM_NAME_LENGTH,
  MAX_TEAM_SHORT_NAME_LENGTH,
} from "../../src/domain/teams/validation";
import type { CreateTeamInput } from "../../src/features/teams/types";
import {
  validateTeamLogo,
  validateTeamInput,
} from "../../src/features/teams/validation";

function validInput(overrides: Partial<CreateTeamInput> = {}): CreateTeamInput {
  return {
    tournamentId: "tournament-one",
    name: "Team Soul",
    shortName: null,
    slotNumber: 1,
    logo: null,
    ...overrides,
  };
}

describe("validateTeamInput", () => {
  it("rejects an empty or whitespace-only team name", () => {
    const result = validateTeamInput(validInput({ name: "  \t " }));

    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "name", code: "REQUIRED" }),
    );
  });

  it("rejects an overly long team name", () => {
    const result = validateTeamInput(
      validInput({ name: "T".repeat(MAX_TEAM_NAME_LENGTH + 1) }),
    );

    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "name", code: "TOO_LONG" }),
    );
  });

  it.each(["8Bit", "GodLike Esports", "Team X-Spark", "R3BELS.GG"])(
    "accepts esports-style team name %s",
    (name) => {
      expect(validateTeamInput(validInput({ name })).valid).toBe(true);
    },
  );

  it("requires a positive integer slot when a slot is present", () => {
    const result = validateTeamInput(validInput({ slotNumber: 1.5 }));

    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "slotNumber", code: "INVALID_SLOT" }),
    );
  });

  it("rejects an overly long short name", () => {
    const result = validateTeamInput(
      validInput({ shortName: "S".repeat(MAX_TEAM_SHORT_NAME_LENGTH + 1) }),
    );

    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "shortName", code: "TOO_LONG" }),
    );
  });

  it.each([
    ["image/jpeg", "logo.jpg"],
    ["image/png", "logo.png"],
    ["image/webp", "logo.webp"],
  ])("accepts a %s team logo", (type, fileName) => {
    expect(
      validateTeamLogo({
        blob: new Blob(["logo"], { type }),
        fileName,
      }),
    ).toEqual([]);
  });

  it("rejects an unsupported team logo type", () => {
    expect(
      validateTeamLogo({
        blob: new Blob(["logo"], { type: "image/gif" }),
        fileName: "logo.gif",
      }),
    ).toContainEqual(
      expect.objectContaining({ code: "UNSUPPORTED_IMAGE_TYPE" }),
    );
  });
});
