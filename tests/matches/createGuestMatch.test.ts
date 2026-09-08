import { describe, expect, it } from "vitest";

import type {
  MatchDetailsUpdate,
  StoredMatchResult,
  TournamentMatch,
} from "../../src/domain/matches/types";
import type { Team, TeamUpdate } from "../../src/domain/teams/types";
import { createGuestMatchWithInitialResults } from "../../src/features/matches/createGuestMatch";
import type {
  FinalizeMatchResult,
  MatchLifecycleRepository,
  MatchSnapshotCommand,
  PersistedMatchSnapshot,
} from "../../src/features/matches/matchLifecycleRepository";
import type { MatchRepository } from "../../src/features/matches/matchRepository";
import type { TeamRepository } from "../../src/features/teams/teamRepository";

class MemoryMatchRepository implements MatchRepository {
  readonly matches: TournamentMatch[] = [];

  async createMatch(match: TournamentMatch) {
    this.matches.push(match);
    return match;
  }
  async getMatch(tournamentId: string, matchId: string) {
    return this.matches.find(
      (match) =>
        match.id === matchId && match.tournamentId === tournamentId,
    ) ?? null;
  }
  async listMatchesByTournament(tournamentId: string) {
    return this.matches.filter((match) => match.tournamentId === tournamentId);
  }
  async updateMatch(
    tournamentId: string,
    matchId: string,
    updates: MatchDetailsUpdate,
  ) {
    const index = this.matches.findIndex(
      (match) =>
        match.id === matchId && match.tournamentId === tournamentId,
    );
    if (index < 0) return null;
    const updated = { ...this.matches[index]!, ...updates };
    this.matches[index] = updated;
    return updated;
  }
  async deleteMatch(tournamentId: string, matchId: string) {
    const index = this.matches.findIndex(
      (match) =>
        match.id === matchId && match.tournamentId === tournamentId,
    );
    if (index >= 0) this.matches.splice(index, 1);
  }
}

class MemoryTeamRepository implements TeamRepository {
  constructor(readonly teams: readonly Team[]) {}

  async createTeam(team: Team) {
    return team;
  }
  async bulkCreateTeams(teams: readonly Team[]) {
    return teams;
  }
  async getTeam(tournamentId: string, teamId: string) {
    return this.teams.find(
      (team) => team.id === teamId && team.tournamentId === tournamentId,
    ) ?? null;
  }
  async listTeamsByTournament(tournamentId: string) {
    return this.teams.filter((team) => team.tournamentId === tournamentId);
  }
  async updateTeam(
    tournamentId: string,
    teamId: string,
    updates: TeamUpdate,
  ) {
    void tournamentId;
    void teamId;
    void updates;
    return null;
  }
  async deleteTeam(tournamentId: string, teamId: string) {
    void tournamentId;
    void teamId;
  }
  async reorderTeams(tournamentId: string, orderedTeamIds: readonly string[]) {
    void tournamentId;
    void orderedTeamIds;
    return this.teams;
  }
}

class RecordingLifecycleRepository implements MatchLifecycleRepository {
  readonly created: PersistedMatchSnapshot[] = [];

  async createMatchWithInitialResults(
    match: TournamentMatch,
    results: readonly StoredMatchResult[],
  ) {
    const snapshot = { match, results };
    this.created.push(snapshot);
    return snapshot;
  }
  async saveMatchDraft(
    command: MatchSnapshotCommand,
  ): Promise<PersistedMatchSnapshot> {
    void command;
    throw new Error("Not used by this test.");
  }
  async finalizeMatch(
    command: MatchSnapshotCommand,
  ): Promise<FinalizeMatchResult> {
    void command;
    throw new Error("Not used by this test.");
  }
  async reopenMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<TournamentMatch> {
    void tournamentId;
    void matchId;
    throw new Error("Not used by this test.");
  }
}

function team(id: string, slotNumber: number): Team {
  return {
    id,
    tournamentId: "tournament-one",
    name: `Team ${id}`,
    shortName: null,
    slotNumber,
    logo: null,
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  };
}

describe("createGuestMatchWithInitialResults", () => {
  it("creates a sequential Draft and one initial row per team as one command", async () => {
    const matchRepository = new MemoryMatchRepository();
    const teamRepository = new MemoryTeamRepository([
      team("one", 1),
      team("two", 2),
    ]);
    const lifecycleRepository = new RecordingLifecycleRepository();
    let id = 0;

    const created = await createGuestMatchWithInitialResults({
      tournamentId: "tournament-one",
      matchRepository,
      teamRepository,
      lifecycleRepository,
      createId: () => `generated-${++id}`,
      now: () => "2026-09-06T12:00:00.000Z",
    });

    expect(created.match).toMatchObject({
      id: "generated-1",
      matchNumber: 1,
      status: "DRAFT",
    });
    expect(created.results).toMatchObject([
      { id: "generated-2", teamId: "one", placement: null, kills: null },
      { id: "generated-3", teamId: "two", placement: null, kills: null },
    ]);
    expect(lifecycleRepository.created).toHaveLength(1);
  });

  it("uses the next number after the highest existing match", async () => {
    const matchRepository = new MemoryMatchRepository();
    matchRepository.matches.push({
      id: "match-five",
      tournamentId: "tournament-one",
      matchNumber: 5,
      status: "DRAFT",
      createdAt: "2026-09-06T10:00:00.000Z",
      updatedAt: "2026-09-06T10:00:00.000Z",
    });

    const created = await createGuestMatchWithInitialResults({
      tournamentId: "tournament-one",
      matchRepository,
      teamRepository: new MemoryTeamRepository([team("one", 1)]),
      lifecycleRepository: new RecordingLifecycleRepository(),
      createId: () => "next-id",
      now: () => "2026-09-06T12:00:00.000Z",
    });

    expect(created.match.matchNumber).toBe(6);
  });
});
