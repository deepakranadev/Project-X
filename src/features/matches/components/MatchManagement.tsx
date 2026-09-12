"use client";

import type { Team } from "@/domain/teams/types";
import type { MatchFeatureDependencies } from "@/features/matches/matchFeatureDependencies";
import { useMatchManagement } from "@/features/matches/useMatchManagement";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

import { MatchEntry } from "./MatchEntry";

interface MatchManagementProps {
  readonly tournamentId: string;
  readonly teams: readonly Team[];
  readonly repositories: MatchFeatureDependencies;
  readonly onMatchesChanged: () => void;
  readonly onMatchOpened?: (matchId: string) => void;
}

export function MatchManagement({
  tournamentId,
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
  const { activeMatch, error, isCreating, isDeletingMatch, isLoading, matches } = controller;

  return (
    <section className="mt-8 scroll-mt-24 md:scroll-mt-10 sm:mt-12" id="matches">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-muted" aria-hidden="true">
          04
        </span>
        <p className="eyebrow">Match entry</p>
      </div>
      
      {/* Header & CTA Area */}
      <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">Record matches</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Create a match and enter every team’s placement and finishes in one pass.
          </p>
        </div>
        
        {/* Dynamic CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {matches.some(m => m.status !== "FINALIZED") ? (
            <>
              <button
                className="secondary-action disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={isCreating || isLoading}
                onClick={() => void controller.createMatch()}
              >
                Create Match
              </button>
              <button
                className="primary-action disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={isLoading}
                onClick={() => {
                  const draft = matches.find(m => m.status !== "FINALIZED");
                  if (draft) void controller.openMatch(draft);
                }}
              >
                Continue Entry &rarr;
              </button>
            </>
          ) : (
            <button
              className="primary-action disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={isCreating || isLoading}
              onClick={() => void controller.createMatch()}
            >
              {isCreating ? "Creating…" : "Create Match"}
            </button>
          )}
        </div>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p> : null}

      <div className="panel mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
          <h3 className="text-xs font-black tracking-[0.18em] text-muted-foreground">MATCHES</h3>
          <span className="text-xs font-bold text-foreground bg-surface-raised px-2 py-0.5 rounded-full border border-border">{matches.length} matches</span>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-muted-foreground bg-background" role="status">Loading matches…</p>
        ) : matches.length === 0 ? (
          <div className="p-6 text-center bg-background">
            <p className="text-sm font-bold text-foreground">No matches yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Create Match 1 when the roster is ready.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border bg-background">
            {matches.map((match) => (
              <li className="flex items-center gap-3 px-4 py-2.5 sm:px-6 hover:bg-surface-raised/50 transition-colors" key={match.id}>
                <button
                  className="min-h-10 min-w-0 flex-1 text-left"
                  type="button"
                  aria-label={`Open Match ${match.matchNumber}`}
                  onClick={() => void controller.openMatch(match)}
                >
                  <span className="block truncate text-sm font-bold text-foreground">
                    {match.name || `Match ${match.matchNumber}`}
                  </span>
                  {match.name ? <span className="block text-[11px] font-semibold text-muted-foreground">Match {match.matchNumber}</span> : null}
                </button>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold ${match.status === "FINALIZED" ? "bg-surface-raised border-border text-muted-foreground" : "bg-foreground text-background border-foreground"}`}>
                  {match.status === "FINALIZED" ? "Finalized" : "Draft"}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="min-h-10 rounded-md px-2 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                      type="button"
                      aria-label={`Delete Match ${match.matchNumber}`}
                      disabled={isDeletingMatch}
                    >
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Match {match.matchNumber}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Its saved result draft will also be removed. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        type="button"
                        onClick={() => void controller.deleteMatch(match)}
                      >
                        Delete Match
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </div>

      {activeMatch ? (
        <div className="scroll-mt-4" id="match-editor">
          <MatchEntry
            key={activeMatch.id}
            match={activeMatch}
            teams={teams}
            lifecycleRepository={repositories.lifecycle}
            resultRepository={repositories.results}
            writeCoordinators={repositories.writeCoordinators}
            onClose={controller.closeActiveMatch}
            onMatchChange={controller.handleMatchChange}
          />
        </div>
      ) : null}
    </section>
  );
}
