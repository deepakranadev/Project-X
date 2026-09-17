"use client";

import type { TournamentMatch } from "@/domain/matches/types";
import { MatchActionMenu } from "./MatchActionMenu";

interface MatchCurrentCardProps {
  readonly match: TournamentMatch;
  readonly isLoading: boolean;
  readonly isDeletingMatch: boolean;
  readonly onOpen: (match: TournamentMatch) => void;
  readonly onDelete: (match: TournamentMatch) => void;
}

export function MatchCurrentCard({
  match,
  isLoading,
  isDeletingMatch,
  onOpen,
  onDelete,
}: MatchCurrentCardProps) {
  const displayName = match.name ?? `Match ${match.matchNumber}`;

  return (
    <section
      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden"
      aria-labelledby="current-match-heading"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-3.5 flex-1 min-w-0">
          {/* Label & status */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Current
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
              Draft
            </span>
          </div>

          {/* Title */}
          <div>
            <h2
              id="current-match-heading"
              className="text-2xl font-bold tracking-tight text-slate-900 truncate"
            >
              {displayName}
            </h2>
            {match.name ? (
              <p className="text-sm text-slate-500 mt-0.5">
                Match {match.matchNumber}
              </p>
            ) : (
              <p className="text-sm text-slate-500 mt-0.5">
                Results in progress
              </p>
            )}
          </div>
        </div>

        {/* Actions row: CTA + ellipsis overflow menu */}
        <div className="flex items-center gap-3 md:self-center pt-2 md:pt-0 shrink-0">
          <button
            type="button"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#e05305] hover:bg-[#c94703] text-white text-base font-semibold rounded-lg shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-[#e05305] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            onClick={() => onOpen(match)}
            aria-label={`Open Match ${match.matchNumber}`}
          >
            <span>Continue Entry</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>

          <MatchActionMenu
            match={match}
            isDeletingMatch={isDeletingMatch}
            onDelete={onDelete}
            triggerClassName="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 flex-shrink-0"
          />
        </div>
      </div>
    </section>
  );
}
