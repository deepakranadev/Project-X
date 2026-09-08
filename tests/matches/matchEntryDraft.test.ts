import { describe, expect, it, vi } from "vitest";

import type { StoredMatchResult } from "../../src/domain/matches/types";
import type { Team } from "../../src/domain/teams/types";
import {
  buildMatchDraftRows,
  toggleMatchResultDnp,
  updateMatchResultNumber,
} from "../../src/features/matches/matchEntryDraft";
import { loadMatchEntryDraft } from "../../src/features/matches/loadMatchEntryDraft";
import type { MatchResultRepository } from "../../src/features/matches/matchResultRepository";

const timestamp = "2026-09-08T10:00:00.000Z";

function team(id: string, name = `Team ${id}`): Team {
  return {
    id,
    tournamentId: "tournament-one",
    name,
    shortName: null,
    slotNumber: id === "one" ? 1 : 2,
    logo: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function result(teamId: string): StoredMatchResult {
  return {
    id: `result-${teamId}`,
    tournamentId: "tournament-one",
    matchId: "match-one",
    teamId,
    placement: null,
    kills: null,
    participationStatus: "PLAYED",
    source: "MANUAL",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function repository(stored: readonly StoredMatchResult[]) {
  const bulkSaveResults = vi.fn(async (
    _tournamentId: string,
    _matchId: string,
    results: readonly StoredMatchResult[],
  ) => results);
  const value: MatchResultRepository = {
    getResultsByMatch: vi.fn(async () => stored),
    saveDraftResults: bulkSaveResults,
    saveResult: vi.fn(async (_tournamentId, _matchId, saved) => saved),
    bulkSaveResults,
    deleteResultsByMatch: vi.fn(async () => undefined),
  };
  return { bulkSaveResults, value };
}

describe("MatchEntry draft orchestration", () => {
  it("preserves stored row identity and initializes only newly observed roster teams", async () => {
    const stored = result("one");
    const currentRoster = [team("one", "Renamed Team One"), team("two")];
    const records = repository([stored]);

    const loaded = await loadMatchEntryDraft({
      tournamentId: "tournament-one",
      matchId: "match-one",
      teams: currentRoster,
      repository: records.value,
      createId: () => "result-two",
      now: () => timestamp,
    });

    expect(loaded.map(({ id, teamId }) => ({ id, teamId }))).toEqual([
      { id: "result-one", teamId: "one" },
      { id: "result-two", teamId: "two" },
    ]);
    expect(records.bulkSaveResults).toHaveBeenCalledOnce();
    expect(records.bulkSaveResults.mock.calls[0]?.[2]).toMatchObject([
      { id: "result-two", teamId: "two" },
    ]);
  });

  it("reorders rows to the current roster while retaining unknown saved references", () => {
    const one = result("one");
    const orphan = result("orphan");
    const draft = buildMatchDraftRows({
      stored: [orphan, one],
      teams: [team("one")],
      tournamentId: "tournament-one",
      matchId: "match-one",
      createId: () => "unused",
      now: () => timestamp,
    });

    expect(draft.created).toEqual([]);
    expect(draft.results).toEqual([one, orphan]);
  });

  it("updates only the edited row and preserves DNP invariants", () => {
    const one = result("one");
    const two = result("two");
    const edited = updateMatchResultNumber([one, two], one.id, "kills", "7");

    expect(edited[0]).toMatchObject({ kills: 7 });
    expect(edited[1]).toBe(two);
    expect(toggleMatchResultDnp(edited, one.id)[0]).toMatchObject({
      participationStatus: "DNP",
      placement: null,
      kills: null,
    });
  });
});
