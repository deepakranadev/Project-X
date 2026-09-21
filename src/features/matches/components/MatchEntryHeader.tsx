"use client";

import Link from "next/link";
import { memo } from "react";

import type { TournamentMatch } from "@/domain/matches/types";
import type { MatchDraftController } from "@/features/matches/useMatchDraftState";
import type { MatchPersistenceController } from "@/features/matches/useMatchPersistence";

interface MatchEntryHeaderProps {
  readonly tournamentId: string;
  readonly tournamentName?: string;
  readonly match: TournamentMatch;
  readonly draft: MatchDraftController;
  readonly persistence: MatchPersistenceController;
}

export const MatchEntryHeader = memo(function MatchEntryHeader({
  tournamentId,
  tournamentName = "Tournament",
  match,
  draft,
  persistence,
}: MatchEntryHeaderProps) {
  const isFinalized = match.status === "FINALIZED";

  return (
    <div className="space-y-4">
      {/* Breadcrumb context bar */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center justify-between text-xs font-semibold text-slate-500"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href={`/tournaments/${tournamentId}/overview`}
            className="hover:text-slate-900 transition-colors"
          >
            Tournaments
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            href={`/tournaments/${tournamentId}/matches`}
            className="hover:text-slate-900 transition-colors truncate max-w-[140px] sm:max-w-[220px]"
          >
            {tournamentName}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">Match {match.matchNumber}</span>
          <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
      </nav>

      {/* Main card header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#e05305]/20"
          aria-label="Close"
          disabled={persistence.explicitAction !== null}
          onClick={() => void persistence.close()}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Match {match.matchNumber}
            </h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                isFinalized
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {isFinalized ? "Finalized" : "Draft"}
            </span>
            {/* Save state badge */}
            <span
              role="status"
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                draft.saveState === "saving"
                  ? "border-slate-200 bg-slate-50 text-slate-600"
                  : draft.saveState === "saved" || (!draft.isDirty && !draft.isLoading)
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : draft.isDirty
                      ? "border-amber-100 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  draft.saveState === "saving"
                    ? "bg-amber-500 animate-pulse"
                    : draft.saveState === "saved" || (!draft.isDirty && !draft.isLoading)
                      ? "bg-emerald-500"
                      : draft.isDirty
                        ? "bg-amber-500"
                        : "bg-slate-400"
                }`}
              />
              {draft.saveState === "saving"
                ? "Saving…"
                : draft.saveState === "saved"
                  ? "Saved"
                  : draft.isDirty
                    ? "Changes waiting to save"
                    : "Saved"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{tournamentName}</p>
        </div>
      </div>
    </div>
  );
});
