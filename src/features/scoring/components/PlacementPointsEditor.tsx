"use client";

import {
  placementLabel,
  type PlacementPointsDraftRow,
} from "@/features/scoring/scoringConfigDraft";

interface PlacementPointsEditorProps {
  readonly rows: readonly PlacementPointsDraftRow[];
  readonly errors: Readonly<Record<number, string | undefined>>;
  readonly onChange: (placement: number, points: string) => void;
}

export function PlacementPointsEditor({
  rows,
  errors,
  onChange,
}: PlacementPointsEditorProps) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Placement Points
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Points awarded for each final placement.
          </p>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-surface-raised px-2 py-0.5 rounded-full">1–16</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {rows.map((row) => {
          const label = placementLabel(row.placement);
          const error = errors[row.placement];
          return (
            <label
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_4.25rem] items-center gap-2 rounded-lg border border-border bg-surface-raised p-2"
              key={row.placement}
            >
              <span className="text-sm font-bold text-muted-foreground pl-1">
                {label}
              </span>
              <input
                className="min-h-10 min-w-0 w-full rounded-md border border-border bg-background px-2 text-center font-black tabular-nums text-foreground outline-none focus:border-foreground"
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
              {error ? (
                <span className="col-span-2 text-xs leading-4 text-red-600 dark:text-red-400">
                  {error}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}
