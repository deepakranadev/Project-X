"use client";

import React from "react";
import Link from "next/link";
import type { Tournament } from "@/domain/tournaments/types";

interface TeamsHeaderSectionProps {
  readonly tournament: Tournament;
  readonly teamsCount: number;
  readonly onAddTeam: () => void;
  readonly onBulkAdd: () => void;
}

export function TeamsHeaderSection({
  tournament,
  teamsCount,
  onAddTeam,
  onBulkAdd,
}: TeamsHeaderSectionProps) {
  const registeredLabel = `${teamsCount} ${teamsCount === 1 ? "team" : "teams"} registered`;

  return (
    <>
      {/* Mobile Page Context & Action Header */}
      <section className="md:hidden mb-4" data-purpose="mobile-teams-header">
        <div className="flex items-end justify-between mb-3.5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#18181B]">Teams</h2>
            <p className="text-xs text-[#64748B] mt-0.5 font-normal">{registeredLabel}</p>
          </div>
        </div>
        {/* Mobile Action Buttons Area */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onAddTeam}
            className="flex items-center justify-center gap-1.5 bg-[#e05305] hover:bg-[#c94703] active:scale-[0.98] text-white text-xs font-semibold py-2.5 px-3 rounded-lg shadow-sm transition"
            type="button"
          >
            <svg className="w-4 h-4 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Add Team</span>
          </button>
          <button
            onClick={onBulkAdd}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 active:scale-[0.98] text-[#1E293B] border border-gray-200 text-xs font-semibold py-2.5 px-3 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition"
            type="button"
          >
            <svg className="w-3.5 h-3.5 text-gray-500 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Bulk Add</span>
          </button>
        </div>
      </section>

      {/* Desktop Breadcrumbs & Context Header */}
      <div className="hidden md:block space-y-1" data-purpose="desktop-teams-context">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Link className="hover:text-slate-600 transition-colors" href="/">
            Tournaments
          </Link>
          <span>/</span>
          <span className="text-slate-600">{tournament.name}</span>
        </nav>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{tournament.name}</h2>
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

      {/* Desktop Teams Section Header & Action Bar */}
      <div className="hidden md:flex sm:flex-row sm:items-center justify-between gap-4 pt-3 pb-1 border-b border-slate-200/80" data-purpose="desktop-teams-action-bar">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teams</h1>
          <p className="text-sm text-slate-500 mt-0.5">{registeredLabel}</p>
        </div>
        {/* Actions: Bulk Add & Add Team */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBulkAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300"
            type="button"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" x2="12" y1="3" y2="15"></line>
            </svg>
            <span>Bulk Add</span>
          </button>
          <button
            onClick={onAddTeam}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#e05305] hover:bg-[#c94703] rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#e05305]"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
            <span>Add Team</span>
          </button>
        </div>
      </div>
    </>
  );
}
