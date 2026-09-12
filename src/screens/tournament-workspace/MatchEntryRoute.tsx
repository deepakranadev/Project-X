"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { TournamentMatch } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";
import { MatchEntry } from "@/features/matches/components/MatchEntry";
import { useWorkspaceRepositories } from "@/screens/tournament-workspace/WorkspaceRepositoryProvider";

type MatchEntryRouteState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly teams: readonly Team[];
      readonly match: TournamentMatch;
    }
  | { readonly status: "error"; readonly message: string };

export function MatchEntryRoute({
  tournamentId,
  matchId,
}: {
  readonly tournamentId: string;
  readonly matchId: string;
}) {
  const router = useRouter();
  const repositories = useWorkspaceRepositories();
  const [state, setState] = useState<MatchEntryRouteState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const coordinator = repositories.matchFeature.writeCoordinators.getCoordinator(matchId);
        await coordinator.whenIdle();

        if (!active) return;

        const [teams, match] = await Promise.all([
          repositories.teams.listTeamsByTournament(tournamentId),
          repositories.matchFeature.matches.getMatch(tournamentId, matchId),
        ]);

        if (!active) return;

        if (!match) {
          setState({ status: "error", message: "Match not found." });
          return;
        }

        if (match.tournamentId !== tournamentId) {
          setState({ status: "error", message: "Match belongs to a different tournament." });
          return;
        }

        setState({ status: "ready", teams, match });
      } catch {
        if (active) {
          setState({ status: "error", message: "Failed to load match." });
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [matchId, repositories.matchFeature.matches, repositories.matchFeature.writeCoordinators, repositories.teams, tournamentId]);

  const handleClose = useCallback(() => {
    router.push(`/tournaments/${tournamentId}/matches`);
  }, [router, tournamentId]);

  const handleMatchChange = useCallback((updatedMatch: TournamentMatch) => {
    setState((current) =>
      current.status === "ready" ? { ...current, match: updatedMatch } : current,
    );
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-slate-400">Loading match…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm text-red-500">{state.message}</p>
        <button className="mt-4 text-sm underline" onClick={handleClose}>
          Return to matches
        </button>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 md:py-8 flex flex-col gap-4 md:gap-6">
      <MatchEntry
        key={state.match.id}
        lifecycleRepository={repositories.matchFeature.lifecycle}
        match={state.match}
        resultRepository={repositories.matchFeature.results}
        teams={state.teams}
        writeCoordinators={repositories.matchFeature.writeCoordinators}
        onClose={handleClose}
        onMatchChange={handleMatchChange}
      />
    </main>
  );
}
