import { IndexedDbTournamentRepository } from "./indexedDbTournamentRepository";
import type { TournamentRepository } from "@/features/tournaments/tournamentRepository";
import { getClientGuestDatabase } from "./clientGuestDatabase";

let repository: TournamentRepository | null = null;

export function getClientTournamentRepository(): TournamentRepository {
  if (typeof window === "undefined") {
    throw new Error("Guest tournament storage is only available in the browser.");
  }

  repository ??= new IndexedDbTournamentRepository({
    database: getClientGuestDatabase(),
  });
  return repository;
}
