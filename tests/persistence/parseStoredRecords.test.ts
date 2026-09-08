import { describe, expect, it } from "vitest";

import { InvalidScoringConfigError } from "../../src/domain/scoring/validateScoringConfig";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import {
  parseMatchRecord,
  parseMatchResultRecord,
  parseTeamRecord,
  parseTournamentRecord,
  tournamentRecordToDomain,
} from "../../src/lib/persistence/parseStoredRecords";
import type { PersistenceError } from "../../src/lib/persistence/persistenceErrors";

const timestamp = "2026-09-08T10:00:00.000Z";

function tournamentRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "tournament-one",
    name: "Runtime Masters",
    game: "BGMI",
    tournamentLogo: null,
    organizerName: null,
    organizerLogo: null,
    scoringConfig: createBgmiStandardScoringConfig(),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function teamRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "team-one",
    tournamentId: "tournament-one",
    name: "Team One",
    shortName: null,
    slotNumber: 1,
    logo: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function matchRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-one",
    tournamentId: "tournament-one",
    matchNumber: 1,
    status: "DRAFT",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function resultRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "result-one",
    tournamentId: "tournament-one",
    matchId: "match-one",
    teamId: "team-one",
    placement: 1,
    kills: 0,
    participationStatus: "PLAYED",
    source: "MANUAL",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function expectCorrupt(
  parse: () => unknown,
  entityType: PersistenceError["entityType"],
  recordId?: string,
): void {
  try {
    parse();
    throw new Error("Expected a corrupt stored record error.");
  } catch (error) {
    expect(error).toMatchObject<Partial<PersistenceError>>({
      code: "CORRUPT_STORED_RECORD",
      entityType,
      ...(recordId ? { recordId } : {}),
    });
  }
}

describe("stored IndexedDB record parsers", () => {
  it("parses and maps a valid tournament record", () => {
    const record = parseTournamentRecord(tournamentRecord());
    expect(tournamentRecordToDomain(record)).toEqual(tournamentRecord());
  });

  it("rejects a non-object tournament value without inventing an identity", () => {
    expectCorrupt(() => parseTournamentRecord("not-a-record"), "TOURNAMENT");
  });

  it("rejects a tournament with an empty id and reports no usable id", () => {
    expectCorrupt(
      () => parseTournamentRecord(tournamentRecord({ id: "  " })),
      "TOURNAMENT",
    );
  });

  it("rejects a tournament with a non-canonical timestamp", () => {
    expectCorrupt(
      () =>
        parseTournamentRecord(
          tournamentRecord({ createdAt: "September 8, 2026" }),
        ),
      "TOURNAMENT",
      "tournament-one",
    );
  });

  it("rejects malformed tournament image objects", () => {
    expectCorrupt(
      () =>
        parseTournamentRecord(
          tournamentRecord({
            tournamentLogo: { blob: "not-a-blob", fileName: "logo.png" },
          }),
        ),
      "TOURNAMENT",
      "tournament-one",
    );
  });

  it("leaves scoring semantics to the centralized scoring validator", () => {
    const record = parseTournamentRecord(
      tournamentRecord({
        scoringConfig: {
          placementPoints: { 1: 10.999 },
          pointsPerKill: 0.001,
          tiebreakers: ["TOTAL_POINTS"],
        },
      }),
    );
    expect(() => tournamentRecordToDomain(record)).toThrow(
      InvalidScoringConfigError,
    );
  });

  it("parses and maps a valid team record", () => {
    const record = parseTeamRecord(teamRecord());
    expect(record).toEqual(teamRecord());
  });

  it("accepts a valid persisted team image", () => {
    const logo = {
      blob: new Blob(["logo"], { type: "image/png" }),
      fileName: "team.png",
    };
    expect(parseTeamRecord(teamRecord({ logo })).logo).toEqual(logo);
  });

  it("rejects a team with a missing tournament id", () => {
    expectCorrupt(
      () => parseTeamRecord(teamRecord({ tournamentId: undefined })),
      "TEAM",
      "team-one",
    );
  });

  it("rejects a team with an invalid slot number", () => {
    expectCorrupt(
      () => parseTeamRecord(teamRecord({ slotNumber: 1.5 })),
      "TEAM",
      "team-one",
    );
  });

  it("rejects a team image with unsupported MIME metadata", () => {
    expectCorrupt(
      () =>
        parseTeamRecord(
          teamRecord({
            logo: {
              blob: new Blob(["logo"], { type: "text/plain" }),
              fileName: "team.txt",
            },
          }),
        ),
      "TEAM",
      "team-one",
    );
  });

  it("parses and maps a valid Draft match without normalizing it", () => {
    const stored = matchRecord({ name: "  Erangel  " });
    const record = parseMatchRecord(stored);
    expect(record).toEqual(stored);
  });

  it("parses a valid Finalized match", () => {
    expect(parseMatchRecord(matchRecord({ status: "FINALIZED" })).status).toBe(
      "FINALIZED",
    );
  });

  it("rejects an unsupported match status", () => {
    expectCorrupt(
      () => parseMatchRecord(matchRecord({ status: "LOCKED" })),
      "MATCH",
      "match-one",
    );
  });

  it("rejects an invalid match number", () => {
    expectCorrupt(
      () => parseMatchRecord(matchRecord({ matchNumber: 0 })),
      "MATCH",
      "match-one",
    );
  });

  it("parses and maps a played result with zero finishes", () => {
    const record = parseMatchResultRecord(resultRecord());
    expect(record).toEqual(resultRecord());
  });

  it("parses a valid DNP result", () => {
    expect(
      parseMatchResultRecord(
        resultRecord({
          placement: null,
          kills: null,
          participationStatus: "DNP",
        }),
      ),
    ).toMatchObject({ participationStatus: "DNP", placement: null, kills: null });
  });

  it("accepts null competitive fields in a played Draft result", () => {
    expect(
      parseMatchResultRecord(resultRecord({ placement: null, kills: null })),
    ).toMatchObject({ participationStatus: "PLAYED", placement: null, kills: null });
  });

  it("preserves finite but competitively invalid Draft values for domain validation", () => {
    expect(
      parseMatchResultRecord(resultRecord({ placement: 1.5, kills: -1 })),
    ).toMatchObject({ placement: 1.5, kills: -1 });
  });

  it("rejects an unsupported participation status", () => {
    expectCorrupt(
      () =>
        parseMatchResultRecord(
          resultRecord({ participationStatus: "UNKNOWN" }),
        ),
      "MATCH_RESULT",
      "result-one",
    );
  });

  it.each([
    ["placement", "first"],
    ["placement", Number.POSITIVE_INFINITY],
    ["kills", Number.NaN],
    ["kills", "many"],
  ])("rejects invalid result numeric field %s=%s", (field, invalid) => {
    expectCorrupt(
      () => parseMatchResultRecord(resultRecord({ [field]: invalid })),
      "MATCH_RESULT",
      "result-one",
    );
  });

  it("rejects competitive values on a DNP row", () => {
    expectCorrupt(
      () =>
        parseMatchResultRecord(
          resultRecord({
            placement: 1,
            kills: null,
            participationStatus: "DNP",
          }),
        ),
      "MATCH_RESULT",
      "result-one",
    );
  });

  it("rejects a non-manual stored result source", () => {
    expectCorrupt(
      () => parseMatchResultRecord(resultRecord({ source: "AI" })),
      "MATCH_RESULT",
      "result-one",
    );
  });
});
