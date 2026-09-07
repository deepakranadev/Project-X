import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import type {
  StoredMatchResult,
  TournamentMatch,
} from "../../src/domain/matches/types";
import type { Team } from "../../src/domain/teams/types";
import type { Tournament } from "../../src/domain/tournaments/types";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import {
  GuestDatabase,
  MATCH_RESULT_STORE,
} from "../../src/lib/persistence/guestDatabase";
import {
  IndexedDbMatchLifecycleRepository,
  MatchLifecycleRepositoryError,
} from "../../src/lib/persistence/indexedDbMatchLifecycleRepository";
import { IndexedDbMatchRepository } from "../../src/lib/persistence/indexedDbMatchRepository";
import { IndexedDbMatchResultRepository } from "../../src/lib/persistence/indexedDbMatchResultRepository";
import { IndexedDbTeamRepository } from "../../src/lib/persistence/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/lib/persistence/indexedDbTournamentRepository";
import { requestToPromise } from "../../src/lib/persistence/indexedDbUtils";

const tournament: Tournament = {
  id: "tournament-one",
  name: "Atomic Masters",
  game: "BGMI",
  tournamentLogo: null,
  organizerName: null,
  organizerLogo: null,
  scoringConfig: createBgmiStandardScoringConfig(),
  createdAt: "2026-09-06T10:00:00.000Z",
  updatedAt: "2026-09-06T10:00:00.000Z",
};

