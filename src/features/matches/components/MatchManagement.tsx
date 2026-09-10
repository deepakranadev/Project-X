"use client";

import type { Team } from "@/domain/teams/types";
import type { MatchFeatureRepositories } from "@/features/matches/matchFeatureRepositories";
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
  readonly repositories: MatchFeatureRepositories;
  readonly onMatchesChanged: () => void;
}

export function MatchManagement({
  tournamentId,
  teams,
  repositories,
  onMatchesChanged,
}: MatchManagementProps) {
  const controller = useMatchManagement(
    tournamentId,
    teams,
    repositories,
    onMatchesChanged,
  );
  const { activeMatch, error, isCreating, isDeletingMatch, isLoading, matches } = controller;

  return (
    <section className="mt-10 scroll-mt-4 sm:mt-14" id="matches">
      <p className="eyebrow">04 · Matches</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">Enter match results</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Create a match and enter every team’s placement and finishes in one pass.
          </p>
        </div>
        <button
          className="primary-action disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={isCreating || isLoading}
          onClick={() => void controller.createMatch()}
        >
          {isCreating ? "Creating…" : "Create Match"}
        </button>
      </div>


      {error ? <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300" role="alert">{error}</p> : null}

      <div className="panel mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-4 sm:px-6">
          <h3 className="text-xs font-black tracking-[0.18em] text-slate-300">MATCHES</h3>
          <span className="text-sm font-black text-lime-300">{matches.length}</span>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-slate-400" role="status">Loading matches…</p>
        ) : matches.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-bold text-white">No matches yet.</p>
            <p className="mt-2 text-sm text-slate-400">Create Match 1 when the roster is ready.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/6">
            {matches.map((match) => (
              <li className="flex items-center gap-3 px-4 py-3 sm:px-6" key={match.id}>
                <button
                  className="min-h-11 min-w-0 flex-1 text-left"
                  type="button"
                  aria-label={`Open Match ${match.matchNumber}`}
                  onClick={() => void controller.openMatch(match)}
                >
                  <span className="block truncate text-sm font-black text-white">
                    {match.name || `Match ${match.matchNumber}`}
                  </span>
                  {match.name ? <span className="mt-0.5 block text-xs text-slate-500">Match {match.matchNumber}</span> : null}
                </button>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${match.status === "FINALIZED" ? "bg-lime-300/10 text-lime-200" : "bg-amber-300/10 text-amber-200"}`}>
                  {match.status === "FINALIZED" ? "Finalized" : "Draft"}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="min-h-11 rounded-lg px-2 text-xs font-bold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
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
            onClose={controller.closeActiveMatch}
            onMatchChange={controller.handleMatchChange}
          />
        </div>
      ) : null}
    </section>
  );
}
