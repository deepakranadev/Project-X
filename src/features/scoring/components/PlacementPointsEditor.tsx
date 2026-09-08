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
          <h3 className="text-xs font-black tracking-[0.16em] text-slate-300">
            PLACEMENT POINTS
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Points awarded for each final placement.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500">1–16</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {rows.map((row) => {
          const label = placementLabel(row.placement);
          const error = errors[row.placement];
          return (
            <label
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_4.25rem] items-center gap-2 rounded-lg border border-white/8 bg-black/15 p-2.5"
              key={row.placement}
            >
              <span className="text-sm font-extrabold text-slate-300">
                {label}
              </span>
              <input
                className="min-h-10 min-w-0 w-full rounded-md border border-slate-700 bg-[#080d11] px-2 text-center font-black tabular-nums text-white outline-none focus:border-lime-300"
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
                <span className="col-span-2 text-xs leading-4 text-red-300">
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
