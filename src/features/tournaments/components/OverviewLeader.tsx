import React from "react";
import type { Team } from "@/domain/teams/types";
import type { TournamentStanding } from "@/domain/scoring/types";

export function OverviewLeader({
  currentLeader,
  teams,
  onNavigate,
}: {
  readonly currentLeader: TournamentStanding | null;
  readonly teams: readonly Team[];
  readonly onNavigate: (section: string) => void;
}) {
  const leaderName = currentLeader 
    ? (teams.find(t => t.id === currentLeader.teamId)?.name ?? "Unknown") 
    : "";
  
  return (
    <>
      {/* Mobile Leader */}
      <section className="md:hidden bg-white rounded-xl p-3 border border-slate-200/70 shadow-xs flex items-center justify-between" data-purpose="quick-standings-link">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          {currentLeader ? (
            <span className="text-xs text-slate-600 font-medium">Current Leader: <span className="font-bold text-slate-900">{leaderName}</span> · {currentLeader.totalPoints} pts</span>
          ) : (
            <span className="text-xs text-slate-600 font-medium">Standings: <span className="font-bold text-slate-900">No matches yet</span></span>
          )}
        </div>
        <button onClick={() => onNavigate("standings")} className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 flex-shrink-0" type="button">
          <span className="">View Standings</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
      </section>

      {/* Desktop Leader */}
      <footer className="hidden md:flex bg-white border border-slate-200 rounded-lg px-5 py-3.5 items-center justify-between shadow-sm" data-purpose="current-leader-shortcut">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-xs font-bold">#1</div>
          <div>
            {currentLeader ? (
              <>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">CURRENT LEADER: </span>
                <span className="text-sm font-bold text-slate-900 ml-1">{leaderName} · {currentLeader.totalPoints} pts</span>
              </>
            ) : (
              <>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">POINTS TABLE: </span>
                <span className="text-sm font-bold text-slate-900 ml-1">No matches yet</span>
              </>
            )}
          </div>
        </div>
        <button onClick={() => onNavigate("standings")} className="text-xs font-semibold text-slate-600 hover:text-brand-primary flex items-center space-x-1 transition-colors" type="button">
          <span className="">View Standings →</span>
        </button>
      </footer>
    </>
  );
}
