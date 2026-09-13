"use client";

import React from "react";
import {
  placementLabel,
  type PlacementPointsDraftRow,
} from "@/features/scoring/scoringConfigDraft";

interface PlacementPointsEditorProps {
  readonly rows: readonly PlacementPointsDraftRow[];
  readonly errors: Readonly<Record<number, string | undefined>>;
  readonly isStandard: boolean;
  readonly onChange: (placement: number, points: string) => void;
}

function getRankBadgeStyle(placement: number): string {
  if (placement === 1) {
    return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
  }
  if (placement === 2) {
    return "bg-slate-100 text-slate-700 border-slate-200 font-bold";
  }
  if (placement === 3) {
    return "bg-amber-50/60 text-amber-800 border-amber-200/80 font-bold";
  }
  if (placement <= 8) {
    return "bg-slate-50 text-slate-600 border-slate-200 font-medium";
  }
  return "bg-slate-100 text-slate-400 border-slate-200 font-medium";
}

export function PlacementPointsEditor({
  rows,
  errors,
  isStandard,
  onChange,
}: PlacementPointsEditorProps) {
  return (
    <div
      className="bg-white rounded-2xl md:rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
      data-purpose="placement-points-card"
    >
      {/* Table Card Header */}
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Placement Points</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isStandard
              ? "Read-only standard distribution"
              : "Editable placement point values"}
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
          1–16
        </span>
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-12 px-4 sm:px-5 py-2.5 bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold sm:font-semibold uppercase tracking-wider text-slate-400">
        <div className="col-span-6">Placement</div>
        <div className="col-span-6 text-right">Points</div>
      </div>

      {/* Points Rows */}
      <div className="divide-y divide-slate-100">
        {rows.map((row) => {
          const label = placementLabel(row.placement);
          const error = errors[row.placement];
          const isWinner = row.placement === 1;

          return (
            <div
              key={row.placement}
              className="grid grid-cols-12 items-center px-4 sm:px-5 h-12 hover:bg-slate-50/50 transition-colors box-border"
            >
              {/* Left Column: Badge and Label */}
              <div className="col-span-6 flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 shrink-0 rounded-md sm:rounded-md rounded-full border text-xs flex items-center justify-center font-mono ${getRankBadgeStyle(
                    row.placement,
                  )}`}
                >
                  {row.placement}
                </span>
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <span className="text-[13px] sm:text-sm font-semibold text-slate-900 truncate">
                    {label} Place
                  </span>
                  {isWinner && (
                    <span className="text-[11px] text-amber-600 font-medium hidden sm:inline shrink-0">
                      Winner
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Numeric Input or Read-Only Points Display */}
              <div className="col-span-6 flex flex-col items-end justify-center">
                {isStandard ? (
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      disabled
                      aria-label={`Points for ${label} place`}
                      value={row.points}
                      className="sr-only"
                      readOnly
                    />
                    <div className="w-20 h-8 flex items-center justify-center text-center font-mono font-semibold text-[13px] text-slate-900 bg-slate-50 border border-slate-200/70 rounded-lg shadow-2xs tabular-nums box-border">
                      {row.points}{" "}
                      <span className="font-sans font-medium text-xs text-slate-500 ml-1">
                        {row.points === "1" ? "pt" : "pts"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-end">
                    <input
                      className="w-20 h-8 px-2.5 text-center font-mono font-bold text-[13px] text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-[#ea580c] focus:border-[#ea580c] outline-none box-border"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={row.points}
                      aria-label={`Points for ${label} place`}
                      aria-invalid={Boolean(error)}
                      onChange={(event) =>
                        onChange(row.placement, event.currentTarget.value)
                      }
                    />
                    {error && (
                      <span className="text-[10px] text-red-600 mt-0.5 text-right font-medium">
                        {error}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
