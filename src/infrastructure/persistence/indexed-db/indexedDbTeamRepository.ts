import type { PersistedImage } from "@/infrastructure/browser/persistedImage";

import {
  GuestDatabase,
  type GuestDatabaseOptions,
  TEAM_STORE,
  TEAM_TOURNAMENT_INDEX,
  TOURNAMENT_STORE,
} from "./guestDatabase";
import {
  abortTransaction,
  observeTransaction,
  requestToPromise,
} from "./indexedDbUtils";
import { deleteStoredTeam, reorderStoredTeams } from "./indexedDbTeamCommands";
import {
  assertUniqueStoredTeam,
  compareStoredTeams,
  normalizeStoredTeam,
  type PersistedTeam,
} from "./indexedDbTeamRules";
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

function defaultNow(): string {
  return new Date().toISOString();
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

    const normalizedTeams = teams.map(normalizeStoredTeam);
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
        assertUniqueStoredTeam(team, checked);
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
    return teams.sort(compareStoredTeams);
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

    const updated = normalizeStoredTeam({
      ...existing,
      ...updates,
      id: existing.id,
      tournamentId: existing.tournamentId,
      createdAt: existing.createdAt,
      updatedAt: this.now(),
    });
    const storedRoster = await requestToPromise<unknown[]>(
      store.index(TEAM_TOURNAMENT_INDEX).getAll(tournamentId),
    );
    const roster = storedRoster.map(parseTeamRecord);

    try {
      assertUniqueStoredTeam(updated, roster, existing.id);
    } catch (error) {
      await abortTransaction(transaction);
      throw error;
    }

    await requestToPromise(store.put(updated));
    await completion;
    return updated;
  }

  async deleteTeam(tournamentId: string, teamId: string): Promise<void> {
    return deleteStoredTeam(this.database, tournamentId, teamId);
  }

  async reorderTeams(
    tournamentId: string,
    orderedTeamIds: readonly string[],
  ): Promise<readonly PersistedTeam[]> {
    return reorderStoredTeams(this.database, this.now, tournamentId, orderedTeamIds);
  }

  close(): Promise<void> {
    return this.database.close();
  }
}
