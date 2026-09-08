import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import type { GuestTournament as Tournament } from "../../src/features/tournaments/types";
import {
  createGuestTeamsFromText,
  GuestTeamCreationError,
} from "../../src/features/teams/createGuestTeams";
import { GuestDatabase } from "../../src/infrastructure/persistence/indexed-db/guestDatabase";
import { IndexedDbTeamRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTournamentRepository";

function tournament(): Tournament {
  return {
    id: "tournament-one",
    name: "Mobile Masters",
    game: "BGMI",
    tournamentLogo: null,
    organizerName: null,
    organizerLogo: null,
    scoringConfig: createBgmiStandardScoringConfig(),
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

async function setup() {
  const database = new GuestDatabase({
    databaseName: "create-guest-teams-test",
    indexedDbFactory: new IDBFactory(),
  });
  const tournaments = new IndexedDbTournamentRepository({ database });
  const teams = new IndexedDbTeamRepository({ database });
  await tournaments.createTournament(tournament());
  return { database, teams };
}

describe("createGuestTeamsFromText", () => {
  it("bulk creates normalized teams with sequential slots", async () => {
    const { database, teams } = await setup();
    const ids = ["team-one", "team-two", "team-three"];

    const created = await createGuestTeamsFromText(
      "tournament-one",
      " Team   Soul \nGodLike\n8Bit",
      teams,
      {
        createId: () => ids.shift() ?? "unexpected-id",
        now: () => "2026-09-06T11:00:00.000Z",
      },
    );

    expect(created.map(({ id, name, slotNumber }) => ({
      id,
      name,
      slotNumber,
    }))).toEqual([
      { id: "team-one", name: "Team Soul", slotNumber: 1 },
      { id: "team-two", name: "GodLike", slotNumber: 2 },
      { id: "team-three", name: "8Bit", slotNumber: 3 },
    ]);
    await database.close();
  });

  it("rejects a duplicate against the existing roster without discarding input", async () => {
    const { database, teams } = await setup();
    await createGuestTeamsFromText("tournament-one", "Team Soul", teams, {
      createId: () => "team-one",
    });

    await expect(
      createGuestTeamsFromText(
        "tournament-one",
        "GodLike\nTEAM   SOUL",
        teams,
      ),
    ).rejects.toMatchObject<Partial<GuestTeamCreationError>>({
      issues: [
        expect.objectContaining({ code: "DUPLICATE_EXISTING" }),
      ],
    });
    await expect(teams.listTeamsByTournament("tournament-one")).resolves.toHaveLength(1);
    await database.close();
  });
});
