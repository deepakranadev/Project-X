import React from "react";
import type { TournamentMatch } from "@/domain/matches/types";

export function OverviewNextAction({
  currentMatch,
  matchesCount,
  teamsCount,
  onNavigate,
}: {
  readonly currentMatch: TournamentMatch | null;
  readonly matchesCount: number;
  readonly teamsCount: number;
  readonly onNavigate: (section: string) => void;
}) {
  return (
    <>
      {/* Mobile Next Action Card */}
      <section className="md:hidden bg-white rounded-2xl p-4 shadow-sm relative overflow-hidden border-slate-200/80 border" data-purpose="next-action-card">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 opacity-50"></div>
        <div className="flex items-start justify-between mb-2">
          {currentMatch ? (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
              </span>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-brand">Next Up · Action Required</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Status</span>
            </div>
          )}
        </div>
        <div className="mb-3.5">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
            {currentMatch ? `Match ${currentMatch.matchNumber}` : matchesCount > 0 ? "All Matches Finalized" : "No matches yet"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentMatch ? `Ready for score entry · ${teamsCount} Teams participating` : matchesCount > 0 ? "Tournament is complete" : `${teamsCount} Teams participating`}
          </p>
        </div>
        <button 
          onClick={() => onNavigate("matches")}
          className="w-full py-3.5 bg-[#E05305] hover:bg-[#C94703] active:scale-[0.99] text-white font-bold rounded-xl text-center shadow-xs flex items-center justify-center gap-2 transition-all group" 
          type="button"
        >
          <span className="text-[14px] tracking-wide">{currentMatch ? "Enter Match Results" : "Go to Matches"}</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
        {currentMatch && (
          <div className="mt-2 text-center">
            <span className="text-[11px] text-slate-400">Scores finalize directly to Overall Standings table</span>
          </div>
        )}
      </section>

      {/* Desktop Next Action Card */}
      <section className="hidden md:block bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 transition-all" data-purpose="primary-action-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            {currentMatch ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium font-tabular">Match {currentMatch.matchNumber} of {matchesCount}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Match {currentMatch.matchNumber}
                  <span className="text-sm font-normal text-slate-500">— Ready for score entry</span>
                </h2>
              </>
            ) : matchesCount > 0 ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium font-tabular">All Matches Finalized</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Next Match
                  <span className="text-sm font-normal text-slate-500">— Create next match</span>
                </h2>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium font-tabular">Tournament Setup Complete</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  No matches yet
                  <span className="text-sm font-normal text-slate-500">— Create your first match</span>
                </h2>
              </>
            )}
            <p className="text-xs text-slate-500">{teamsCount} teams participating</p>
          </div>
          <div className="flex-shrink-0">
            <button 
              onClick={() => onNavigate("matches")}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand-primary hover:bg-[#d9480f] text-white font-semibold text-sm shadow-sm transition-colors focus:ring-2 focus:ring-brand-primary focus:ring-offset-2" 
              type="button"
            >
              <span>{currentMatch ? "Enter Match Results" : "Go to Matches"}</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
