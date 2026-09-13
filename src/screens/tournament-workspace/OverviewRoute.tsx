"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OverviewSection } from "@/features/tournaments/components/OverviewSection";
import type { GuestTeam } from "@/features/teams/types";
import type { GuestTournament } from "@/features/tournaments/types";
import { useWorkspaceRepositories } from "./WorkspaceRepositoryProvider";

type OverviewRouteState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly tournament: GuestTournament;
      readonly teams: readonly GuestTeam[];
      readonly tournamentLogoUrl: string | null;
      readonly organizerLogoUrl: string | null;
    }
  | { readonly status: "error" };

export function OverviewRoute({ tournamentId }: { readonly tournamentId: string }) {
  const repositories = useWorkspaceRepositories();
  const router = useRouter();
  const [state, setState] = useState<OverviewRouteState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    let tournamentLogoUrl: string | null = null;
    let organizerLogoUrl: string | null = null;

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

        tournamentLogoUrl = tournament.tournamentLogo
          ? URL.createObjectURL(tournament.tournamentLogo.blob)
          : null;
        organizerLogoUrl = tournament.organizerLogo
          ? URL.createObjectURL(tournament.organizerLogo.blob)
          : null;

        setState({
          status: "ready",
          tournament,
          teams,
          tournamentLogoUrl,
          organizerLogoUrl,
        });
      } catch {
        if (active) setState({ status: "error" });
      }
    }

    void load();

    return () => {
      active = false;
      if (tournamentLogoUrl) URL.revokeObjectURL(tournamentLogoUrl);
      if (organizerLogoUrl) URL.revokeObjectURL(organizerLogoUrl);
    };
  }, [repositories.teams, repositories.tournament, tournamentId]);

  if (state.status === "loading") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-slate-400">Loading overview…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-red-500">Failed to load tournament data.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 pt-3 pb-24 md:px-8 md:py-8 md:flex md:justify-center">
      <div className="w-full max-w-4xl space-y-4 md:space-y-6">
        <OverviewSection
          tournament={state.tournament}
          teams={state.teams}
          repositories={repositories.standings}
          refreshVersion={0} // No edits happen on Overview route yet
          tournamentLogoUrl={state.tournamentLogoUrl}
          organizerLogoUrl={state.organizerLogoUrl}
          onNavigate={(section) => router.push(`/tournaments/${tournamentId}/${section}`)}
        />
      </div>
    </main>
  );
}
