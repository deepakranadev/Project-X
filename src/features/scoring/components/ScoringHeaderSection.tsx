"use client";

import React from "react";
import Link from "next/link";
import type { Tournament } from "@/domain/tournaments/types";

interface ScoringHeaderSectionProps {
  readonly tournament: Tournament;
  readonly isDirty: boolean;
}

export function ScoringHeaderSection({
  tournament,
  isDirty,
}: ScoringHeaderSectionProps) {
  return (
    <>
      {/* Mobile Header Context */}
      <section className="md:hidden mb-1" data-purpose="mobile-scoring-header">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Scoring</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">Configure placement and finish points</p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              isDirty
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200/70 bg-emerald-50 text-emerald-700"
            }`}
            role="status"
          >
            {isDirty ? "Unsaved" : "Saved"}
          </span>
        </div>
      </section>

      {/* Desktop Breadcrumbs & Context Header */}
      <div className="hidden md:block space-y-1" data-purpose="desktop-scoring-context">
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

      {/* Desktop Scoring Section Title */}
      <div className="hidden md:flex sm:flex-row sm:items-center justify-between gap-4 pt-3 pb-1 border-b border-slate-200/80" data-purpose="desktop-scoring-title-bar">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scoring</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure placement and finish points</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
            isDirty
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200/70 bg-emerald-50 text-emerald-700"
          }`}
          role="status"
        >
          {isDirty ? "Unsaved changes" : "Saved"}
        </span>
      </div>
    </>
  );
}
