"use client";

import React from "react";
import type { Tournament } from "@/domain/tournaments/types";
import type { Team } from "@/domain/teams/types";
import type { OverviewState } from "../useOverviewData";

export function OverviewPresentation({
  state,
  tournament,
  teams,
  onNavigate,
}: {
  readonly state: Extract<OverviewState, { status: "ready" }>;
  readonly tournament: Tournament;
  readonly teams: readonly Team[];
  readonly onNavigate: (s: string) => void;
}) {
  const { matches, standingsSnapshot } = state;
  const teamsCount = standingsSnapshot.teams.length;
  
  const draftMatches = matches.filter((m) => m.status === "DRAFT");
  const finalizedMatches = matches.filter((m) => m.status === "FINALIZED");
  const currentMatch = draftMatches.length > 0 ? draftMatches.sort((a, b) => a.matchNumber - b.matchNumber)[0] : null;
  const currentLeader = standingsSnapshot.standings.length > 0 ? standingsSnapshot.standings[0] : null;
  
  return (
    <>
      {/* Mobile-only inline info row */}
      <div className="md:hidden bg-white rounded-xl px-3 py-2 border border-slate-200/70 shadow-xs flex items-center justify-between text-xs text-slate-600" data-purpose="tournament-summary-strip">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <span className="text-slate-900 font-semibold">{teamsCount}</span> Teams
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <span className="text-slate-900 font-semibold">{matches.length}</span> Matches
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="text-slate-500 text-[11px] truncate max-w-[80px]">{tournament.game}</span>
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
          Setup complete
        </span>
      </div>

      {/* Desktop-only inline info row (Matches Stitch Desktop Header) */}
      <div className="hidden md:inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm w-fit" data-purpose="tournament-summary-strip">
        <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          {teamsCount} Teams
        </span>
        <span className="text-slate-300">·</span>
        <span className="">{matches.length} Matches</span>
        <span className="text-slate-300">·</span>
        <span className="">{tournament.game}</span>
        <span className="text-slate-300">·</span>
        <span className="text-emerald-600 font-medium">Setup Complete</span>
      </div>

      {/* Hero Task Card (Next Up) */}
      <section className="bg-white rounded-2xl md:rounded-xl p-4 md:p-6 shadow-sm relative overflow-hidden border border-slate-200/80 md:border-slate-200 md:hover:border-slate-300 transition-all" data-purpose="primary-action-card">
        <div className="md:hidden absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 opacity-50"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 md:space-y-1.5">
            {currentMatch ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="md:hidden flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                    </span>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-brand">Next Up • Action Required</span>
                  </div>
                  <span className="hidden md:block text-xs text-slate-400 font-medium font-tabular">Match {currentMatch.matchNumber} of {matches.length}</span>
                </div>
                <div className="md:mt-0 mt-2">
                  <h2 className="text-2xl font-black md:font-bold text-slate-900 tracking-tight flex flex-col md:flex-row md:items-baseline md:gap-2">
                    Match {currentMatch.matchNumber}
                    <span className="hidden md:inline text-sm font-normal text-slate-500">— Ready for score entry</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 md:mt-0">{teamsCount} teams participating <span className="md:hidden">• Ready for score entry</span></p>
                </div>
              </>
            ) : matches.length > 0 ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="hidden md:block text-xs text-slate-400 font-medium font-tabular">All Matches Finalized</span>
                  <div className="md:hidden flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-brand">Next Match</span>
                  </div>
                </div>
                <div className="md:mt-0 mt-2">
                  <h2 className="text-2xl font-black md:font-bold text-slate-900 tracking-tight flex flex-col md:flex-row md:items-baseline md:gap-2">
                    Next Match
                    <span className="hidden md:inline text-sm font-normal text-slate-500">— Create next match</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 md:mt-0">Create the next match to continue</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <span className="hidden md:block text-xs text-slate-400 font-medium font-tabular">Tournament Setup Complete</span>
                  <div className="md:hidden flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-brand">Ready to begin</span>
                  </div>
                </div>
                <div className="md:mt-0 mt-2">
                  <h2 className="text-2xl font-black md:font-bold text-slate-900 tracking-tight flex flex-col md:flex-row md:items-baseline md:gap-2">
                    No matches yet
                    <span className="hidden md:inline text-sm font-normal text-slate-500">— Create your first match</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 md:mt-0">{teamsCount} teams participating</p>
                </div>
              </>
            )}
          </div>
          <div className="flex-shrink-0 z-10 relative">
            <button 
              onClick={() => onNavigate("matches")}
              className="w-full md:w-auto md:inline-flex py-3.5 md:py-3 px-6 bg-brand hover:bg-brand-hover md:bg-brand-primary md:hover:bg-brand-primary-hover active:scale-[0.99] text-white font-bold md:font-semibold rounded-xl md:rounded-lg text-[14px] md:text-sm tracking-wide md:tracking-normal text-center shadow-xs md:shadow-sm flex items-center justify-center gap-2 transition-all group md:focus:ring-2 md:focus:ring-brand-primary md:focus:ring-offset-2" 
              type="button"
            >
              <span>{currentMatch ? "Go to Matches" : "Create Match"}</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5 md:ml-2 md:transition-none md:group-hover:translate-x-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" className="md:hidden" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" className="hidden md:block" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
            <div className="mt-2 text-center md:hidden">
              <span className="text-[11px] text-slate-400">Scores finalize directly to Overall Standings table</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Progress Section */}
      <section className="bg-white md:border md:border-slate-200 md:rounded-xl md:p-6 md:shadow-sm space-y-2.5 md:space-y-5" data-purpose="tournament-progress">
        <div>
          <div className="flex items-center justify-between px-1 md:px-0 text-sm mb-2">
            <h3 className="text-[11px] md:text-sm font-bold md:font-semibold text-slate-400 md:text-slate-900 uppercase tracking-wider md:tracking-normal md:normal-case">Tournament Progress</h3>
            <span className="text-xs font-semibold text-slate-600 md:text-slate-500 md:font-tabular">
              {finalizedMatches.length} of {matches.length} Matches Complete
            </span>
          </div>
          <div className="w-full bg-slate-200/80 md:bg-slate-100 rounded-full h-1.5 md:h-2 overflow-hidden flex">
            <div className="bg-brand md:bg-emerald-500 h-full md:h-2 rounded-full transition-all duration-300" style={{ width: matches.length ? `${(finalizedMatches.length / matches.length) * 100}%` : "0%" }}></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-lg border border-slate-200/70 md:border-slate-100 shadow-xs md:shadow-none divide-y divide-slate-100 overflow-hidden mt-2">
          {matches.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">No matches created yet.</div>
          ) : (
            matches.slice(0, 5).map((match) => (
              <div key={match.id} className={`p-3 md:px-4 md:py-3 flex items-center justify-between transition-colors ${match.status === "FINALIZED" ? "hover:bg-slate-50/50 md:hover:bg-slate-50/70" : match.status === "DRAFT" ? "bg-brand-50/40 md:bg-orange-50/40 border-l-4 border-brand md:border-l-2 md:border-l-brand-primary" : "opacity-70"}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 md:w-5 md:h-5 rounded-full flex items-center justify-center flex-shrink-0 ${match.status === "FINALIZED" ? "bg-emerald-50 text-emerald-600" : match.status === "DRAFT" ? "bg-brand text-white md:bg-orange-100 md:text-brand-primary font-bold text-[11px] md:text-[10px]" : "border border-slate-300 text-slate-400 text-[11px] md:font-medium"}`}>
                    {match.status === "FINALIZED" ? (
                      <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d={/* SVG path for check in mobile */"M4.5 12.75l6 6 9-13.5"} className="md:hidden" strokeLinecap="round" strokeLinejoin="round"></path><path d={/* SVG path for check in desktop */"M5 13l4 4L19 7"} className="hidden md:block" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    ) : (
                      match.matchNumber
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs text-slate-900 ${match.status === "DRAFT" ? "font-bold" : "font-bold md:font-medium"}`}>Match {match.matchNumber}</span>
                      {match.status === "FINALIZED" && <span className="md:hidden text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">Finalized</span>}
                      {match.status === "DRAFT" && <span className="md:hidden text-[10px] font-bold text-brand bg-brand-100 px-1.5 py-0.2 rounded">Current</span>}
                    </div>
                    {match.status === "FINALIZED" && <span className="md:hidden text-[11px] text-slate-400 block">{teamsCount}/{teamsCount} calculated • {match.name ?? "Match"}</span>}
                    {match.status === "DRAFT" && <span className="md:hidden text-[11px] font-medium text-brand-700 block">Ready to enter results</span>}
                  </div>
                </div>
                {match.status === "FINALIZED" && <span className="hidden md:inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">Finalized</span>}
                {match.status === "DRAFT" && (
                  <>
                    <span className="hidden md:inline-block font-medium text-brand-primary">Ready to enter results</span>
                    <button className="md:hidden text-xs font-bold text-brand hover:text-brand-hover px-2.5 py-1 bg-white border border-brand/30 rounded-md shadow-xs" type="button" onClick={() => onNavigate("matches")}>Enter</button>
                  </>
                )}
              </div>
            ))
          )}
          
          {matches.length > 5 && (
            <div className="p-2.5 md:px-4 md:py-2.5 text-center bg-slate-50/70 md:bg-slate-50/50">
              <span className="text-xs font-medium text-slate-500 md:text-slate-400">
                + {matches.length - 5} more matches scheduled
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Quick Standings Teaser (Current Leader) */}
      <section className="bg-white rounded-xl md:rounded-lg p-3 md:px-5 md:py-3.5 border border-slate-200/70 md:border-slate-200 shadow-xs md:shadow-sm flex items-center justify-between" data-purpose="current-leader-shortcut">
        <div className="flex items-center gap-2 md:space-x-3">
          <svg className="md:hidden w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <div className="hidden md:flex w-7 h-7 rounded bg-amber-50 border border-amber-200 text-amber-600 items-center justify-center text-xs font-bold">#1</div>
          {currentLeader ? (
            <div className="flex items-center">
              <span className="hidden md:inline text-xs text-slate-400 uppercase font-semibold tracking-wider">CURRENT LEADER: </span>
              <span className="md:hidden text-xs text-slate-600 font-medium">Current Leader: </span>
              <span className="text-xs md:text-sm font-bold text-slate-900 md:ml-1 ml-1">{teams.find(t => t.id === currentLeader.teamId)?.name ?? "Unknown"}</span>
              <span className="text-xs md:text-sm font-bold text-slate-900 md:font-bold"> · {currentLeader.totalPoints} pts</span>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Points Table</span>
              <span className="text-sm font-bold text-slate-900 ml-2">No standings yet</span>
            </div>
          )}
        </div>
        <button onClick={() => onNavigate("standings")} className="text-xs font-semibold text-brand md:text-slate-600 hover:underline md:hover:no-underline md:hover:text-brand-primary flex items-center gap-1 md:space-x-1 flex-shrink-0 md:transition-colors" type="button">
          <span className="md:hidden">View Standings</span>
          <span className="hidden md:inline">View Standings →</span>
          <svg className="md:hidden w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
      </section>
    </>
  );
}
