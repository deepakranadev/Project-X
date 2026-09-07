import { describe, expect, it } from "vitest";

import type {
  MatchUpdate,
  TournamentMatch,
} from "../../src/domain/matches/types";
import { createGuestMatch } from "../../src/lib/persistence/createGuestMatch";
import type { MatchRepository } from "../../src/lib/persistence/matchRepository";

class MemoryMatchRepository implements MatchRepository {
  readonly matches: TournamentMatch[] = [];

  async createMatch(match: TournamentMatch) {
    this.matches.push(match);
    return match;
  }
  async getMatch(tournamentId: string, matchId: string) {
    return this.matches.find((match) => match.id === matchId && match.tournamentId === tournamentId) ?? null;
  }
  async listMatchesByTournament(tournamentId: string) {
    return this.matches.filter((match) => match.tournamentId === tournamentId);
  }
  async updateMatch(tournamentId: string, matchId: string, updates: MatchUpdate) {
    const index = this.matches.findIndex((match) => match.id === matchId && match.tournamentId === tournamentId);
    if (index < 0) return null;
    const updated = { ...this.matches[index]!, ...updates };
    this.matches[index] = updated;
    return updated;
  }
  async deleteMatch(tournamentId: string, matchId: string) {
    const index = this.matches.findIndex((match) => match.id === matchId && match.tournamentId === tournamentId);
    if (index >= 0) this.matches.splice(index, 1);
  }
}

describe("createGuestMatch", () => {
  it("creates sequential draft match numbers without using them as identity", async () => {
    const repository = new MemoryMatchRepository();
    let id = 0;
    const options = {
      tournamentId: "tournament-one",
      repository,
      createId: () => `match-id-${++id}`,
      now: () => "2026-09-06T12:00:00.000Z",
    };

    const first = await createGuestMatch(options);
    const second = await createGuestMatch(options);

    expect(first).toMatchObject({ id: "match-id-1", matchNumber: 1, status: "DRAFT" });
    expect(second).toMatchObject({ id: "match-id-2", matchNumber: 2, status: "DRAFT" });
    expect(first.id).not.toBe(String(first.matchNumber));
  });

  it("uses the next number after the highest existing match", async () => {
    const repository = new MemoryMatchRepository();
    repository.matches.push({
      id: "match-five",
      tournamentId: "tournament-one",
      matchNumber: 5,
      status: "DRAFT",
      createdAt: "2026-09-06T10:00:00.000Z",
      updatedAt: "2026-09-06T10:00:00.000Z",
    });

    const created = await createGuestMatch({
      tournamentId: "tournament-one",
      repository,
      createId: () => "next-id",
      now: () => "2026-09-06T12:00:00.000Z",
    });

    expect(created.matchNumber).toBe(6);
  });
});

