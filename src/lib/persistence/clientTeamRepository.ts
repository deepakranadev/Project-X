import { getClientGuestDatabase } from "./clientGuestDatabase";
import { IndexedDbTeamRepository } from "./indexedDbTeamRepository";
import type { TeamRepository } from "./teamRepository";

let repository: TeamRepository | null = null;

export function getClientTeamRepository(): TeamRepository {
  if (typeof window === "undefined") {
    throw new Error("Guest team storage is only available in the browser.");
  }

  repository ??= new IndexedDbTeamRepository({
    database: getClientGuestDatabase(),
  });
  return repository;
}
