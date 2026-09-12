"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { Team } from "@/domain/teams/types";
import { MatchManagement } from "@/features/matches/components/MatchManagement";
import { useWorkspaceRepositories } from "@/screens/tournament-workspace/WorkspaceRepositoryProvider";

type MatchesRouteState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly teams: readonly Team[] }
  | { readonly status: "error" };

export function MatchesRoute({ tournamentId }: { readonly tournamentId: string }) {
  const router = useRouter();
  const repositories = useWorkspaceRepositories();
  const [state, setState] = useState<MatchesRouteState>({ status: "loading" });

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

  const handleMatchOpened = useCallback(
    (matchId: string) => {
      router.push(`/tournaments/${tournamentId}/matches/${matchId}`);
    },
    [router, tournamentId],
  );

  const handleMatchesChanged = useCallback(() => {
    // Refresh not currently necessary since matches manage their own list state
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-slate-400">Loading matches…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-red-500">Failed to load matches dependencies.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 md:py-8 flex flex-col gap-4 md:gap-6">
      <section className="scroll-mt-24 md:scroll-mt-10" id="matches">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-muted" aria-hidden="true">
            04
          </span>
          <p className="eyebrow">Match entry</p>
        </div>
        <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
          Enter match results
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Create matches and log team performance. Standings update automatically
          when you finalize a match.
        </p>
      </section>

      <MatchManagement
        tournamentId={tournamentId}
        teams={state.teams}
        repositories={repositories.matchFeature}
        onMatchesChanged={handleMatchesChanged}
        onMatchOpened={handleMatchOpened}
      />
    </main>
  );
}
