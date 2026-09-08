import type { StoredMatchResult } from "@/domain/matches/types";

export interface MatchResultRepository {
  getResultsByMatch(
    tournamentId: string,
    matchId: string,
  ): Promise<readonly StoredMatchResult[]>;
  saveDraftResults(
    tournamentId: string,
    matchId: string,
    results: readonly StoredMatchResult[],
  ): Promise<readonly StoredMatchResult[]>;
  saveResult(
    tournamentId: string,
    matchId: string,
    result: StoredMatchResult,
  ): Promise<StoredMatchResult>;
  bulkSaveResults(
    tournamentId: string,
    matchId: string,
    results: readonly StoredMatchResult[],
  ): Promise<readonly StoredMatchResult[]>;
  deleteResultsByMatch(tournamentId: string, matchId: string): Promise<void>;
}

