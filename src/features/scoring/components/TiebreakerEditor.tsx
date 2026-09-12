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
    <div className="pt-8 border-t border-border mt-8">
      <h3 className="text-sm font-bold text-foreground">
        Advanced Ranking Rules
      </h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Total points is always checked first. These rules resolve teams that
        remain tied.
      </p>

      <div className="mt-4 space-y-2" data-testid="tiebreak-order">
        {criteria.length > 0 ? (
          criteria.map((criterion, index) => {
            const label = TIEBREAKER_LABELS[criterion];
            return (
              <div
                className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-surface-raised p-2.5"
                data-tiebreaker={criterion}
                key={`${criterion}-${index}`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-md bg-background border border-border text-xs font-black tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 truncate text-sm font-bold text-foreground">
                  {label}
                </span>
                <span className="flex items-center gap-0.5">
                  <button
                    className="grid h-10 w-9 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-25"
                    type="button"
                    aria-label={`Move ${label} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    &uarr;
                  </button>
                  <button
                    className="grid h-10 w-9 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-25"
                    type="button"
                    aria-label={`Move ${label} down`}
                    disabled={index === criteria.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    &darr;
                  </button>
                  <button
                    className="ml-1 min-h-10 rounded-md px-2 text-xs font-semibold text-red-600 hover:bg-red-500/10"
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
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
            No optional tiebreak rules selected. Fully tied teams will share a
            rank.
          </p>
        )}
      </div>

      {error ? <p className="field-error mt-2">{error}</p> : null}

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <label className="sr-only" htmlFor="availableTiebreaker">
            Available tiebreak rule
          </label>
          <select
            className="field-control w-full"
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
          className="shrink-0 min-h-12 rounded-lg border border-border px-4 text-sm font-bold text-foreground bg-surface hover:bg-surface-raised disabled:opacity-40"
          type="button"
          disabled={!addableCriterion}
          onClick={() => {
            if (addableCriterion) onChange([...criteria, addableCriterion]);
          }}
        >
          Add Rule
        </button>
      </div>

      <aside className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-4 text-sm leading-6 text-muted-foreground">
        If two teams have equal total points, rule #1 is checked first. If they
        are still tied, rule #2 is checked next. Teams still equal after every
        selected rule share the same rank.
      </aside>
    </div>
  );
}
