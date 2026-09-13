"use client";

import React from "react";

interface ScoringSaveCardProps {
  readonly isSaving: boolean;
  readonly isDirty: boolean;
  readonly saved: boolean;
  readonly saveError: string | null;
  readonly generalIssues: readonly { readonly field: string; readonly message: string }[];
}

export function ScoringSaveCard({
  isSaving,
  isDirty,
  saved,
  saveError,
  generalIssues,
}: ScoringSaveCardProps) {
  return (
    <div
      className="bg-white rounded-2xl md:rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4"
      data-purpose="save-action-container"
    >
      <button
        type="submit"
        disabled={isSaving || !isDirty}
        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] active:bg-[#9a3412] text-white font-semibold text-sm shadow-sm shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isSaving ? "Saving scoring…" : "Save Scoring Configuration"}</span>
        <svg
          className="w-4 h-4 stroke-[2.2]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="text-center">
        <p className="text-xs text-slate-500">
          Standings are calculated from the configured scoring rules.
        </p>
      </div>

      {saved && (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-center text-xs font-bold text-emerald-800"
          role="status"
        >
          Scoring saved
        </div>
      )}

      {saveError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-medium"
          role="alert"
        >
          {saveError}
        </div>
      )}

      {generalIssues.length > 0 && (
        <ul
          className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-medium"
          role="alert"
        >
          {generalIssues.map((issue) => (
            <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
