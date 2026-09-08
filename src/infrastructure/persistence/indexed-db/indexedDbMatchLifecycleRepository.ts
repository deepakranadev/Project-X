import type { StoredMatchResult, TournamentMatch } from "@/domain/matches/types";
import type {
  FinalizeMatchResult,
  MatchLifecycleRepository,
  MatchSnapshotCommand,
  PersistedMatchSnapshot,
} from "@/features/matches/matchLifecycleRepository";

import { GuestDatabase, type GuestDatabaseOptions } from "./guestDatabase";
import {
  createMatchWithInitialResults,
  saveMatchDraft,
} from "./indexedDbDraftMatchCommands";
import {
  finalizeMatch,
  reopenMatch,
} from "./indexedDbMatchStatusCommands";

export {
  MatchLifecycleRepositoryError,
  type MatchLifecycleRepositoryErrorCode,
} from "./matchLifecycleErrors";

export interface IndexedDbMatchLifecycleRepositoryOptions extends GuestDatabaseOptions {
  readonly database?: GuestDatabase;
  readonly now?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

export class IndexedDbMatchLifecycleRepository implements MatchLifecycleRepository {
  private readonly database: GuestDatabase;
  private readonly now: () => string;

  constructor(options: IndexedDbMatchLifecycleRepositoryOptions = {}) {
    this.database = options.database ?? new GuestDatabase({
      databaseName: options.databaseName,
      indexedDbFactory: options.indexedDbFactory,
    });
    this.now = options.now ?? defaultNow;
  }

  createMatchWithInitialResults(
    match: TournamentMatch,
    results: readonly StoredMatchResult[],
  ): Promise<PersistedMatchSnapshot> {
    return createMatchWithInitialResults(this.database, match, results);
  }

  saveMatchDraft(command: MatchSnapshotCommand): Promise<PersistedMatchSnapshot> {
    return saveMatchDraft(this.database, this.now, command);
  }

  finalizeMatch(command: MatchSnapshotCommand): Promise<FinalizeMatchResult> {
    return finalizeMatch(this.database, this.now, command);
  }

  reopenMatch(tournamentId: string, matchId: string): Promise<TournamentMatch> {
    return reopenMatch(this.database, this.now, tournamentId, matchId);
  }

  close(): Promise<void> {
    return this.database.close();
  }
}
