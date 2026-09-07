import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import type { TournamentMatch } from "../../src/domain/matches/types";
import type { Tournament } from "../../src/domain/tournaments/types";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import { GuestDatabase } from "../../src/lib/persistence/guestDatabase";
import {
  IndexedDbMatchRepository,
  MatchRepositoryError,
} from "../../src/lib/persistence/indexedDbMatchRepository";
import { IndexedDbTournamentRepository } from "../../src/lib/persistence/indexedDbTournamentRepository";

function tournament(id: string): Tournament {
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
  };
}

function match(id: string, overrides: Partial<TournamentMatch> = {}): TournamentMatch {
  return {
    id,
    tournamentId: "tournament-one",
    matchNumber: 1,
    status: "DRAFT",
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
  const matches = new IndexedDbMatchRepository({
    database,
    now: () => "2026-09-06T12:00:00.000Z",
  });
  await tournaments.createTournament(tournament("tournament-one"));
  await tournaments.createTournament(tournament("tournament-two"));
  return { database, tournaments, matches };
}

describe("IndexedDbMatchRepository", () => {
  it("creates and lists numbered Draft matches in tournament context", async () => {
    const { database, matches } = await setup("match-create-list-test");
    await matches.createMatch(match("match-1"));
    await matches.createMatch(match("match-2", { matchNumber: 2 }));

    await expect(matches.listMatchesByTournament("tournament-one")).resolves.toMatchObject([
      { id: "match-1", matchNumber: 1 },
      { id: "match-2", matchNumber: 2 },
    ]);
    await expect(matches.listMatchesByTournament("tournament-two")).resolves.toEqual([]);
    await database.close();
  });

  it("rejects duplicate match numbers within a tournament but permits them across tournaments", async () => {
    const { database, matches } = await setup("match-duplicate-number-test");
    await matches.createMatch(match("one"));

    await expect(matches.createMatch(match("duplicate"))).rejects.toMatchObject<Partial<MatchRepositoryError>>({
      code: "DUPLICATE_MATCH_NUMBER",
    });
    await expect(
      matches.createMatch(match("other", { tournamentId: "tournament-two" })),
    ).resolves.toMatchObject({ matchNumber: 1 });
    await database.close();
  });

  it("updates details without permitting a generic status transition", async () => {
    const { database, matches } = await setup("match-update-test");
    await matches.createMatch(match("one"));
    const hostile = {
      name: " Erangel opener ",
      status: "FINALIZED",
      id: "replaced",
      tournamentId: "tournament-two",
      createdAt: "2099-01-01T00:00:00.000Z",
    } as const;

    const updated = await matches.updateMatch("tournament-one", "one", hostile);

    expect(updated).toMatchObject({
      id: "one",
      tournamentId: "tournament-one",
      name: "Erangel opener",
      status: "DRAFT",
      createdAt: "2026-09-06T10:00:00.000Z",
      updatedAt: "2026-09-06T12:00:00.000Z",
    });
    await database.close();
  });

  it("rejects creating a match directly as finalized", async () => {
    const { database, matches } = await setup("match-finalized-create-test");

    await expect(
      matches.createMatch(match("one", { status: "FINALIZED" })),
    ).rejects.toMatchObject<Partial<MatchRepositoryError>>({
      code: "INVALID_MATCH",
    });
    await expect(matches.getMatch("tournament-one", "one")).resolves.toBeNull();
    await database.close();
  });

  it("prevents cross-tournament update and deletion", async () => {
    const { database, matches } = await setup("match-context-test");
    await matches.createMatch(match("one"));

    await expect(
      matches.updateMatch("tournament-two", "one", { name: "Wrong" }),
    ).resolves.toBeNull();
    await matches.deleteMatch("tournament-two", "one");
    await expect(matches.getMatch("tournament-one", "one")).resolves.toMatchObject({ id: "one" });
    await database.close();
  });

  it("deletes a match in the correct tournament", async () => {
    const { database, matches } = await setup("match-delete-test");
    await matches.createMatch(match("one"));

    await matches.deleteMatch("tournament-one", "one");

    await expect(matches.getMatch("tournament-one", "one")).resolves.toBeNull();
    await database.close();
  });
});
