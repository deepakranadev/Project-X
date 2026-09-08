import type { StoredMatchResult } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";

import { buildMatchDraftRows } from "./matchEntryDraft";
import { createMatchId, currentMatchTimestamp } from "./matchFactories";
import type { MatchResultRepository } from "./matchResultRepository";

interface LoadMatchEntryDraftOptions {
  readonly tournamentId: string;
  readonly matchId: string;
  readonly teams: readonly Team[];
  readonly repository: MatchResultRepository;
  readonly createId?: () => string;
  readonly now?: () => string;
}

export async function loadMatchEntryDraft({
  tournamentId,
  matchId,
  teams,
  repository,
  createId = createMatchId,
  now = currentMatchTimestamp,
}: LoadMatchEntryDraftOptions): Promise<readonly StoredMatchResult[]> {
  const stored = await repository.getResultsByMatch(tournamentId, matchId);
  const draft = buildMatchDraftRows({
    stored,
    teams,
    tournamentId,
    matchId,
    createId,
    now,
  });
  if (draft.created.length > 0) {
    await repository.bulkSaveResults(tournamentId, matchId, draft.created);
  }
  return draft.results;
}
