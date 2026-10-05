"use client";

interface StandingsPublishingActionsProps {
  readonly finalizedMatchCount: number;
  readonly onExport: () => void;
}

export function StandingsPublishingActions({
  finalizedMatchCount,
  onExport,
}: StandingsPublishingActionsProps) {
  return (
    <div
      className="sm:hidden pt-4 pb-2 space-y-2"
      data-purpose="standings-mobile-actions"
    >
      <button
        type="button"
        onClick={onExport}
        disabled={finalizedMatchCount === 0}
        data-action="export-points-table-mobile"
        className="w-full py-2.5 px-4 bg-brand-primary hover:bg-[#c94700] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>Export Points Table</span>
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </button>
      <p className="text-[10px] text-center text-slate-400">
        Graphics export is coming in a future release.
      </p>
    </div>
  );
}
