"use client";

import Link from "next/link";

interface MatchesPageHeaderProps {
  readonly tournamentName?: string;
  readonly matchCount: number;
  readonly isCreating: boolean;
  readonly isLoading: boolean;
  readonly showCreateButton: boolean;
  readonly onCreateMatch: () => void;
}

export function MatchesPageHeader({
  tournamentName,
  matchCount,
  isCreating,
  isLoading,
  showCreateButton,
  onCreateMatch,
}: MatchesPageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Desktop Breadcrumbs & Context Header */}
      {tournamentName ? (
        <div className="hidden md:block space-y-1" data-purpose="desktop-matches-context">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Link className="hover:text-slate-600 transition-colors" href="/">
              Tournaments
            </Link>
            <span>/</span>
            <span className="text-slate-600">{tournamentName}</span>
          </nav>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{tournamentName}</h2>
              {/* Active Status Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>
            {/* Quick Options Button */}
            <button
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Tournament Settings"
              type="button"
              aria-label="Tournament options"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1.75"></circle>
                <circle cx="19" cy="12" r="1.75"></circle>
                <circle cx="5" cy="12" r="1.75"></circle>
              </svg>
            </button>
          </div>
        </div>
      ) : null}

      {/* Matches Section Title Bar */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Matches
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {matchCount === 1 ? "1 match" : `${matchCount} matches`}
          </p>
        </div>
        {showCreateButton ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCreating || isLoading}
            onClick={onCreateMatch}
            aria-label="Create Match"
          >
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {isCreating ? "Creating…" : "Create Match"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
