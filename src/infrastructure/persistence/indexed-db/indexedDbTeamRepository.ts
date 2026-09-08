import { TeamDeletionError } from "@/domain/teams/errors";
import type { Team } from "@/domain/teams/types";
import {
  normalizeTeamNameKey,
  normalizeTeamWhitespace,
} from "@/domain/teams/validation";
import { assertValidTeamInput } from "@/features/teams/validation";
import type { PersistedImage } from "@/infrastructure/browser/persistedImage";

import {
  GuestDatabase,
  type GuestDatabaseOptions,
  MATCH_RESULT_MATCH_TEAM_INDEX,
  MATCH_RESULT_STORE,
  MATCH_STORE,
  MATCH_TOURNAMENT_INDEX,
  TEAM_STORE,
  TEAM_TOURNAMENT_INDEX,
  TOURNAMENT_STORE,
} from "./guestDatabase";
import {
  abortTransaction,
  observeTransaction,
  requestToPromise,
} from "./indexedDbUtils";
import {
  parseTeamRecord,
  parseTournamentRecord,
  tournamentRecordToTournament,
} from "./parseStoredRecords";
import {
  TeamRepositoryError,
  type TeamRepository,
  type TeamUpdate,
} from "@/features/teams/teamRepository";

export interface IndexedDbTeamRepositoryOptions extends GuestDatabaseOptions {
  readonly database?: GuestDatabase;
  readonly now?: () => string;
}

type PersistedTeam = Team<PersistedImage>;

function defaultNow(): string {
  return new Date().toISOString();
}

function compareTeams(left: PersistedTeam, right: PersistedTeam): number {
  if (left.slotNumber !== null && right.slotNumber !== null) {
    const slotComparison = left.slotNumber - right.slotNumber;
    if (slotComparison !== 0) return slotComparison;
  } else if (left.slotNumber !== null) {
    return -1;
  } else if (right.slotNumber !== null) {
    return 1;
  }

  const nameComparison = normalizeTeamNameKey(left.name).localeCompare(
    normalizeTeamNameKey(right.name),
  );
  if (nameComparison !== 0) return nameComparison;
  return left.createdAt.localeCompare(right.createdAt);
}

function normalizeTeam(team: PersistedTeam): PersistedTeam {
  return {
    ...team,
    tournamentId: team.tournamentId.trim(),
    name: normalizeTeamWhitespace(team.name),
    shortName: normalizeTeamWhitespace(team.shortName ?? "") || null,
  };
}

function assertUniqueTeam(
  candidate: PersistedTeam,
  roster: readonly PersistedTeam[],
  ignoredTeamId?: string,
): void {
  const duplicateName = roster.find(
    (team) =>
      team.id !== ignoredTeamId &&
      normalizeTeamNameKey(team.name) === normalizeTeamNameKey(candidate.name),
  );
  if (duplicateName) {
    throw new TeamRepositoryError(
      "DUPLICATE_NAME",
      `“${candidate.name}” matches existing team “${duplicateName.name}”. Team names must be unique within this tournament.`,
    );
  }

  if (candidate.slotNumber !== null) {
    const duplicateSlot = roster.find(
      (team) =>
        team.id !== ignoredTeamId && team.slotNumber === candidate.slotNumber,
    );
    if (duplicateSlot) {
      throw new TeamRepositoryError(
        "SLOT_CONFLICT",
        `Slot #${candidate.slotNumber} is already assigned to ${duplicateSlot.name}. Choose another slot.`,
      );
    }
  }
}

export class IndexedDbTeamRepository implements TeamRepository<PersistedImage> {
  private readonly database: GuestDatabase;
  private readonly now: () => string;

  constructor(options: IndexedDbTeamRepositoryOptions = {}) {
    this.database =
      options.database ??
      new GuestDatabase({
        databaseName: options.databaseName,
        indexedDbFactory: options.indexedDbFactory,
      });
    this.now = options.now ?? defaultNow;
  }

  async createTeam(team: PersistedTeam): Promise<PersistedTeam> {
    const created = await this.bulkCreateTeams([team]);
    const first = created[0];
    if (!first) throw new Error("Team creation did not return a team.");
    return first;
  }

  async bulkCreateTeams(
    teams: readonly PersistedTeam[],
  ): Promise<readonly PersistedTeam[]> {
    if (teams.length === 0) return [];

    const normalizedTeams = teams.map(normalizeTeam);
    normalizedTeams.forEach(assertValidTeamInput);
    const tournamentId = normalizedTeams[0]?.tournamentId;
    if (
      !tournamentId ||
      normalizedTeams.some((team) => team.tournamentId !== tournamentId)
    ) {
      throw new TeamRepositoryError(
        "TOURNAMENT_NOT_FOUND",
        "Every team in a bulk operation must belong to the same tournament.",
      );
    }

    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [TOURNAMENT_STORE, TEAM_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);
    const storedTournament = await requestToPromise<unknown>(
      transaction.objectStore(TOURNAMENT_STORE).get(tournamentId),
    );

    if (storedTournament === undefined) {
      await abortTransaction(transaction);
      throw new TeamRepositoryError(
        "TOURNAMENT_NOT_FOUND",
        "This tournament no longer exists on this device.",
      );
    }
    tournamentRecordToTournament(parseTournamentRecord(storedTournament));

    const store = transaction.objectStore(TEAM_STORE);
    const storedTeams = await requestToPromise<unknown[]>(
      store.index(TEAM_TOURNAMENT_INDEX).getAll(tournamentId),
    );
    const existing = storedTeams.map(parseTeamRecord);
    const checked: PersistedTeam[] = [...existing];

    try {
      for (const team of normalizedTeams) {
        assertUniqueTeam(team, checked);
        checked.push(team);
      }
    } catch (error) {
      await abortTransaction(transaction);
      throw error;
    }

    for (const team of normalizedTeams) {
      await requestToPromise(store.add(team));
    }
    await completion;
    return normalizedTeams;
  }

