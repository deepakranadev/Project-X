import type { StoredMatchResult } from "@/domain/matches/types";

import type {
  FinalizeMatchResult,
  MatchLifecycleRepository,
} from "./matchLifecycleRepository";

export interface FinalizeGuestMatchOptions {
  readonly tournamentId: string;
  readonly matchId: string;
  readonly results: readonly StoredMatchResult[];
  readonly lifecycleRepository: MatchLifecycleRepository;
  readonly name?: string;
}

export async function finalizeGuestMatch({
  tournamentId,
  matchId,
  results,
  lifecycleRepository,
  name,
}: FinalizeGuestMatchOptions): Promise<FinalizeMatchResult> {
  return lifecycleRepository.finalizeMatch({
    tournamentId,
    matchId,
    results,
    name,
  });
}
