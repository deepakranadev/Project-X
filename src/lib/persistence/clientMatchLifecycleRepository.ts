import { getClientGuestDatabase } from "./clientGuestDatabase";
import { IndexedDbMatchLifecycleRepository } from "./indexedDbMatchLifecycleRepository";
import type { MatchLifecycleRepository } from "./matchLifecycleRepository";

let repository: MatchLifecycleRepository | null = null;

export function getClientMatchLifecycleRepository(): MatchLifecycleRepository {
  if (typeof window === "undefined") {
    throw new Error("Guest match storage is only available in the browser.");
  }
  repository ??= new IndexedDbMatchLifecycleRepository({
    database: getClientGuestDatabase(),
  });
  return repository;
}
