"use client";

import { useEffect, useState, useCallback } from "react";

import { TeamManagement } from "@/features/teams/components/TeamManagement";
import type { GuestTeam } from "@/features/teams/types";
import { useWorkspaceRepositories } from "./WorkspaceRepositoryProvider";

type TeamsRouteState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly teams: readonly GuestTeam[] }
  | { readonly status: "error" };

export function TeamsRoute({ tournamentId }: { readonly tournamentId: string }) {
  const repositories = useWorkspaceRepositories();
  const [state, setState] = useState<TeamsRouteState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const teams = await repositories.teams.listTeamsByTournament(tournamentId);
        if (active) setState({ status: "ready", teams });
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void load();
    return () => { active = false; };
  }, [repositories.teams, tournamentId]);

  const handleTeamsChanged = useCallback((teams: readonly GuestTeam[]) => {
    setState({ status: "ready", teams });
  }, []);

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
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 md:py-8 flex flex-col gap-4 md:gap-6">
      <section className="scroll-mt-24 md:scroll-mt-10" id="teams">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-muted" aria-hidden="true">
            02
          </span>
          <p className="eyebrow">Team setup</p>
        </div>
        <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
          Build the roster
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Add the full lineup in one paste. You can edit names, slots, and
          logos at any time.
        </p>
      </section>

      <TeamManagement
        tournamentId={tournamentId}
        teams={state.teams}
        repository={repositories.teams}
        onTeamsChanged={handleTeamsChanged}
      />
    </main>
  );
}
