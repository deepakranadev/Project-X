"use client";

import { memo } from "react";

interface MatchEntryToolbarProps {
  readonly totalTeams: number;
  readonly enteredCount: number;
  readonly isLoading: boolean;
  readonly editorLocked: boolean;
  readonly onAutoFill: () => void;
}

export const MatchEntryToolbar = memo(function MatchEntryToolbar({
  totalTeams,
  enteredCount,
  isLoading,
  editorLocked,
  onAutoFill,
}: MatchEntryToolbarProps) {
  const pendingCount = Math.max(0, totalTeams - enteredCount);
  const percent = totalTeams > 0 ? Math.min(100, Math.round((enteredCount / totalTeams) * 100)) : 0;

  return (
    <div className="space-y-3 pt-2">
      {/* Progress metrics */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="font-extrabold text-[#e05305]">{enteredCount}</span>
          <span className="font-semibold text-slate-500"> / {totalTeams} teams entered</span>
        </div>
        <span className="font-bold uppercase tracking-wider text-slate-400">
          {pendingCount} PENDING
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#e05305] transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Instructional helper & action */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-xs text-slate-500">
          Enter placement, then finishes. Press Enter to continue.
        </p>
        <button
          type="button"
          disabled={isLoading || editorLocked}
          onClick={onAutoFill}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#e05305]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Auto-fill placements
        </button>
      </div>
    </div>
  );
});
