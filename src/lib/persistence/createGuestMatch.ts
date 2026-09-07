import type { TournamentMatch } from "@/domain/matches/types";

import type { MatchRepository } from "./matchRepository";

export interface CreateGuestMatchOptions {
  readonly tournamentId: string;
  readonly repository: MatchRepository;
  readonly name?: string;
  readonly createId?: () => string;
  readonly now?: () => string;
}

export async function createGuestMatch({
  tournamentId,
  repository,
  name,
  createId = () => crypto.randomUUID(),
  now = () => new Date().toISOString(),
}: CreateGuestMatchOptions): Promise<TournamentMatch> {
  const existing = await repository.listMatchesByTournament(tournamentId);
  const nextMatchNumber =
    existing.reduce(
      (highest, match) => Math.max(highest, match.matchNumber),
      0,
    ) + 1;
  const normalizedName = name?.trim();
  const timestamp = now();

  return repository.createMatch({
    id: createId(),
    tournamentId,
    matchNumber: nextMatchNumber,
    ...(normalizedName ? { name: normalizedName } : {}),
    status: "DRAFT",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

