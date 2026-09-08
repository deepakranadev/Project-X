"use client";

import { useSyncExternalStore } from "react";

import type { MatchFeatureRepositories } from "@/features/matches/matchFeatureRepositories";
import type { StandingsRepositories } from "@/features/standings/useOverallStandings";
import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import { getClientMatchLifecycleRepository } from "@/infrastructure/persistence/indexed-db/clientMatchLifecycleRepository";
import { getClientMatchRepository } from "@/infrastructure/persistence/indexed-db/clientMatchRepository";
import { getClientMatchResultRepository } from "@/infrastructure/persistence/indexed-db/clientMatchResultRepository";
import { getClientTeamRepository } from "@/infrastructure/persistence/indexed-db/clientTeamRepository";
import { getClientTournamentRepository } from "@/infrastructure/persistence/indexed-db/clientTournamentRepository";

export interface TournamentWorkspaceRepositories {
  readonly tournament: GuestTournamentRepository;
  readonly teams: GuestTeamRepository;
  readonly matchFeature: MatchFeatureRepositories;
  readonly standings: StandingsRepositories;
}

let workspaceRepositories: TournamentWorkspaceRepositories | null = null;

function subscribeToHydration(): () => void {
  return () => undefined;
}

function getServerSnapshot(): null {
  return null;
}

function getTournamentRepositorySnapshot(): GuestTournamentRepository {
  return getClientTournamentRepository();
}

function getWorkspaceRepositorySnapshot(): TournamentWorkspaceRepositories {
  if (workspaceRepositories) return workspaceRepositories;
  const matches = getClientMatchRepository();
  const results = getClientMatchResultRepository();
  const teams = getClientTeamRepository();
  workspaceRepositories = {
    tournament: getClientTournamentRepository(),
    teams,
    matchFeature: {
      lifecycle: getClientMatchLifecycleRepository(),
      matches,
      results,
      teams,
    },
    standings: { matches, results },
  };
  return workspaceRepositories;
}

export function useClientTournamentRepository(): GuestTournamentRepository | null {
  return useSyncExternalStore(
    subscribeToHydration,
    getTournamentRepositorySnapshot,
    getServerSnapshot,
  );
}

export function useClientWorkspaceRepositories(): TournamentWorkspaceRepositories | null {
  return useSyncExternalStore(
    subscribeToHydration,
    getWorkspaceRepositorySnapshot,
    getServerSnapshot,
  );
}
