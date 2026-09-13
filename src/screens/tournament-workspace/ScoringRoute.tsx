"use client";

import { useEffect, useState, useCallback } from "react";

import { ScoringConfiguration } from "@/features/scoring/components/ScoringConfiguration";
import type { GuestTournament } from "@/features/tournaments/types";
import { useWorkspaceRepositories } from "./WorkspaceRepositoryProvider";

type ScoringRouteState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly tournament: GuestTournament }
  | { readonly status: "error" };

export function ScoringRoute({ tournamentId }: { readonly tournamentId: string }) {
  const repositories = useWorkspaceRepositories();
  const [state, setState] = useState<ScoringRouteState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const tournament = await repositories.tournament.getTournament(tournamentId);
        if (!active) return;
        if (!tournament) {
          setState({ status: "error" });
          return;
        }
        setState({ status: "ready", tournament });
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [repositories.tournament, tournamentId]);

  const handleSaved = useCallback((tournament: GuestTournament) => {
    setState({ status: "ready", tournament });
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-slate-400">Loading scoring configuration…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-red-500">Failed to load tournament.</p>
      </div>
    );
  }

  return (
    <main
      className="w-full flex-1 px-4 pt-4 pb-24 md:py-8 md:px-10 flex flex-col items-center"
      data-purpose="scoring-main"
    >
      <div className="w-full max-w-5xl space-y-4 md:space-y-6">
        <ScoringConfiguration
          tournament={state.tournament}
          initialConfig={state.tournament.scoringConfig}
          tournamentId={tournamentId}
          repository={repositories.tournament}
          onSaved={handleSaved}
        />
      </div>
    </main>
  );
}
