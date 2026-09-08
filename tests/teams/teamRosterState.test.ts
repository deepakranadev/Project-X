import { describe, expect, it, vi } from "vitest";

import {
  publishSuccessfulTeamMutation,
  removeRosterTeam,
  replaceRosterTeam,
} from "../../src/features/teams/teamRosterState";
import type { GuestTeam } from "../../src/features/teams/types";

function team(id: string, name = `Team ${id}`): GuestTeam {
  return {
    id,
    tournamentId: "tournament-one",
    name,
    shortName: null,
    slotNumber: id === "one" ? 1 : 2,
    logo: null,
    createdAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
  };
}

describe("canonical team roster state", () => {
  it("publishes the canonical roster returned by a successful mutation", async () => {
    const roster = [team("one"), team("two")];
    const publish = vi.fn();

    await expect(
      publishSuccessfulTeamMutation(async () => roster, publish),
    ).resolves.toBe(roster);
    expect(publish).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledWith(roster);
  });

  it("does not publish false state when the mutation fails", async () => {
    const publish = vi.fn();
    const failure = new Error("write failed");

    await expect(
      publishSuccessfulTeamMutation(async () => Promise.reject(failure), publish),
    ).rejects.toBe(failure);
    expect(publish).not.toHaveBeenCalled();
  });

  it("replaces and removes roster entries without changing unrelated identities", () => {
    const first = team("one");
    const second = team("two");
    const updated = { ...first, name: "Renamed team" };

    const replaced = replaceRosterTeam([first, second], updated);
    expect(replaced).toEqual([updated, second]);
    expect(replaced[1]).toBe(second);
    expect(removeRosterTeam(replaced, first.id)).toEqual([second]);
  });
});
