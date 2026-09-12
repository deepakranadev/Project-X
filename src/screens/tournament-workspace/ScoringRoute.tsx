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
    return () => { active = false; };
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
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 md:py-8 flex flex-col gap-4 md:gap-6">
      <ScoringConfiguration
        initialConfig={state.tournament.scoringConfig}
        tournamentId={tournamentId}
        repository={repositories.tournament}
        onSaved={handleSaved}
      />
    </main>
  );
}
