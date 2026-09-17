"use client";

import type { Team } from "@/domain/teams/types";
import type { MatchFeatureDependencies } from "@/features/matches/matchFeatureDependencies";
import { useMatchManagement } from "@/features/matches/useMatchManagement";

import { MatchCurrentCard } from "./MatchCurrentCard";
import { MatchFinalizedList } from "./MatchFinalizedList";
import { MatchesEmptyState } from "./MatchesEmptyState";
import { MatchesPageHeader } from "./MatchesPageHeader";

interface MatchManagementProps {
  readonly tournamentId: string;
  readonly tournamentName?: string;
  readonly teams: readonly Team[];
  readonly repositories: MatchFeatureDependencies;
  readonly onMatchesChanged: () => void;
  readonly onMatchOpened: (matchId: string) => void;
}

export function MatchManagement({
  tournamentId,
  tournamentName,
  teams,
  repositories,
  onMatchesChanged,
  onMatchOpened,
}: MatchManagementProps) {
  const controller = useMatchManagement(
    tournamentId,
    teams,
    repositories,
    onMatchesChanged,
    onMatchOpened,
  );
  const { error, isCreating, isDeletingMatch, isLoading, matches } = controller;

  const draftMatch = matches.find((m) => m.status !== "FINALIZED") ?? null;
  const finalizedMatches = matches.filter((m) => m.status === "FINALIZED");

  const handleCreateMatch = () => {
    void controller.createMatch();
  };

  const handleOpenMatch = (match: Parameters<typeof controller.openMatch>[0]) => {
    void controller.openMatch(match);
  };

  const handleDeleteMatch = (match: Parameters<typeof controller.deleteMatch>[0]) => {
    void controller.deleteMatch(match);
  };

  return (
    <div className="space-y-6">
      {/* Page header: title, count, Add Match CTA */}
      <MatchesPageHeader
        tournamentName={tournamentName}
        matchCount={matches.length}
        isCreating={isCreating}
        isLoading={isLoading}
        showCreateButton={matches.length > 0}
        onCreateMatch={handleCreateMatch}
      />

      {/* Error banner */}
      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Loading skeleton */}
      {isLoading ? (
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center"
          role="status"
          aria-label="Loading matches"
        >
          <p className="text-sm text-slate-400">Loading matches…</p>
        </div>
      ) : matches.length === 0 ? (
        /* Empty state */
        <MatchesEmptyState
          isCreating={isCreating}
          onCreateMatch={handleCreateMatch}
        />
      ) : (
        <>
          {/* Dominant current / draft match card */}
          {draftMatch ? (
            <ul className="list-none p-0 m-0" aria-label="Current match">
              <li className="list-none p-0 m-0">
                <MatchCurrentCard
                  match={draftMatch}
                  isLoading={isLoading}
                  isDeletingMatch={isDeletingMatch}
                  onOpen={handleOpenMatch}
                  onDelete={handleDeleteMatch}
                />
              </li>
            </ul>
          ) : null}

          {/* Finalized matches list */}
          <MatchFinalizedList
            matches={finalizedMatches}
            isDeletingMatch={isDeletingMatch}
            onOpen={handleOpenMatch}
            onDelete={handleDeleteMatch}
          />
        </>
      )}
    </div>
  );
}
