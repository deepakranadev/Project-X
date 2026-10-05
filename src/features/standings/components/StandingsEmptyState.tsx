"use client";

import Link from "next/link";

interface StandingsEmptyStateProps {
  readonly tournamentId: string;
  readonly totalMatchCount: number;
}

export function StandingsEmptyState({
  tournamentId,
  totalMatchCount,
}: StandingsEmptyStateProps) {
  const isDraftOnly = totalMatchCount > 0;

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs space-y-4"
      role="status"
      data-purpose="standings-empty-state"
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      </div>

      <div>
        <p className="text-base font-bold text-slate-900">
          {isDraftOnly
            ? "Only draft matches exist."
            : "No finalized matches yet."}
        </p>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          {isDraftOnly
            ? "Finalize a draft match to add it to the points table."
            : "Create and finalize a match to calculate the points table."}
        </p>
      </div>

      <div>
        <Link
          href={`/tournaments/${tournamentId}/matches`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-colors"
        >
          <span>{isDraftOnly ? "View Matches" : "Go to Matches"}</span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
