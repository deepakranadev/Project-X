"use client";

import { useEffect, useState } from "react";

import { OverallStandings } from "@/features/standings/components/OverallStandings";
import type { GuestTeam } from "@/features/teams/types";
import type { GuestTournament } from "@/features/tournaments/types";
import { useWorkspaceRepositories } from "./WorkspaceRepositoryProvider";

type StandingsRouteState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly tournament: GuestTournament; readonly teams: readonly GuestTeam[] }
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
    return () => { active = false; };
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
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 md:py-8 flex flex-col gap-4 md:gap-6">
      <OverallStandings
        tournament={state.tournament}
        teams={state.teams}
        repositories={repositories.standings}
        refreshVersion={0} // No edits happen directly on Standings route that require a prop refresh
      />
    </main>
  );
}
