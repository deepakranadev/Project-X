import { getClientGuestDatabase } from "./clientGuestDatabase";
import { IndexedDbMatchRepository } from "./indexedDbMatchRepository";
import type { MatchRepository } from "@/features/matches/matchRepository";

let repository: MatchRepository | null = null;

export function getClientMatchRepository(): MatchRepository {
  if (typeof window === "undefined") {
    throw new Error("Guest match storage is only available in the browser.");
  }
  repository ??= new IndexedDbMatchRepository({
    database: getClientGuestDatabase(),
  });
  return repository;
}
