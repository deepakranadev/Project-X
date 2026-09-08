import { getClientGuestDatabase } from "./clientGuestDatabase";
import { IndexedDbTeamRepository } from "./indexedDbTeamRepository";
import type { TeamRepository } from "@/features/teams/teamRepository";
import type { PersistedImage } from "@/infrastructure/browser/persistedImage";

let repository: TeamRepository<PersistedImage> | null = null;

export function getClientTeamRepository(): TeamRepository<PersistedImage> {
  if (typeof window === "undefined") {
    throw new Error("Guest team storage is only available in the browser.");
  }

  repository ??= new IndexedDbTeamRepository({
    database: getClientGuestDatabase(),
  });
  return repository;
}
