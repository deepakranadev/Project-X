import { createEmptyManualResults } from "@/domain/matches/createEmptyManualResults";
import type { TournamentMatch } from "@/domain/matches/types";

import type {
  MatchLifecycleRepository,
  PersistedMatchSnapshot,
} from "./matchLifecycleRepository";
import type { MatchRepository } from "./matchRepository";
import type { TeamRepository } from "@/features/teams/teamRepository";

export interface CreateGuestMatchWithInitialResultsOptions {
  readonly tournamentId: string;
  readonly matchRepository: MatchRepository;
  readonly teamRepository: TeamRepository;
  readonly lifecycleRepository: MatchLifecycleRepository;
  readonly name?: string;
  readonly createId?: () => string;
  readonly now?: () => string;
}

export async function createGuestMatchWithInitialResults({
  tournamentId,
  matchRepository,
  teamRepository,
  lifecycleRepository,
  name,
  createId = () => crypto.randomUUID(),
  now = () => new Date().toISOString(),
}: CreateGuestMatchWithInitialResultsOptions): Promise<PersistedMatchSnapshot> {
  const [existing, teams] = await Promise.all([
    matchRepository.listMatchesByTournament(tournamentId),
    teamRepository.listTeamsByTournament(tournamentId),
  ]);
  const nextMatchNumber =
    existing.reduce(
      (highest, match) => Math.max(highest, match.matchNumber),
      0,
    ) + 1;
  const normalizedName = name?.trim();
  const timestamp = now();
  const match: TournamentMatch = {
    id: createId(),
    tournamentId,
    matchNumber: nextMatchNumber,
    ...(normalizedName ? { name: normalizedName } : {}),
    status: "DRAFT",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const results = createEmptyManualResults({
    tournamentId,
    matchId: match.id,
    teams,
    createId,
    now: () => timestamp,
  });

  return lifecycleRepository.createMatchWithInitialResults(match, results);
}
