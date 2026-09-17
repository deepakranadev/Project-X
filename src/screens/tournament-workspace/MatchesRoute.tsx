"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { Tournament } from "@/domain/tournaments/types";
import type { Team } from "@/domain/teams/types";
import { MatchManagement } from "@/features/matches/components/MatchManagement";
import { useWorkspaceRepositories } from "@/screens/tournament-workspace/WorkspaceRepositoryProvider";
import { useWorkspaceCounts } from "@/screens/tournament-workspace/WorkspaceCountContext";

type MatchesRouteState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly tournament: Tournament;
      readonly teams: readonly Team[];
    }
  | { readonly status: "error" };

export function MatchesRoute({ tournamentId }: { readonly tournamentId: string }) {
  const router = useRouter();
  const repositories = useWorkspaceRepositories();
  const { setMatchesCount } = useWorkspaceCounts();
  const [state, setState] = useState<MatchesRouteState>({ status: "loading" });

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

  const handleMatchOpened = useCallback(
    (matchId: string) => {
      router.push(`/tournaments/${tournamentId}/matches/${matchId}`);
    },
    [router, tournamentId],
  );

  const handleMatchesChanged = useCallback(async () => {
    try {
      const matches = await repositories.matchFeature.matches.listMatchesByTournament(tournamentId);
      setMatchesCount(matches.length);
    } catch {
      // ignore — count will be refreshed on next render
    }
  }, [repositories.matchFeature.matches, tournamentId, setMatchesCount]);

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
    <main
      className="w-full flex-1 px-4 pt-4 pb-24 md:py-8 md:px-10 flex flex-col items-center"
      data-purpose="matches-main"
    >
      <div className="w-full max-w-5xl space-y-4 md:space-y-6">
        <MatchManagement
          tournamentId={tournamentId}
          tournamentName={state.tournament.name}
          teams={state.teams}
          repositories={repositories.matchFeature}
          onMatchesChanged={() => { void handleMatchesChanged(); }}
          onMatchOpened={handleMatchOpened}
        />
      </div>
    </main>
  );
}
