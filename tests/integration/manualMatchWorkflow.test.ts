import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import type { StoredMatchResult, TournamentMatch } from "../../src/domain/matches/types";
import type { GuestTeam as Team } from "../../src/features/teams/types";
import type { GuestTournament as Tournament } from "../../src/features/tournaments/types";
import { createBgmiStandardScoringConfig } from "../../src/domain/tournaments/scoringPresets";
import { finalizeGuestMatch } from "../../src/features/matches/finalizeGuestMatch";
import { GuestDatabase } from "../../src/infrastructure/persistence/indexed-db/guestDatabase";
import { IndexedDbMatchLifecycleRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchLifecycleRepository";
import { IndexedDbMatchRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchRepository";
import { IndexedDbMatchResultRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbMatchResultRepository";
import { IndexedDbTeamRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTeamRepository";
import { IndexedDbTournamentRepository } from "../../src/infrastructure/persistence/indexed-db/indexedDbTournamentRepository";

const tournament: Tournament = {
  id: "tournament-one",
  name: "Manual Masters",
  game: "BGMI",
  tournamentLogo: null,
  organizerName: null,
  organizerLogo: null,
  scoringConfig: createBgmiStandardScoringConfig(),
  createdAt: "2026-09-06T10:00:00.000Z",
  updatedAt: "2026-09-06T10:00:00.000Z",
};

function team(id: string): Team {
  return {
    id,
    tournamentId: tournament.id,
    name: `Team ${id}`,
    shortName: null,
    slotNumber: id === "one" ? 1 : 2,
    logo: null,
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

const match: TournamentMatch = {
  id: "match-one",
  tournamentId: tournament.id,
  matchNumber: 1,
  status: "DRAFT",
  createdAt: "2026-09-06T10:00:00.000Z",
  updatedAt: "2026-09-06T10:00:00.000Z",
};

function result(
  teamId: string,
  placement: number | null,
  kills: number | null,
  participationStatus: "PLAYED" | "DNP" = "PLAYED",
): StoredMatchResult {
  return {
    id: `result-${teamId}`,
    tournamentId: tournament.id,
    matchId: match.id,
    teamId,
    placement,
    kills,
    participationStatus,
    source: "MANUAL",
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
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
  const lifecycle = new IndexedDbMatchLifecycleRepository({ database });
  await tournaments.createTournament(tournament);
  await teams.bulkCreateTeams([team("one"), team("two")]);
  await matches.createMatch(match);
  return { database, lifecycle, matches, results };
}

describe("manual match workflow", () => {
  it("persists a valid result set and finalizes the match", async () => {
    const { database, lifecycle, results } = await setup("workflow-finalize-test");
    const finalized = await finalizeGuestMatch({
      tournamentId: tournament.id,
      matchId: match.id,
      name: "Erangel",
      results: [result("one", 1, 8), result("two", 2, 0)],
      lifecycleRepository: lifecycle,
    });

    expect(finalized).toMatchObject({
      ok: true,
      match: { status: "FINALIZED", name: "Erangel" },
    });
    await expect(results.getResultsByMatch(tournament.id, match.id)).resolves.toMatchObject([
      { teamId: "one", placement: 1, kills: 8 },
      { teamId: "two", placement: 2, kills: 0 },
    ]);
    await database.close();
  });

  it("does not allow an incomplete or invalid draft to become finalized", async () => {
    const { database, lifecycle, matches } = await setup("workflow-invalid-test");
    const invalid = await finalizeGuestMatch({
      tournamentId: tournament.id,
      matchId: match.id,
      results: [result("one", 1, -2), result("two", null, null)],
      lifecycleRepository: lifecycle,
    });

    expect(invalid).toMatchObject({ ok: false });
    if (!invalid.ok) {
      expect(invalid.issues.map((issue) => issue.code)).toEqual(
        expect.arrayContaining(["INVALID_KILLS", "INVALID_PLACEMENT"]),
      );
    }
    await expect(matches.getMatch(tournament.id, match.id)).resolves.toMatchObject({ status: "DRAFT" });
    await database.close();
  });

  it("reopens a finalized match for edits and persists placement, finishes, and DNP changes", async () => {
    const { database, lifecycle, matches, results } = await setup("workflow-edit-test");
    const original = [result("one", 1, 8), result("two", 2, 4)];
    await finalizeGuestMatch({
      tournamentId: tournament.id,
      matchId: match.id,
      results: original,
      lifecycleRepository: lifecycle,
    });

    await lifecycle.reopenMatch(tournament.id, match.id);
    await lifecycle.saveMatchDraft({
      tournamentId: tournament.id,
      matchId: match.id,
      results: [
        { ...original[0]!, placement: 2, kills: 10 },
        {
          ...original[1]!,
          placement: null,
          kills: null,
          participationStatus: "DNP",
        },
      ],
    });

    await expect(results.getResultsByMatch(tournament.id, match.id)).resolves.toMatchObject([
      { teamId: "one", placement: 2, kills: 10, participationStatus: "PLAYED" },
      { teamId: "two", placement: null, kills: null, participationStatus: "DNP" },
    ]);
    await expect(matches.getMatch(tournament.id, match.id)).resolves.toMatchObject({ status: "DRAFT" });
    await database.close();
  });
});
