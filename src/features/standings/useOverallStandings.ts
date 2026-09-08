"use client";

import { useEffect, useState } from "react";

import type { Tournament } from "@/domain/tournaments/types";
import type { MatchRepository } from "@/features/matches/matchRepository";
import type { MatchResultRepository } from "@/features/matches/matchResultRepository";
import type { GuestTeam } from "@/features/teams/types";

import {
  loadGuestOverallStandings,
  type GuestOverallStandingsSnapshot,
} from "./loadGuestOverallStandings";

export interface StandingsRepositories {
  readonly matches: MatchRepository;
  readonly results: MatchResultRepository;
}

export type StandingsState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly snapshot: GuestOverallStandingsSnapshot }
  | { readonly status: "error" };

export function useOverallStandings(
  tournament: Tournament,
  teams: readonly GuestTeam[],
  repositories: StandingsRepositories,
  refreshVersion: number,
): StandingsState {
  const [state, setState] = useState<StandingsState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const snapshot = await loadGuestOverallStandings({
          tournament,
          teams,
          matchRepository: repositories.matches,
          matchResultRepository: repositories.results,
        });
        if (active) setState({ status: "ready", snapshot });
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refreshVersion, repositories, teams, tournament]);

  return state;
}
