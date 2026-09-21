"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { Tournament } from "@/domain/tournaments/types";
import type { TournamentMatch } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";
import { MatchEntry } from "@/features/matches/components/MatchEntry";
import { useWorkspaceRepositories } from "@/screens/tournament-workspace/WorkspaceRepositoryProvider";

type MatchEntryRouteState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly tournament?: Tournament | null;
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

        const tournamentPromise = repositories.tournament?.getTournament
          ? repositories.tournament.getTournament(tournamentId)
          : Promise.resolve(null);

        const [tournament, teams, match] = await Promise.all([
          tournamentPromise,
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

        setState({ status: "ready", tournament, teams, match });
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
  }, [
    matchId,
    repositories.matchFeature.matches,
    repositories.matchFeature.writeCoordinators,
    repositories.teams,
    repositories.tournament,
    tournamentId,
  ]);

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
      <div className="flex-1 grid place-items-center" data-purpose="match-entry-loading">
        <p className="text-sm text-slate-400 font-medium">Loading match…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex-1 grid place-items-center" data-purpose="match-entry-error">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-600">{state.message}</p>
          <button
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={handleClose}
          >
            Return to matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <main
      className="w-full flex-1 px-4 pt-4 pb-24 md:py-8 md:px-10 flex flex-col items-center"
      data-purpose="match-entry-main"
    >
      <div className="w-full max-w-5xl space-y-4 md:space-y-6">
        <MatchEntry
          key={state.match.id}
          lifecycleRepository={repositories.matchFeature.lifecycle}
          match={state.match}
          resultRepository={repositories.matchFeature.results}
          teams={state.teams}
          tournamentName={state.tournament?.name}
          writeCoordinators={repositories.matchFeature.writeCoordinators}
          onClose={handleClose}
          onMatchChange={handleMatchChange}
        />
      </div>
    </main>
  );
}
