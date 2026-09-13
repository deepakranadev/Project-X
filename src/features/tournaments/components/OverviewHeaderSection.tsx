import React from "react";
import Link from "next/link";
import type { Tournament } from "@/domain/tournaments/types";

export function OverviewHeaderSection({
  tournament,
  teamsCount,
  matchesCount,
}: {
  readonly tournament: Tournament;
  readonly teamsCount: number;
  readonly matchesCount: number;
}) {
  return (
    <>
      {/* Mobile-only inline info row (Title is in the top bar) */}
      <div className="md:hidden bg-white rounded-xl px-3 py-2 border border-slate-200/70 shadow-xs flex items-center justify-between text-xs text-slate-600" data-purpose="tournament-summary-strip">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <span className="text-slate-900 font-semibold">{teamsCount}</span> Teams
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <span className="text-slate-900 font-semibold">{matchesCount}</span> Matches
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="text-slate-500 text-[11px] truncate max-w-[80px]">{tournament.game}</span>
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Setup complete</span>
      </div>

      {/* Desktop Tournament Header Section */}
      <section className="hidden md:block space-y-3" data-purpose="tournament-header">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-xs font-medium text-slate-400">
          <Link className="hover:text-slate-600 transition-colors" href="/">Tournaments</Link>
          <span>/</span>
          <span className="text-slate-600">{tournament.name}</span>
        </nav>
        {/* Title Row & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <h1 className="text-2xl lg:text-[28px] font-bold text-slate-900 tracking-tight">{tournament.name}</h1>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#e6f9f0] text-[#059669]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mr-1.5"></span>
              Active
            </span>
          </div>
          {/* Quick Action / Menu */}
          <div className="flex items-center space-x-2">
            <button aria-label="More tournament actions" className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm" type="button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
          </div>
        </div>
        {/* Inline Tournament Summary Strip */}
        <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm" data-purpose="tournament-summary-strip">
          <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            {teamsCount} Teams
          </span>
          <span className="text-slate-300">·</span>
          <span>{matchesCount} Matches</span>
          <span className="text-slate-300">·</span>
          <span>{tournament.game}</span>
          <span className="text-slate-300">·</span>
          <span className="text-emerald-600 font-medium">Setup Complete</span>
        </div>
      </section>
    </>
  );
}
