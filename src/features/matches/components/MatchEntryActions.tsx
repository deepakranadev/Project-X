"use client";

import { memo } from "react";

interface MatchEntryActionsProps {
  readonly isLoading: boolean;
  readonly editorLocked: boolean;
  readonly onSave: () => void;
  readonly onFinalize: () => void;
}

export const MatchEntryActions = memo(function MatchEntryActions({
  isLoading,
  editorLocked,
  onSave,
  onFinalize,
}: MatchEntryActionsProps) {
  const disabled = isLoading || editorLocked;

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
        <button
          type="button"
          disabled={disabled}
          onClick={onSave}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#e05305]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onFinalize}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e05305] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#c2410c] focus:outline-none focus:ring-2 focus:ring-[#e05305]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Finalize Match
        </button>
      </div>
      <p className="text-[11px] text-slate-400 text-center sm:text-right">
        Finalizing publishes scores directly to Overall Standings
      </p>
    </div>
  );
});