function team(id: string, slotNumber: number): Team {
  return {
    id,
    tournamentId: tournament.id,
    name: `Team ${id}`,
    shortName: null,
    slotNumber,
    logo: null,
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

function match(
  id: string,
  matchNumber: number,
  status: TournamentMatch["status"] = "DRAFT",
): TournamentMatch {
  return {
    id,
    tournamentId: tournament.id,
    matchNumber,
    status,
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

function result(
  matchId: string,
  teamId: string,
  placement: number | null,
  kills: number | null,
  overrides: Partial<StoredMatchResult> = {},
): StoredMatchResult {
  return {
    id: `${matchId}-${teamId}`,
    tournamentId: tournament.id,
    matchId,
    teamId,
    placement,
    kills,
    participationStatus: "PLAYED",
    source: "MANUAL",
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
    ...overrides,
  };
}

async function setup(databaseName: string) {
  const database = new GuestDatabase({
    databaseName,
    indexedDbFactory: new IDBFactory(),
  });
  const tournaments = new IndexedDbTournamentRepository({ database });
  const teams = new IndexedDbTeamRepository({ database });
  const matches = new IndexedDbMatchRepository({ database });
  const results = new IndexedDbMatchResultRepository({ database });
  const lifecycle = new IndexedDbMatchLifecycleRepository({
    database,
    now: () => "2026-09-06T12:00:00.000Z",
  });
  await tournaments.createTournament(tournament);
  await teams.bulkCreateTeams([team("one", 1), team("two", 2)]);
  return { database, lifecycle, matches, results };
}

describe("IndexedDbMatchLifecycleRepository", () => {
  it("atomically creates a Draft with one initial raw row per team", async () => {
    const { database, lifecycle, matches, results } = await setup(
      "lifecycle-create-test",
    );
    const created = await lifecycle.createMatchWithInitialResults(
      match("match-one", 1),
      [
        result("match-one", "one", null, null),
        result("match-one", "two", null, null),
      ],
    );

    expect(created.match.status).toBe("DRAFT");
    expect(created.results).toHaveLength(2);
    await expect(matches.getMatch(tournament.id, "match-one")).resolves.toMatchObject({
      status: "DRAFT",
    });
    await expect(
      results.getResultsByMatch(tournament.id, "match-one"),
    ).resolves.toHaveLength(2);
    await database.close();
  });

  it("rolls back the match when initial result persistence fails", async () => {
    const { database, lifecycle, matches, results } = await setup(
      "lifecycle-create-rollback-test",
    );
    await matches.createMatch(match("existing-match", 1));
    await results.saveDraftResults(tournament.id, "existing-match", [
      result("existing-match", "one", null, null, {
        id: "occupied-result-id",
      }),
    ]);

    await expect(
      lifecycle.createMatchWithInitialResults(match("new-match", 2), [
        result("new-match", "one", null, null),
        result("new-match", "two", null, null, {
          id: "occupied-result-id",
        }),
      ]),
    ).rejects.toMatchObject<Partial<MatchLifecycleRepositoryError>>({
      code: "INVALID_RESULT",
    });

    await expect(matches.getMatch(tournament.id, "new-match")).resolves.toBeNull();
    const connection = await database.getConnection();
    const transaction = connection.transaction(MATCH_RESULT_STORE, "readonly");
    await expect(
      requestToPromise(transaction.objectStore(MATCH_RESULT_STORE).getAll()),
    ).resolves.toMatchObject([
      { id: "occupied-result-id", matchId: "existing-match" },
    ]);
    await database.close();
  });

  it("saves a valid Draft snapshot while preserving row identity and createdAt", async () => {
    const { database, lifecycle, matches, results } = await setup(
      "lifecycle-draft-save-test",
    );
    await matches.createMatch(match("match-one", 1));
    const original = await lifecycle.saveMatchDraft({
      tournamentId: tournament.id,
      matchId: "match-one",
      name: " Erangel opener ",
      results: [
        result("match-one", "one", 1, null),
        result("match-one", "two", null, null),
      ],
    });
    const edited = await lifecycle.saveMatchDraft({
      tournamentId: tournament.id,
      matchId: "match-one",
      name: "Erangel opener",
      results: [
        result("match-one", "one", 1, 8, {
          id: "hostile-replacement-id",
          createdAt: "2099-01-01T00:00:00.000Z",
        }),
        result("match-one", "two", 2, 0),
      ],
    });

    expect(edited.match).toMatchObject({
      name: "Erangel opener",
      status: "DRAFT",
    });
    expect(edited.results[0]).toMatchObject({
      id: original.results[0]?.id,
      createdAt: original.results[0]?.createdAt,
      placement: 1,
      kills: 8,
    });
    await expect(
      results.getResultsByMatch(tournament.id, "match-one"),
    ).resolves.toMatchObject(edited.results);
    await database.close();
  });

  it("validates then persists authoritative results and FINALIZED status together", async () => {
    const { database, lifecycle, matches, results } = await setup(
      "lifecycle-finalize-test",
    );
    await matches.createMatch(match("match-one", 1));
    const finalized = await lifecycle.finalizeMatch({
      tournamentId: tournament.id,
      matchId: "match-one",
      name: "Miramar",
      results: [
        result("match-one", "one", 1, 7),
        result("match-one", "two", null, null, {
          participationStatus: "DNP",
        }),
      ],
    });

    expect(finalized).toMatchObject({
      ok: true,
      match: { name: "Miramar", status: "FINALIZED" },
    });
    await expect(matches.getMatch(tournament.id, "match-one")).resolves.toMatchObject({
      status: "FINALIZED",
    });
    await expect(
      results.getResultsByMatch(tournament.id, "match-one"),
    ).resolves.toMatchObject([
      { teamId: "one", placement: 1, kills: 7 },
      {
        teamId: "two",
        placement: null,
        kills: null,
        participationStatus: "DNP",
      },
    ]);
    await database.close();
  });

  it("performs zero finalization writes when domain validation fails", async () => {
    const { database, lifecycle, matches, results } = await setup(
      "lifecycle-validation-rollback-test",
    );
    await matches.createMatch(match("match-one", 1));
    await lifecycle.saveMatchDraft({
      tournamentId: tournament.id,
      matchId: "match-one",
      results: [
        result("match-one", "one", 1, null),
        result("match-one", "two", null, null),
      ],
    });
    const beforeMatch = await matches.getMatch(tournament.id, "match-one");
    const beforeResults = await results.getResultsByMatch(
      tournament.id,
      "match-one",
    );

    const invalid = await lifecycle.finalizeMatch({
      tournamentId: tournament.id,
      matchId: "match-one",
      results: [
        result("match-one", "one", 1, -2),
        result("match-one", "two", null, null),
      ],
    });

    expect(invalid).toMatchObject({ ok: false });
    await expect(matches.getMatch(tournament.id, "match-one")).resolves.toEqual(
      beforeMatch,
    );
    await expect(
      results.getResultsByMatch(tournament.id, "match-one"),
    ).resolves.toEqual(beforeResults);
    await database.close();
  });

  it("rolls back earlier result writes when a later finalization write fails", async () => {
    const { database, lifecycle, matches, results } = await setup(
      "lifecycle-finalize-rollback-test",
    );
    await matches.createMatch(match("match-one", 1));
    await matches.createMatch(match("other-match", 2));
    await lifecycle.saveMatchDraft({
      tournamentId: tournament.id,
      matchId: "match-one",
      results: [result("match-one", "one", 1, null)],
    });
    await results.saveDraftResults(tournament.id, "other-match", [
      result("other-match", "one", 1, 1, { id: "occupied-result-id" }),
    ]);
    const beforeMatch = await matches.getMatch(tournament.id, "match-one");
    const beforeResults = await results.getResultsByMatch(
      tournament.id,
      "match-one",
    );

    await expect(
      lifecycle.finalizeMatch({
        tournamentId: tournament.id,
        matchId: "match-one",
        results: [
          result("match-one", "one", 1, 9),
          result("match-one", "two", 2, 0, { id: "occupied-result-id" }),
        ],
      }),
    ).rejects.toMatchObject<Partial<MatchLifecycleRepositoryError>>({
      code: "INVALID_RESULT",
    });

    await expect(matches.getMatch(tournament.id, "match-one")).resolves.toEqual(
      beforeMatch,
    );
    await expect(
      results.getResultsByMatch(tournament.id, "match-one"),
    ).resolves.toEqual(beforeResults);
    await expect(
      results.getResultsByMatch(tournament.id, "other-match"),
    ).resolves.toMatchObject([{ id: "occupied-result-id" }]);
    await database.close();
  });

  it("reopens explicitly and rejects Draft writes or duplicate finalize after finalization", async () => {
    const { database, lifecycle, matches, results } = await setup(
      "lifecycle-transition-test",
    );
    await matches.createMatch(match("match-one", 1));
    const validResults = [
      result("match-one", "one", 1, 4),
      result("match-one", "two", 2, 0),
    ];
    await lifecycle.finalizeMatch({
      tournamentId: tournament.id,
      matchId: "match-one",
      results: validResults,
    });

    await expect(
      lifecycle.saveMatchDraft({
        tournamentId: tournament.id,
        matchId: "match-one",
        results: validResults,
      }),
    ).rejects.toMatchObject<Partial<MatchLifecycleRepositoryError>>({
      code: "MATCH_NOT_DRAFT",
    });
    await expect(
      lifecycle.finalizeMatch({
        tournamentId: tournament.id,
        matchId: "match-one",
        results: validResults,
      }),
    ).rejects.toMatchObject<Partial<MatchLifecycleRepositoryError>>({
      code: "MATCH_NOT_DRAFT",
    });
    await expect(
      results.saveDraftResults(tournament.id, "match-one", validResults),
    ).rejects.toMatchObject({ code: "MATCH_NOT_DRAFT" });
    await expect(matches.getMatch(tournament.id, "match-one")).resolves.toMatchObject({
      status: "FINALIZED",
    });

    const reopened = await lifecycle.reopenMatch(tournament.id, "match-one");
    expect(reopened.status).toBe("DRAFT");
    const reFinalized = await lifecycle.finalizeMatch({
      tournamentId: tournament.id,
      matchId: "match-one",
      results: validResults,
    });
    expect(reFinalized).toMatchObject({ ok: true, match: { status: "FINALIZED" } });
    await database.close();
  });
});
