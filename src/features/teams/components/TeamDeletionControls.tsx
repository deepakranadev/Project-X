"use client";

import { useState } from "react";

interface TeamDeletionControlsProps {
  readonly isDeleting: boolean;
  readonly teamName: string;
  readonly onDelete: () => void;
}

export function TeamDeletionControls({
  isDeleting,
  teamName,
  onDelete,
}: TeamDeletionControlsProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="mt-5 border-t border-white/8 pt-5">
      {confirming ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3">
          <p className="text-sm font-bold text-white">
            Remove {teamName} from this tournament?
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            This removes the locally saved team record.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="min-h-11 rounded-lg border border-white/10 text-sm font-bold text-slate-300"
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className="min-h-11 rounded-lg bg-red-400 px-3 text-sm font-black text-slate-950 disabled:opacity-60"
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing…" : "Yes, remove"}
            </button>
          </div>
        </div>
      ) : (
        <button
          className="min-h-11 text-sm font-bold text-red-300 hover:text-red-200"
          type="button"
          onClick={() => setConfirming(true)}
        >
          Remove team
        </button>
      )}
    </div>
  );
}
