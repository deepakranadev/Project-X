import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import type { Team, TeamUpdate } from "../../src/domain/teams/types";
import type { Tournament } from "../../src/domain/tournaments/types";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import { GuestDatabase } from "../../src/infrastructure/persistence/indexed-db/guestDatabase";
import {
  IndexedDbTeamRepository,
  TeamRepositoryError,
} from "../../src/infrastructure/persistence/indexed-db/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTournamentRepository";

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

function team(id: string, overrides: Partial<Team> = {}): Team {
  return {
    id,
    tournamentId: "tournament-one",
    name: `Team ${id}`,
    shortName: null,
    slotNumber: null,
    logo: null,
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
    ...overrides,
  };
}

async function setup(
  databaseName: string,
  now: () => string = () => "2026-09-06T11:00:00.000Z",
) {
  const database = new GuestDatabase({
    databaseName,
    indexedDbFactory: new IDBFactory(),
  });
  const tournaments = new IndexedDbTournamentRepository({ database });
  const teams = new IndexedDbTeamRepository({ database, now });
  await tournaments.createTournament(tournament("tournament-one"));
  await tournaments.createTournament(tournament("tournament-two"));
  return { database, tournaments, teams };
}

describe("IndexedDbTeamRepository", () => {
  it("creates, gets, and lists only teams in the requested tournament by slot", async () => {
    const { database, teams } = await setup("team-create-list-test");
    await teams.createTeam(team("two", { name: "GodLike", slotNumber: 2 }));
    await teams.createTeam(team("one", { name: "Team Soul", slotNumber: 1 }));
    await teams.createTeam(
      team("other", {
        tournamentId: "tournament-two",
        name: "Other Team",
        slotNumber: 1,
      }),
    );

    await expect(teams.getTeam("tournament-one", "one")).resolves.toMatchObject({
      name: "Team Soul",
    });
    const roster = await teams.listTeamsByTournament("tournament-one");
    expect(roster.map(({ id }) => id)).toEqual(["one", "two"]);
    await database.close();
  });

  it("bulk creates teams atomically", async () => {
    const { database, teams } = await setup("team-bulk-create-test");
    const batch = [
      team("one", { name: "Team Soul", slotNumber: 1 }),
      team("two", { name: "GodLike", slotNumber: 2 }),
    ];

    await expect(teams.bulkCreateTeams(batch)).resolves.toHaveLength(2);
    await expect(teams.listTeamsByTournament("tournament-one")).resolves.toHaveLength(2);
    await database.close();
  });

  it("rejects an orphan team whose tournament does not exist", async () => {
    const { database, teams } = await setup("team-orphan-test");

    await expect(
      teams.createTeam(
        team("orphan", {
          tournamentId: "missing-tournament",
          name: "Orphan Team",
        }),
      ),
    ).rejects.toMatchObject<Partial<TeamRepositoryError>>({
      code: "TOURNAMENT_NOT_FOUND",
    });
    await database.close();
  });

  it("rejects duplicate names case-insensitively after whitespace normalization", async () => {
    const { database, teams } = await setup("team-duplicate-name-test");
    await teams.createTeam(team("one", { name: "Team Soul" }));

    await expect(
      teams.createTeam(team("two", { name: " TEAM   SOUL " })),
    ).rejects.toMatchObject<Partial<TeamRepositoryError>>({
      code: "DUPLICATE_NAME",
    });
    await expect(teams.listTeamsByTournament("tournament-one")).resolves.toHaveLength(1);
    await database.close();
  });

  it("updates a team slot and fields without allowing identity or creation-time mutation", async () => {
    const { database, teams } = await setup("team-update-test");
    await teams.createTeam(team("one", { name: "Team Soul", slotNumber: 1 }));
    const hostileUpdates = {
      name: "Team SouL Elite",
      shortName: "SOUL",
      slotNumber: 7,
      id: "replaced-id",
      tournamentId: "tournament-two",
      createdAt: "2099-01-01T00:00:00.000Z",
    } as TeamUpdate;

    const updated = await teams.updateTeam(
      "tournament-one",
      "one",
      hostileUpdates,
    );

    expect(updated).toMatchObject({
      id: "one",
      tournamentId: "tournament-one",
      name: "Team SouL Elite",
      shortName: "SOUL",
      slotNumber: 7,
      createdAt: "2026-09-06T10:00:00.000Z",
      updatedAt: "2026-09-06T11:00:00.000Z",
    });
    await database.close();
  });

  it("rejects a duplicate slot and leaves both teams unchanged", async () => {
    const { database, teams } = await setup("team-slot-conflict-test");
    await teams.bulkCreateTeams([
      team("one", { name: "Team Soul", slotNumber: 1 }),
      team("two", { name: "GodLike", slotNumber: 2 }),
    ]);

    await expect(
      teams.updateTeam("tournament-one", "two", { slotNumber: 1 }),
    ).rejects.toMatchObject<Partial<TeamRepositoryError>>({
      code: "SLOT_CONFLICT",
    });
    await expect(teams.getTeam("tournament-one", "two")).resolves.toMatchObject({
      slotNumber: 2,
    });
    await database.close();
  });

  it("prevents update and deletion through the wrong tournament context", async () => {
    const { database, teams } = await setup("team-context-test");
    await teams.createTeam(team("one", { name: "Team Soul" }));

    await expect(
      teams.updateTeam("tournament-two", "one", { name: "Changed" }),
    ).resolves.toBeNull();
    await teams.deleteTeam("tournament-two", "one");
    await expect(teams.getTeam("tournament-one", "one")).resolves.toMatchObject({
      name: "Team Soul",
    });
    await database.close();
  });

  it("deletes a team in the correct tournament context", async () => {
    const { database, teams } = await setup("team-delete-test");
    await teams.createTeam(team("one"));

    await teams.deleteTeam("tournament-one", "one");

    await expect(teams.getTeam("tournament-one", "one")).resolves.toBeNull();
    await database.close();
  });

  it("reorders the complete roster and reassigns sequential slots", async () => {
    const { database, teams } = await setup("team-reorder-test");
    await teams.bulkCreateTeams([
      team("one", { name: "Team Soul", slotNumber: 1 }),
      team("two", { name: "GodLike", slotNumber: 2 }),
      team("three", { name: "8Bit", slotNumber: 3 }),
    ]);

    const reordered = await teams.reorderTeams("tournament-one", [
      "three",
      "one",
      "two",
    ]);

    expect(reordered.map(({ id, slotNumber }) => ({ id, slotNumber }))).toEqual([
      { id: "three", slotNumber: 1 },
      { id: "one", slotNumber: 2 },
      { id: "two", slotNumber: 3 },
    ]);
    await database.close();
  });

  it("persists roster data and logo blobs across a reopened connection", async () => {
    const factory = new IDBFactory();
    const databaseName = "team-reopen-test";
    const firstDatabase = new GuestDatabase({ databaseName, indexedDbFactory: factory });
    const tournaments = new IndexedDbTournamentRepository({ database: firstDatabase });
    const firstTeams = new IndexedDbTeamRepository({ database: firstDatabase });
    await tournaments.createTournament(tournament("tournament-one"));
    await firstTeams.createTeam(
      team("one", {
        name: "Team Soul",
        slotNumber: 1,
        logo: {
          blob: new Blob(["team-logo"], { type: "image/webp" }),
          fileName: "soul.webp",
        },
      }),
    );
    await firstDatabase.close();

    const reopened = new IndexedDbTeamRepository({
      databaseName,
      indexedDbFactory: factory,
    });
    const roster = await reopened.listTeamsByTournament("tournament-one");

    expect(roster[0]).toMatchObject({
      name: "Team Soul",
      slotNumber: 1,
      logo: { fileName: "soul.webp" },
    });
    await expect(roster[0]?.logo?.blob.text()).resolves.toBe("team-logo");
    await reopened.close();
  });
});
