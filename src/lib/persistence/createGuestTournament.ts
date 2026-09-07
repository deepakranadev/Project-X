import type {
  CreateTournamentInput,
  Tournament,
} from "@/domain/tournaments/types";
import {
  TournamentValidationError,
  validateTournamentInput,
} from "@/domain/tournaments/validation";
import { createBgmiStandardScoringConfig } from "@/domain/tournaments/scoringPresets";

import type { TournamentRepository } from "./tournamentRepository";

export interface TournamentCreationDependencies {
  readonly createId?: () => string;
  readonly now?: () => string;
}

function createId(): string {
  return globalThis.crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export async function createGuestTournament(
  input: CreateTournamentInput,
  repository: TournamentRepository,
  dependencies: TournamentCreationDependencies = {},
): Promise<Tournament> {
  const validation = validateTournamentInput(input);
  if (!validation.valid) {
    throw new TournamentValidationError(validation.issues);
  }

  const timestamp = (dependencies.now ?? now)();
  const tournament: Tournament = {
    id: (dependencies.createId ?? createId)(),
    name: input.name.trim(),
    game: "BGMI",
    tournamentLogo: input.tournamentLogo,
    organizerName: input.organizerName.trim() || null,
    organizerLogo: input.organizerLogo,
    scoringConfig: createBgmiStandardScoringConfig(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return repository.createTournament(tournament);
}
