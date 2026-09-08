import type {
  StoredMatchResult,
  TournamentMatch,
} from "@/domain/matches/types";
import type { ManualMatchValidationIssue } from "@/domain/matches/validation";

export interface MatchSnapshotCommand {
  readonly tournamentId: string;
  readonly matchId: string;
  readonly results: readonly StoredMatchResult[];
  readonly name?: string;
}

export interface PersistedMatchSnapshot {
  readonly match: TournamentMatch;
  readonly results: readonly StoredMatchResult[];
}

export type FinalizeMatchResult =
  | {
      readonly ok: true;
      readonly match: TournamentMatch;
      readonly results: readonly StoredMatchResult[];
    }
  | {
      readonly ok: false;
      readonly issues: readonly ManualMatchValidationIssue[];
    };

export interface MatchLifecycleRepository {
  createMatchWithInitialResults(
    match: TournamentMatch,
    results: readonly StoredMatchResult[],
  ): Promise<PersistedMatchSnapshot>;
  saveMatchDraft(
    command: MatchSnapshotCommand,
  ): Promise<PersistedMatchSnapshot>;
  finalizeMatch(command: MatchSnapshotCommand): Promise<FinalizeMatchResult>;
  reopenMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<TournamentMatch>;
}
