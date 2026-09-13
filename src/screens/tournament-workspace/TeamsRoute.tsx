"use client";

import { useEffect, useState, useCallback } from "react";

import type { Tournament } from "@/domain/tournaments/types";
import { TeamManagement } from "@/features/teams/components/TeamManagement";
import type { GuestTeam } from "@/features/teams/types";
import { useWorkspaceCounts } from "./WorkspaceCountContext";
import { useWorkspaceRepositories } from "./WorkspaceRepositoryProvider";

type TeamsRouteState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly tournament: Tournament;
      readonly teams: readonly GuestTeam[];
    }
  | { readonly status: "error" };

export function TeamsRoute({ tournamentId }: { readonly tournamentId: string }) {
  const repositories = useWorkspaceRepositories();
  const { setTeamsCount } = useWorkspaceCounts();
  const [state, setState] = useState<TeamsRouteState>({ status: "loading" });

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
        setTeamsCount(teams.length);
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [repositories.teams, repositories.tournament, setTeamsCount, tournamentId]);

  const handleTeamsChanged = useCallback(
    (teams: readonly GuestTeam[]) => {
      setState((prev) => (prev.status === "ready" ? { ...prev, teams } : prev));
      setTeamsCount(teams.length);
    },
    [setTeamsCount],
  );

  if (state.status === "loading") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-slate-400">Loading teams…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-red-500">Failed to load teams.</p>
      </div>
    );
  }

  return (
    <main
      className="w-full flex-1 px-4 pt-4 pb-24 md:py-8 md:px-10 flex flex-col items-center"
      data-purpose="teams-overview-main"
    >
      <div className="w-full max-w-5xl space-y-4 md:space-y-6">
        <TeamManagement
          tournament={state.tournament}
          tournamentId={tournamentId}
          teams={state.teams}
          repository={repositories.teams}
          onTeamsChanged={handleTeamsChanged}
        />
      </div>
    </main>
  );
}