  async getTeam(
    tournamentId: string,
    teamId: string,
  ): Promise<PersistedTeam | null> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(TEAM_STORE, "readonly");
    const completion = observeTransaction(transaction);
    const stored = await requestToPromise<unknown>(
      transaction.objectStore(TEAM_STORE).get(teamId),
    );
    await completion;
    const team = stored === undefined ? undefined : parseTeamRecord(stored);
    return team?.tournamentId === tournamentId ? team : null;
  }

  async listTeamsByTournament(
    tournamentId: string,
  ): Promise<readonly PersistedTeam[]> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(TEAM_STORE, "readonly");
    const completion = observeTransaction(transaction);
    const storedTeams = await requestToPromise<unknown[]>(
      transaction
        .objectStore(TEAM_STORE)
        .index(TEAM_TOURNAMENT_INDEX)
        .getAll(tournamentId),
    );
    await completion;
    const teams = storedTeams.map(parseTeamRecord);
    return teams.sort(compareTeams);
  }

  async updateTeam(
    tournamentId: string,
    teamId: string,
    updates: TeamUpdate<PersistedImage>,
  ): Promise<PersistedTeam | null> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(TEAM_STORE, "readwrite");
    const completion = observeTransaction(transaction);
    const store = transaction.objectStore(TEAM_STORE);
    const stored = await requestToPromise<unknown>(store.get(teamId));

    if (stored === undefined) {
      await completion;
      return null;
    }
    const existing = parseTeamRecord(stored);
    if (existing.tournamentId !== tournamentId) {
      await completion;
      return null;
    }

    const updated = normalizeTeam({
      ...existing,
      ...updates,
      id: existing.id,
      tournamentId: existing.tournamentId,
      createdAt: existing.createdAt,
      updatedAt: this.now(),
    });
    assertValidTeamInput(updated);
    const storedRoster = await requestToPromise<unknown[]>(
      store.index(TEAM_TOURNAMENT_INDEX).getAll(tournamentId),
    );
    const roster = storedRoster.map(parseTeamRecord);

    try {
      assertUniqueTeam(updated, roster, existing.id);
    } catch (error) {
      await abortTransaction(transaction);
      throw error;
    }

    await requestToPromise(store.put(updated));
    await completion;
    return updated;
  }

  async deleteTeam(tournamentId: string, teamId: string): Promise<void> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(
      [TEAM_STORE, MATCH_STORE, MATCH_RESULT_STORE],
      "readwrite",
    );
    const completion = observeTransaction(transaction);
    const store = transaction.objectStore(TEAM_STORE);
    const stored = await requestToPromise<unknown>(store.get(teamId));
    if (stored === undefined) {
      await completion;
      return;
    }
    const existing = parseTeamRecord(stored);
    if (existing.tournamentId !== tournamentId) {
      await completion;
      return;
    }

    const matchIds = await requestToPromise<IDBValidKey[]>(
      transaction
        .objectStore(MATCH_STORE)
        .index(MATCH_TOURNAMENT_INDEX)
        .getAllKeys(tournamentId),
    );
    const resultIndex = transaction
      .objectStore(MATCH_RESULT_STORE)
      .index(MATCH_RESULT_MATCH_TEAM_INDEX);
    for (const matchId of matchIds) {
      const resultKey = await requestToPromise<IDBValidKey | undefined>(
        resultIndex.getKey([matchId, teamId]),
      );
      if (resultKey !== undefined) {
        await abortTransaction(transaction);
        throw new TeamDeletionError(tournamentId, teamId);
      }
    }

    await requestToPromise(store.delete(teamId));
    await completion;
  }

  async reorderTeams(
    tournamentId: string,
    orderedTeamIds: readonly string[],
  ): Promise<readonly PersistedTeam[]> {
    const database = await this.database.getConnection();
    const transaction = database.transaction(TEAM_STORE, "readwrite");
    const completion = observeTransaction(transaction);
    const store = transaction.objectStore(TEAM_STORE);
    const storedRoster = await requestToPromise<unknown[]>(
      store.index(TEAM_TOURNAMENT_INDEX).getAll(tournamentId),
    );
    const roster = storedRoster.map(parseTeamRecord);
    const requestedIds = new Set(orderedTeamIds);

    if (
      requestedIds.size !== orderedTeamIds.length ||
      roster.length !== orderedTeamIds.length ||
      roster.some((team) => !requestedIds.has(team.id))
    ) {
      await abortTransaction(transaction);
      throw new TeamRepositoryError(
        "REORDER_MISMATCH",
        "The roster changed before it could be reordered. Reload and try again.",
      );
    }

    const byId = new Map(roster.map((team) => [team.id, team]));
    for (const team of roster) {
      await requestToPromise(store.put({ ...team, slotNumber: null }));
    }

    const timestamp = this.now();
    const reordered: PersistedTeam[] = [];
    for (const [index, teamId] of orderedTeamIds.entries()) {
      const existing = byId.get(teamId);
      if (!existing) continue;
      const updated: PersistedTeam = {
        ...existing,
        slotNumber: index + 1,
        updatedAt: timestamp,
      };
      await requestToPromise(store.put(updated));
      reordered.push(updated);
    }

    await completion;
    return reordered;
  }

  close(): Promise<void> {
    return this.database.close();
  }
}
