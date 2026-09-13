import React from "react";
import type { TournamentMatch } from "@/domain/matches/types";

export function OverviewProgress({
  matches,
  finalizedMatches,
  onNavigate,
}: {
  readonly matches: readonly TournamentMatch[];
  readonly finalizedMatches: readonly TournamentMatch[];
  readonly onNavigate: (section: string) => void;
}) {
  const percentComplete = matches.length > 0 ? (finalizedMatches.length / matches.length) * 100 : 0;
  
  return (
    <section className="bg-transparent md:bg-white md:border md:border-slate-200 md:rounded-xl md:p-6 md:shadow-sm space-y-2.5 md:space-y-5" data-purpose="tournament-progress">
      {/* Progress Summary Header */}
      <div>
        <div className="flex items-center justify-between px-1 md:px-0 text-sm mb-2">
          <h3 className="text-[11px] md:text-sm font-bold md:font-semibold text-slate-400 md:text-slate-900 uppercase tracking-wider md:tracking-normal md:normal-case">
            Tournament Progress
          </h3>
          <span className="text-xs font-semibold text-slate-600 md:text-slate-500 md:font-tabular">
            {finalizedMatches.length} of {matches.length} Matches Complete
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-slate-200/80 md:bg-slate-100 rounded-full h-1.5 md:h-2 overflow-hidden flex">
          <div 
            className="bg-brand md:bg-emerald-500 h-full md:h-2 rounded-full transition-all duration-300" 
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
      </div>

      {/* Structured Timeline List */}
      <div className="bg-white rounded-2xl md:rounded-lg border border-slate-200/70 md:border-slate-100 shadow-xs md:shadow-none divide-y divide-slate-100 overflow-hidden mt-2 md:mt-0">
        {matches.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">No matches created yet.</div>
        ) : (
          matches.slice(0, 5).map((match) => {
            if (match.status === "FINALIZED") {
              return (
                <div key={match.id} className="p-3 md:px-4 md:py-3 flex items-center justify-between md:bg-white text-xs text-slate-700 hover:bg-slate-50/50 md:hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 md:space-x-3">
                    <span className="w-6 h-6 md:w-5 md:h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      {/* Mobile SVG */}
                      <svg className="md:hidden w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      {/* Desktop SVG */}
                      <svg className="hidden md:block w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </span>
                    <div>
                      <div className="flex items-center gap-2 md:space-x-3">
                        <span className="text-xs md:text-xs font-bold md:font-medium text-slate-900">Match {match.matchNumber}</span>
                        <span className="md:hidden text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Finalized</span>
                      </div>
                      <span className="md:hidden text-[11px] text-slate-400 block">Calculated · {match.name || "Match"}</span>
                    </div>
                  </div>
                  <span className="hidden md:inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">Finalized</span>
                </div>
              );
            }
            
            if (match.status === "DRAFT") {
              return (
                <div key={match.id} className="p-3 md:px-4 md:py-3 flex items-center justify-between bg-brand-50/40 md:bg-orange-50/40 border-l-4 md:border-l-2 border-brand md:border-l-brand-primary text-xs">
                  <div className="flex items-center gap-3 md:space-x-3">
                    <span className="w-6 h-6 md:w-5 md:h-5 rounded-full bg-brand md:bg-orange-100 text-white md:text-brand-primary text-[11px] md:text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {match.matchNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 md:space-x-3">
                        <span className="text-xs md:text-xs font-bold text-slate-900">Match {match.matchNumber}</span>
                        <span className="md:hidden text-[10px] font-bold text-brand bg-brand-100 px-1.5 py-0.5 rounded">Current</span>
                      </div>
                      <span className="md:hidden text-[11px] font-medium text-brand-700 block">Ready to enter results</span>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center space-x-3">
                    <span className="font-medium text-brand-primary">Ready to enter results</span>
                  </div>
                  <button 
                    onClick={() => onNavigate("matches")}
                    className="md:hidden text-xs font-bold text-brand hover:text-brand-hover px-2.5 py-1 bg-white border border-brand/30 rounded-md shadow-xs" 
                    type="button"
                  >
                    Enter
                  </button>
                </div>
              );
            }
            
            // Upcoming
            return (
              <div key={match.id} className="p-3 md:px-4 md:py-3 flex items-center justify-between opacity-70 md:opacity-100 md:bg-white text-xs md:text-slate-400">
                <div className="flex items-center gap-3 md:space-x-3">
                  <span className="w-6 h-6 md:w-5 md:h-5 rounded-full border border-slate-300 text-slate-400 text-[11px] md:text-xs font-medium flex items-center justify-center flex-shrink-0">
                    <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="md:hidden">{match.matchNumber}</span>
                  </span>
                  <div>
                    <div className="flex items-center gap-2 md:space-x-3">
                      <span className="text-xs md:text-xs font-semibold md:font-medium text-slate-700 md:text-slate-600">Match {match.matchNumber}</span>
                      <span className="md:hidden text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Upcoming</span>
                    </div>
                    <span className="md:hidden text-[11px] text-slate-400 block">Scheduled</span>
                  </div>
                </div>
                <span className="md:hidden text-[11px] text-slate-400 font-medium">Pending</span>
                <span className="hidden md:inline-block text-slate-400">Upcoming</span>
              </div>
            );
          })
        )}
        
        {/* Summary row for remaining matches */}
        {matches.length > 5 && (
          <div className="p-2.5 md:px-4 md:py-2.5 text-center bg-slate-50/70 md:bg-slate-50/50">
            <button 
              onClick={() => onNavigate("matches")}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 md:text-slate-400 md:hover:text-slate-600 transition-colors" 
              type="button"
            >
              + {matches.length - 5} more matches scheduled
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
