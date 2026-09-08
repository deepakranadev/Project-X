import { describe, expect, it } from "vitest";

import type { CreateTournamentInput } from "../../src/features/tournaments/types";
import {
  validateTournamentImage,
  validateTournamentInput,
} from "../../src/features/tournaments/validation";
import { MAX_LOGO_FILE_SIZE_BYTES } from "../../src/infrastructure/browser/persistedImage";

function validInput(
  overrides: Partial<CreateTournamentInput> = {},
): CreateTournamentInput {
  return {
    name: "Sunday Showdown",
    game: "BGMI",
    tournamentLogo: null,
    organizerName: "",
    organizerLogo: null,
    ...overrides,
  };
}

describe("validateTournamentInput", () => {
  it("accepts a valid BGMI tournament", () => {
    expect(validateTournamentInput(validInput())).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("rejects a blank tournament name", () => {
    const validation = validateTournamentInput(validInput({ name: "   " }));

    expect(validation.issues).toContainEqual(
      expect.objectContaining({ field: "name", code: "REQUIRED" }),
    );
  });

  it("rejects unsupported game values at runtime", () => {
    const validation = validateTournamentInput(
      validInput({ game: "FREE_FIRE" }),
    );

    expect(validation.issues).toContainEqual(
      expect.objectContaining({ field: "game", code: "UNSUPPORTED_GAME" }),
    );
  });
});

describe("validateTournamentImage", () => {
  it("accepts a supported image", () => {
    const issues = validateTournamentImage(
      {
        blob: new Blob(["image"], { type: "image/png" }),
        fileName: "event-logo.png",
      },
      "tournamentLogo",
    );

    expect(issues).toEqual([]);
  });

  it("rejects unsupported image types with a useful message", () => {
    const issues = validateTournamentImage(
      {
        blob: new Blob(["image"], { type: "image/gif" }),
        fileName: "event-logo.gif",
      },
      "tournamentLogo",
    );

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "UNSUPPORTED_IMAGE_TYPE",
        message: "Use a PNG, JPG, or WEBP image.",
      }),
    );
  });

  it("rejects an extension that does not match the image type", () => {
    const issues = validateTournamentImage(
      {
        blob: new Blob(["image"], { type: "image/png" }),
        fileName: "event-logo.jpg",
      },
      "tournamentLogo",
    );

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "UNSUPPORTED_IMAGE_EXTENSION" }),
    );
  });

  it("rejects images larger than 2 MB", () => {
    const issues = validateTournamentImage(
      {
        blob: new Blob([new Uint8Array(MAX_LOGO_FILE_SIZE_BYTES + 1)], {
          type: "image/webp",
        }),
        fileName: "event-logo.webp",
      },
      "tournamentLogo",
    );

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "IMAGE_TOO_LARGE" }),
    );
  });
});
