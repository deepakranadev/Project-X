"use client";

import { useEffect, useState } from "react";

import type { TournamentMatch } from "@/domain/matches/types";
import type { Tournament } from "@/domain/tournaments/types";
import type { Team } from "@/domain/teams/types";
import type { MatchRepository } from "@/features/matches/matchRepository";
import type { MatchResultRepository } from "@/features/matches/matchResultRepository";

import {
  loadGuestOverallStandings,
  type GuestOverallStandingsSnapshot,
} from "@/features/standings/loadGuestOverallStandings";

export interface OverviewRepositories {
  readonly matches: MatchRepository;
  readonly results: MatchResultRepository;
}

export type OverviewState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly matches: readonly TournamentMatch[];
      readonly standingsSnapshot: GuestOverallStandingsSnapshot;
    }
  | { readonly status: "error" };

export function useOverviewData(
  tournament: Tournament,
  teams: readonly Team[],
  repositories: OverviewRepositories,
  refreshVersion: number,
): OverviewState {
  const [state, setState] = useState<OverviewState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        // NOTE: loadGuestOverallStandings internally calls listMatchesByTournament.
        // This results in a duplicate, but inexpensive, IndexedDB read for the match list.
        // This is an approved micro-inefficiency to avoid leaking domain logic into the UI.
        const [matches, standingsSnapshot] = await Promise.all([
          repositories.matches.listMatchesByTournament(tournament.id),
          loadGuestOverallStandings({
            tournament,
            teams,
            matchRepository: repositories.matches,
            matchResultRepository: repositories.results,
          }),
        ]);

        if (active) {
          setState({
            status: "ready",
            matches,
            standingsSnapshot,
          });
        }
      } catch {
        if (active) {
          setState({ status: "error" });
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [tournament, teams, repositories, refreshVersion]);

  return state;
}
