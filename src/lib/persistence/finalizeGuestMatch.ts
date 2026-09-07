import type {
  StoredMatchResult,
  TournamentMatch,
} from "@/domain/matches/types";
import {
  type ManualMatchValidationIssue,
  validateManualMatchResults,
} from "@/domain/matches/validation";

import type { MatchRepository } from "./matchRepository";
import type { MatchResultRepository } from "./matchResultRepository";
import type { TeamRepository } from "./teamRepository";

export type FinalizeGuestMatchResult =
  | {
      readonly ok: true;
      readonly match: TournamentMatch;
      readonly results: readonly StoredMatchResult[];
    }
  | {
      readonly ok: false;
      readonly issues: readonly ManualMatchValidationIssue[];
    };

export interface FinalizeGuestMatchOptions {
  readonly tournamentId: string;
  readonly matchId: string;
  readonly results: readonly StoredMatchResult[];
  readonly matchRepository: MatchRepository;
  readonly matchResultRepository: MatchResultRepository;
  readonly teamRepository: TeamRepository;
  readonly name?: string;
}

export async function finalizeGuestMatch({
  tournamentId,
  matchId,
  results,
  matchRepository,
  matchResultRepository,
  teamRepository,
  name,
}: FinalizeGuestMatchOptions): Promise<FinalizeGuestMatchResult> {
  const [match, teams] = await Promise.all([
    matchRepository.getMatch(tournamentId, matchId),
    teamRepository.listTeamsByTournament(tournamentId),
  ]);
  if (!match) {
    throw new Error("This match is no longer saved in this tournament.");
  }

  const validation = validateManualMatchResults(results, {
    tournamentId,
    matchId,
    participantTeamIds: teams.map((team) => team.id),
  });
  if (!validation.valid) return { ok: false, issues: validation.issues };

  const savedResults = await matchResultRepository.bulkSaveResults(
    tournamentId,
    matchId,
    results,
  );
  const finalized = await matchRepository.updateMatch(tournamentId, matchId, {
    name: name?.trim() || undefined,
    status: "FINALIZED",
  });
  if (!finalized) {
    throw new Error("This match was removed before it could be finalized.");
  }

  return { ok: true, match: finalized, results: savedResults };
}
