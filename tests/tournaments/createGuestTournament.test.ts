import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import { createGuestTournament } from "../../src/lib/persistence/createGuestTournament";
import { IndexedDbTournamentRepository } from "../../src/lib/persistence/indexedDbTournamentRepository";

describe("createGuestTournament", () => {
  it("creates and persists a normalized tournament with a stable generated id", async () => {
    const repository = new IndexedDbTournamentRepository({
      databaseName: "create-guest-tournament-test",
      indexedDbFactory: new IDBFactory(),
    });

    const created = await createGuestTournament(
      {
        name: "  Sunday Showdown  ",
        game: "BGMI",
        tournamentLogo: null,
        organizerName: "  Nova Esports  ",
        organizerLogo: null,
      },
      repository,
      {
        createId: () => "tournament-stable-id",
        now: () => "2026-09-06T10:00:00.000Z",
      },
    );

    expect(created).toEqual({
      id: "tournament-stable-id",
      name: "Sunday Showdown",
      game: "BGMI",
      tournamentLogo: null,
      organizerName: "Nova Esports",
      organizerLogo: null,
      scoringConfig: {
        placementPoints: {
          1: 10,
          2: 6,
          3: 5,
          4: 4,
          5: 3,
          6: 2,
          7: 1,
          8: 1,
          9: 0,
          10: 0,
          11: 0,
          12: 0,
          13: 0,
          14: 0,
          15: 0,
          16: 0,
        },
        pointsPerKill: 1,
        tiebreakers: [
          "WWCD",
          "PLACEMENT_POINTS",
          "TOTAL_KILLS",
          "LATEST_MATCH_PLACEMENT",
        ],
      },
      createdAt: "2026-09-06T10:00:00.000Z",
      updatedAt: "2026-09-06T10:00:00.000Z",
    });
    await expect(
      repository.getTournament("tournament-stable-id"),
    ).resolves.toEqual(created);
    await repository.close();
  });
});
