import { getClientGuestDatabase } from "./clientGuestDatabase";
import { IndexedDbMatchResultRepository } from "./indexedDbMatchResultRepository";
import type { MatchResultRepository } from "@/features/matches/matchResultRepository";

let repository: MatchResultRepository | null = null;

export function getClientMatchResultRepository(): MatchResultRepository {
  if (typeof window === "undefined") {
    throw new Error(
      "Guest match-result storage is only available in the browser.",
    );
  }
  repository ??= new IndexedDbMatchResultRepository({
    database: getClientGuestDatabase(),
  });
  return repository;
}
