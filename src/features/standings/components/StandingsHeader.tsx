"use client";

import Link from "next/link";

interface StandingsHeaderProps {
  readonly tournamentName: string;
  readonly finalizedMatchCount: number;
  readonly totalMatchCount: number;
  readonly teamsCount: number;
  readonly onExport: () => void;
}

export function StandingsHeader({
  tournamentName,
  finalizedMatchCount,
  totalMatchCount,
  teamsCount,
  onExport,
}: StandingsHeaderProps) {
  const subtitle =
    finalizedMatchCount > 0
      ? `Updated after Match ${finalizedMatchCount}`
      : totalMatchCount > 0
        ? "Only draft matches exist"
        : "No finalized matches yet";

  return (
    <div className="space-y-4">
      {/* Desktop Breadcrumbs & Context Header */}
      <div className="hidden md:block space-y-1" data-purpose="desktop-standings-context">
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active
            </span>
          </div>
          <button
            aria-label="Tournament options"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Tournament Settings"
            type="button"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1.75"></circle>
              <circle cx="19" cy="12" r="1.75"></circle>
              <circle cx="5" cy="12" r="1.75"></circle>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Standings Title Bar (Desktop & Mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Overall Standings
            </h1>
            {finalizedMatchCount > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-50 text-brand-primary border border-orange-200/60">
                {finalizedMatchCount === 1 ? "1 finalized match" : `${finalizedMatchCount} finalized matches`}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Export Points Table CTA */}
          <button
            type="button"
            onClick={onExport}
            disabled={finalizedMatchCount === 0}
            data-action="export-points-table-desktop"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-[#c94700] text-white text-sm font-bold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Export Points Table</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Context Summary Bar */}
      <div className="sm:hidden pt-1 pb-1 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-brand-primary tabular-nums">
              {teamsCount}/{teamsCount}
            </span>
            <span className="text-slate-500 font-medium">Teams Calculated</span>
          </div>
          <div className="text-slate-500 font-medium">
            <span>Total Matches: </span>
            <span className="font-bold text-slate-800 tabular-nums">
              {finalizedMatchCount} of {totalMatchCount || finalizedMatchCount || 1}
            </span>
          </div>
        </div>
        <div className="w-full h-1 bg-slate-200/70 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary transition-all duration-300"
            style={{
              width: totalMatchCount > 0 ? `${Math.min(100, Math.round((finalizedMatchCount / totalMatchCount) * 100))}%` : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
