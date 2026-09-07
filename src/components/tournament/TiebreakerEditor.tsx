"use client";

import { useMemo, useState } from "react";

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
    <div>
      <h3 className="text-xs font-black tracking-[0.16em] text-slate-300">
        TIEBREAK PRIORITY
      </h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Total points is always checked first. These rules resolve teams that
        remain tied.
      </p>

      <div className="mt-4 space-y-2" data-testid="tiebreak-order">
        {criteria.length > 0 ? (
          criteria.map((criterion, index) => {
            const label = TIEBREAKER_LABELS[criterion];
            return (
              <div
                className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-white/8 bg-black/15 p-2.5"
                data-tiebreaker={criterion}
                key={`${criterion}-${index}`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-md bg-white/5 text-xs font-black tabular-nums text-slate-500">
                  {index + 1}
                </span>
                <span className="min-w-0 truncate text-sm font-bold text-white">
                  {label}
                </span>
                <span className="flex items-center gap-0.5">
                  <button
                    className="grid h-10 w-9 place-items-center rounded-md text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-25"
                    type="button"
                    aria-label={`Move ${label} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    className="grid h-10 w-9 place-items-center rounded-md text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-25"
                    type="button"
                    aria-label={`Move ${label} down`}
                    disabled={index === criteria.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    className="min-h-10 rounded-md px-2 text-xs font-bold text-red-300 hover:bg-red-400/5"
                    type="button"
                    aria-label={`Remove ${label}`}
                    onClick={() =>
                      onChange(criteria.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    Remove
                  </button>
                </span>
              </div>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-slate-700 p-3 text-sm text-slate-400">
            No optional tiebreak rules selected. Fully tied teams will share a
            rank.
          </p>
        )}
      </div>

      {error ? <p className="field-error">{error}</p> : null}

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label className="sr-only" htmlFor="availableTiebreaker">
          Available tiebreak rule
        </label>
        <select
          className="field-control min-w-0"
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
        <button
          className="min-h-12 rounded-lg border border-white/10 px-3 text-sm font-bold text-slate-300 hover:border-lime-300/40 hover:text-lime-300 disabled:opacity-40"
          type="button"
          disabled={!addableCriterion}
          onClick={() => {
            if (addableCriterion) onChange([...criteria, addableCriterion]);
          }}
        >
          Add rule
        </button>
      </div>

      <aside className="mt-4 rounded-lg border border-lime-300/15 bg-lime-300/5 p-3 text-sm leading-6 text-slate-300">
        If two teams have equal total points, rule #1 is checked first. If they
        are still tied, rule #2 is checked next. Teams still equal after every
        selected rule share the same rank.
      </aside>
    </div>
  );
}
