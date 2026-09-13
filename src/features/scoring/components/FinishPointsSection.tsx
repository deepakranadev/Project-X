"use client";

import React from "react";

interface FinishPointsSectionProps {
  readonly pointsPerFinish: string;
  readonly isStandard: boolean;
  readonly finishError?: string;
  readonly onChange: (value: string) => void;
}

export function FinishPointsSection({
  pointsPerFinish,
  isStandard,
  finishError,
  onChange,
}: FinishPointsSectionProps) {
  const finishLabel = `${pointsPerFinish} ${pointsPerFinish === "1" ? "point" : "points"} per finish`;

  return (
    <div
      className="bg-white rounded-2xl md:rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4"
      data-purpose="finish-points-card"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ea580c] shrink-0 mt-0.5">
            {/* Target Crosshairs SVG */}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
          </div>
          <div>
            <label
              htmlFor="pointsPerFinish"
              className="text-xs font-semibold uppercase tracking-wider text-slate-400 block"
            >
              Finish Points
            </label>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 leading-tight">
              {isStandard ? "1 point per finish" : finishLabel}
            </p>
          </div>
        </div>

        {/* Numeric Control */}
        <div>
          {isStandard ? (
            <div className="relative flex items-center">
              <input
                id="pointsPerFinish"
                aria-label="Points per finish"
                type="number"
                disabled
                value={pointsPerFinish}
                className="sr-only"
                readOnly
              />
              <div className="w-20 h-8 flex items-center justify-center bg-slate-50 border border-slate-200/70 text-slate-900 font-mono font-bold text-sm rounded-lg shadow-2xs text-center tabular-nums box-border">
                {pointsPerFinish}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <input
                id="pointsPerFinish"
                aria-label="Points per finish"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={pointsPerFinish}
                aria-invalid={Boolean(finishError)}
                onChange={(event) => onChange(event.currentTarget.value)}
                className="w-20 h-8 px-2.5 text-center font-mono font-bold text-sm text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-[#ea580c] focus:border-[#ea580c] outline-none box-border"
              />
            </div>
          )}
        </div>
      </div>

      {finishError && (
        <p className="text-xs text-red-600 font-medium">{finishError}</p>
      )}

      {/* Description / Explanatory Note */}
      <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
        {isStandard
          ? "Standard BGMI finish scoring assigns 1 point for every verified team elimination."
          : "Custom finish point value awarded for each verified team elimination."}
      </div>
    </div>
  );
}
