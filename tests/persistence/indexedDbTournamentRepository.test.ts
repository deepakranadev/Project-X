import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import type { Tournament } from "../../src/domain/tournaments/types";
import type { TournamentUpdate } from "../../src/domain/tournaments/types";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import type { ScoringConfig } from "../../src/domain/scoring/types";
import { IndexedDbTournamentRepository } from "../../src/lib/persistence/indexedDbTournamentRepository";

function tournament(
  id: string,
  overrides: Partial<Tournament> = {},
): Tournament {
  return {
    id,
    name: `Tournament ${id}`,
    game: "BGMI",
    tournamentLogo: null,
    organizerName: null,
    organizerLogo: null,
    scoringConfig: createBgmiStandardScoringConfig(),
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
    ...overrides,
  };
}

describe("IndexedDbTournamentRepository", () => {
  it("creates and retrieves a tournament", async () => {
    const repository = new IndexedDbTournamentRepository({
      databaseName: "repository-create-retrieve-test",
      indexedDbFactory: new IDBFactory(),
    });
    const expected = tournament("one");

    await expect(repository.createTournament(expected)).resolves.toEqual(
      expected,
    );
    await expect(repository.getTournament("one")).resolves.toEqual(expected);
    await repository.close();
  });

  it("updates a tournament without replacing its identity or creation time", async () => {
    const repository = new IndexedDbTournamentRepository({
      databaseName: "repository-update-test",
      indexedDbFactory: new IDBFactory(),
      now: () => "2026-09-06T11:00:00.000Z",
    });
    await repository.createTournament(tournament("one"));

    const updates = {
      name: "Updated Tournament",
      organizerName: "Nova Esports",
      id: "replaced-id",
      createdAt: "2099-01-01T00:00:00.000Z",
    } as TournamentUpdate;
    const updated = await repository.updateTournament("one", updates);

    expect(updated).toMatchObject({
      id: "one",
      name: "Updated Tournament",
      organizerName: "Nova Esports",
      createdAt: "2026-09-06T10:00:00.000Z",
      updatedAt: "2026-09-06T11:00:00.000Z",
    });
    await expect(repository.getTournament("one")).resolves.toEqual(updated);
    await repository.close();
  });

  it("lists tournaments with the most recently updated first", async () => {
    const repository = new IndexedDbTournamentRepository({
      databaseName: "repository-list-test",
      indexedDbFactory: new IDBFactory(),
    });
    await repository.createTournament(
      tournament("older", { updatedAt: "2026-09-06T10:00:00.000Z" }),
    );
    await repository.createTournament(
      tournament("newer", { updatedAt: "2026-09-06T11:00:00.000Z" }),
    );

    const tournaments = await repository.listTournaments();

    expect(tournaments.map(({ id }) => id)).toEqual(["newer", "older"]);
    await repository.close();
  });

  it("deletes a tournament", async () => {
    const repository = new IndexedDbTournamentRepository({
      databaseName: "repository-delete-test",
      indexedDbFactory: new IDBFactory(),
    });
    await repository.createTournament(tournament("one"));

    await repository.deleteTournament("one");

    await expect(repository.getTournament("one")).resolves.toBeNull();
    await repository.close();
  });

  it("persists tournament data and logo blobs across a reopened connection", async () => {
    const factory = new IDBFactory();
    const databaseName = "repository-reopen-test";
    const original = tournament("one", {
      tournamentLogo: {
        blob: new Blob(["persisted-logo"], { type: "image/png" }),
        fileName: "event-logo.png",
      },
    });
    const firstConnection = new IndexedDbTournamentRepository({
      databaseName,
      indexedDbFactory: factory,
    });
    await firstConnection.createTournament(original);
    await firstConnection.close();

    const reopenedConnection = new IndexedDbTournamentRepository({
      databaseName,
      indexedDbFactory: factory,
    });
    const reloaded = await reopenedConnection.getTournament("one");

    expect(reloaded).toMatchObject({
      id: "one",
      name: "Tournament one",
      tournamentLogo: { fileName: "event-logo.png" },
    });
    expect(reloaded?.tournamentLogo?.blob).toBeInstanceOf(Blob);
    await expect(reloaded?.tournamentLogo?.blob.text()).resolves.toBe(
      "persisted-logo",
    );
    await reopenedConnection.close();
  });

  it("saves scoring while preserving identity and refreshing updatedAt", async () => {
    const repository = new IndexedDbTournamentRepository({
      databaseName: "repository-scoring-update-test",
      indexedDbFactory: new IDBFactory(),
      now: () => "2026-09-06T12:00:00.000Z",
    });
    await repository.createTournament(tournament("one"));
    const customConfig: ScoringConfig = {
      placementPoints: { 1: 12, 2: 7, 3: 5 },
      pointsPerKill: 2,
      tiebreakers: ["TOTAL_KILLS", "WWCD"],
    };

    const updated = await repository.updateTournament("one", {
      scoringConfig: customConfig,
    });

    expect(updated).toMatchObject({
      id: "one",
      createdAt: "2026-09-06T10:00:00.000Z",
      updatedAt: "2026-09-06T12:00:00.000Z",
      scoringConfig: customConfig,
    });
    await repository.close();
  });

  it("reloads a custom scoring configuration after IndexedDB reopens", async () => {
    const factory = new IDBFactory();
    const databaseName = "repository-scoring-reopen-test";
    const customConfig: ScoringConfig = {
      placementPoints: { 1: 15, 2: 8, 3: 4, 16: 0 },
      pointsPerKill: 1.5,
      tiebreakers: ["BEST_PLACEMENT", "TOTAL_KILLS", "WWCD"],
    };
    const first = new IndexedDbTournamentRepository({
      databaseName,
      indexedDbFactory: factory,
    });
    await first.createTournament(tournament("one"));
    await first.updateTournament("one", { scoringConfig: customConfig });
    await first.close();

    const reopened = new IndexedDbTournamentRepository({
      databaseName,
      indexedDbFactory: factory,
    });
    await expect(reopened.getTournament("one")).resolves.toMatchObject({
      scoringConfig: customConfig,
    });
    await reopened.close();
  });

  it("rejects malformed scoring configurations without replacing the saved rules", async () => {
    const repository = new IndexedDbTournamentRepository({
      databaseName: "repository-invalid-scoring-test",
      indexedDbFactory: new IDBFactory(),
    });
    const original = tournament("one");
    await repository.createTournament(original);

    await expect(
      repository.updateTournament("one", {
        scoringConfig: {
          placementPoints: { 1: -1 },
          pointsPerKill: 1,
          tiebreakers: [],
        },
      }),
    ).rejects.toThrow();
    await expect(repository.getTournament("one")).resolves.toEqual(original);
    await repository.close();
  });
});
