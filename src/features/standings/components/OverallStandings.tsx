"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import type { Tournament } from "@/domain/tournaments/types";
import {
  useOverallStandings,
  type StandingsRepositories,
} from "@/features/standings/useOverallStandings";
import type { GuestTeam } from "@/features/teams/types";

import { StandingsEmptyState } from "./StandingsEmptyState";
import { StandingsHeader } from "./StandingsHeader";
import { StandingsPublishingActions } from "./StandingsPublishingActions";
import { StandingsTable } from "./StandingsTable";
import { StandingsTopThree } from "./StandingsTopThree";

interface OverallStandingsProps {
  readonly tournament: Tournament;
  readonly teams: readonly GuestTeam[];
  readonly repositories: StandingsRepositories;
  readonly refreshVersion?: number;
}

export function OverallStandings({
  tournament,
  teams,
  repositories,
  refreshVersion = 0,
}: OverallStandingsProps) {
  const state = useOverallStandings(
    tournament,
    teams,
    repositories,
    refreshVersion,
  );

  const handleExport = useCallback(() => {
    toast.info("Points table export will be available in a future release.");
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex-1 grid place-items-center py-16" role="status">
        <p className="text-sm text-slate-400">Calculating standings…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center"
        role="alert"
      >
        <p className="text-sm font-bold text-red-700">
          Standings could not be calculated.
        </p>
        <p className="mt-1 text-xs text-red-600">
          Reopen the affected finalized match and correct its result rows, then
          finalize it again.
        </p>
      </div>
    );
  }

  const { snapshot } = state;
  const teamById = new Map(snapshot.teams.map((team) => [team.id, team]));
  const hasFinalized = snapshot.finalizedMatchCount > 0;

  return (
    <div className="space-y-4 md:space-y-5" data-purpose="overall-standings-container">
      {/* Header with breadcrumbs, title, match counts, and export button */}
      <StandingsHeader
        tournamentName={tournament.name}
        finalizedMatchCount={snapshot.finalizedMatchCount}
        totalMatchCount={snapshot.totalMatchCount}
        teamsCount={teams.length}
        onExport={handleExport}
      />

      {/* Main Content Area */}
      {!hasFinalized ? (
        <StandingsEmptyState
          tournamentId={tournament.id}
          totalMatchCount={snapshot.totalMatchCount}
        />
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <StandingsTopThree
            standings={snapshot.standings}
            teamById={teamById}
          />

          {/* Full Leaderboard Table */}
          <StandingsTable
            standings={snapshot.standings}
            teamById={teamById}
            finalizedMatchCount={snapshot.finalizedMatchCount}
          />

          {/* Mobile Bottom Publishing Action Bar */}
          <StandingsPublishingActions
            finalizedMatchCount={snapshot.finalizedMatchCount}
            onExport={handleExport}
          />
        </>
      )}
    </div>
  );
}
