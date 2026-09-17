"use client";

import type { TournamentMatch } from "@/domain/matches/types";
import { MatchActionMenu } from "./MatchActionMenu";

interface MatchFinalizedListProps {
  readonly matches: readonly TournamentMatch[];
  readonly isDeletingMatch: boolean;
  readonly onOpen: (match: TournamentMatch) => void;
  readonly onDelete: (match: TournamentMatch) => void;
}

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const MobileCheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export function MatchFinalizedList({ matches, isDeletingMatch, onOpen, onDelete }: MatchFinalizedListProps) {
  if (matches.length === 0) return null;

  return (
    <section className="space-y-3 pt-2" aria-label="Finalized matches">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Finalized ({matches.length})
        </h2>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#FAFAFA] border-b border-slate-200 select-none">
          <div className="col-span-7">Match</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <ul className="divide-y divide-slate-100">
          {matches.map((match) => {
            const displayName = match.name ?? `Match ${match.matchNumber}`;
            return (
              <li key={match.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/70 transition-colors group">
                <button type="button" className="col-span-7 flex items-center gap-3 text-left min-w-0" onClick={() => onOpen(match)} aria-label={`Open Match ${match.matchNumber}`}>
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                    <CheckIcon />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900 text-sm group-hover:text-[#e05305] transition-colors">{displayName}</span>
                    {match.name ? <span className="block text-[11px] text-slate-400 font-medium">Match {match.matchNumber}</span> : null}
                  </div>
                </button>
                <div className="col-span-3 flex items-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500">Finalized</span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <MatchActionMenu
                    match={match}
                    isDeletingMatch={isDeletingMatch}
                    onDelete={onDelete}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile card rows */}
      <ul className="md:hidden bg-white rounded-2xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {matches.map((match) => {
          const displayName = match.name ?? `Match ${match.matchNumber}`;
          return (
            <li key={match.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
              <button type="button" className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => onOpen(match)} aria-label={`Open Match ${match.matchNumber}`}>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <MobileCheckIcon />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800 truncate">{displayName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0">Finalized</span>
                  </div>
                  {match.name ? <p className="text-[11px] text-slate-400 font-medium mt-0.5">Match {match.matchNumber}</p> : null}
                </div>
              </button>
              <MatchActionMenu
                match={match}
                isDeletingMatch={isDeletingMatch}
                onDelete={onDelete}
                triggerClassName="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 disabled:opacity-50"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
