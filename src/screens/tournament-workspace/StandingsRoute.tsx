"use client";

import { useEffect, useState } from "react";

import { OverallStandings } from "@/features/standings/components/OverallStandings";
import type { GuestTeam } from "@/features/teams/types";
import type { GuestTournament } from "@/features/tournaments/types";
import { useWorkspaceRepositories } from "./WorkspaceRepositoryProvider";

type StandingsRouteState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly tournament: GuestTournament;
      readonly teams: readonly GuestTeam[];
    }
  | { readonly status: "error" };

export function StandingsRoute({ tournamentId }: { readonly tournamentId: string }) {
  const repositories = useWorkspaceRepositories();
  const [state, setState] = useState<StandingsRouteState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [tournament, teams] = await Promise.all([
          repositories.tournament.getTournament(tournamentId),
          repositories.teams.listTeamsByTournament(tournamentId),
        ]);
        if (!active) return;
        if (!tournament) {
          setState({ status: "error" });
          return;
        }
        setState({ status: "ready", tournament, teams });
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [repositories.teams, repositories.tournament, tournamentId]);

  if (state.status === "loading") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-slate-400">Loading standings…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-red-500">Failed to load standings.</p>
      </div>
    );
  }

  return (
    <main
      className="w-full flex-1 px-4 pt-4 pb-24 md:py-8 md:px-10 flex flex-col items-center"
      data-purpose="standings-main"
    >
      <div className="w-full max-w-5xl space-y-4 md:space-y-6">
        <OverallStandings
          tournament={state.tournament}
          teams={state.teams}
          repositories={repositories.standings}
          refreshVersion={0}
        />
      </div>
    </main>
  );
}
