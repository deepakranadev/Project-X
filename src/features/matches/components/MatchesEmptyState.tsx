"use client";

interface MatchesEmptyStateProps {
  readonly isCreating: boolean;
  readonly onCreateMatch: () => void;
}

export function MatchesEmptyState({
  isCreating,
  onCreateMatch,
}: MatchesEmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 md:p-14 flex flex-col items-center text-center">
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-5">
        <svg
          className="w-7 h-7 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.496m5.007 0a7.454 7.454 0 01-.982-3.172M9.496 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35"
          />
        </svg>
      </div>

      <h2 className="text-base font-bold text-slate-900 mb-1">
        No matches yet
      </h2>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        Create Match 1 when the roster is ready. Standings update automatically
        when you finalize a match.
      </p>

      <button
        type="button"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e05305] hover:bg-[#c94703] text-white text-sm font-semibold rounded-lg shadow-sm shadow-orange-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#e05305] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isCreating}
        onClick={onCreateMatch}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        {isCreating ? "Creating…" : "Create Match"}
      </button>
    </div>
  );
}
