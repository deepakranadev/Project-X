"use client";

import React, { useMemo, useState } from "react";
import type { TiebreakerType } from "@/domain/scoring/types";
import {
  OPTIONAL_TIEBREAKER_TYPES,
  type OptionalTiebreakerType,
} from "@/domain/tournaments/scoringPresets";

export const TIEBREAKER_LABELS: Readonly<Record<TiebreakerType, string>> = {
  TOTAL_POINTS: "Total Points",
  WWCD: "WWCD",
  PLACEMENT_POINTS: "Placement Points",
  TOTAL_KILLS: "Total Finishes",
  BEST_PLACEMENT: "Best Placement",
  LATEST_MATCH_PLACEMENT: "Latest Placement",
};

interface TiebreakerEditorProps {
  readonly criteria: readonly TiebreakerType[];
  readonly error?: string;
  readonly onChange: (criteria: readonly TiebreakerType[]) => void;
}

export function TiebreakerEditor({
  criteria,
  error,
  onChange,
}: TiebreakerEditorProps) {
  const available = useMemo(
    () => OPTIONAL_TIEBREAKER_TYPES.filter((type) => !criteria.includes(type)),
    [criteria],
  );
  const [selectedToAdd, setSelectedToAdd] = useState<OptionalTiebreakerType>(
    available[0] ?? "WWCD",
  );
  const addableCriterion = available.includes(selectedToAdd)
    ? selectedToAdd
    : available[0];

  function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= criteria.length) return;
    const reordered = [...criteria];
    const current = reordered[index];
    const target = reordered[targetIndex];
    if (!current || !target) return;
    reordered[index] = target;
    reordered[targetIndex] = current;
    onChange(reordered);
  }

  return (
    <div
      className="bg-white rounded-2xl md:rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4"
      data-purpose="advanced-ranking-rules-card"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Advanced Ranking Rules
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Total points is always checked first. These rules resolve teams that
          remain tied.
        </p>
      </div>

      {/* Reorderable Rules List */}
      <div className="space-y-2" data-testid="tiebreak-order">
        {criteria.length > 0 ? (
          criteria.map((criterion, index) => {
            const label = TIEBREAKER_LABELS[criterion];
            return (
              <div
                className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/60 p-2 sm:p-2.5"
                data-tiebreaker={criterion}
                key={`${criterion}-${index}`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-white border border-slate-200 text-xs font-bold tabular-nums text-slate-700 font-mono">
                  {index + 1}
                </span>
                <span className="min-w-0 truncate text-xs sm:text-sm font-semibold text-slate-900">
                  {label}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors disabled:opacity-25"
                    type="button"
                    aria-label={`Move ${label} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors disabled:opacity-25"
                    type="button"
                    aria-label={`Move ${label} down`}
                    disabled={index === criteria.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    className="ml-1 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                    type="button"
                    aria-label={`Remove ${label}`}
                    onClick={() =>
                      onChange(criteria.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500 text-center">
            No optional tiebreak rules selected. Fully tied teams will share a
            rank.
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      {/* Add Rule Row */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <div className="flex-1 min-w-0">
          <label className="sr-only" htmlFor="availableTiebreaker">
            Available tiebreak rule
          </label>
          <select
            className="w-full bg-white border border-slate-300 rounded-lg text-xs sm:text-sm px-3 py-2 text-slate-800 focus:ring-2 focus:ring-[#ea580c] focus:border-[#ea580c] outline-none"
            id="availableTiebreaker"
            value={addableCriterion ?? ""}
            disabled={!addableCriterion}
            onChange={(event) =>
              setSelectedToAdd(event.currentTarget.value as OptionalTiebreakerType)
            }
          >
            {available.length > 0 ? (
              available.map((criterion) => (
                <option key={criterion} value={criterion}>
                  {TIEBREAKER_LABELS[criterion]}
                </option>
              ))
            ) : (
              <option value="">All rules selected</option>
            )}
          </select>
        </div>
        <button
          className="shrink-0 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40"
          type="button"
          disabled={!addableCriterion}
          onClick={() => {
            if (addableCriterion) onChange([...criteria, addableCriterion]);
          }}
        >
          Add Rule
        </button>
      </div>

      {/* Scope / Rule Info */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-500 leading-relaxed">
        If two teams have equal total points, rule #1 is checked first. If they
        are still tied, rule #2 is checked next. Teams still equal after every
        selected rule share the same rank.
      </div>
    </div>
  );
}
