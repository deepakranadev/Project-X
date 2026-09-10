"use client";

import type { ScoringConfig } from "@/domain/scoring/types";
import { useScoringConfiguration } from "@/features/scoring/useScoringConfiguration";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import type { GuestTournament } from "@/features/tournaments/types";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { PlacementPointsEditor } from "./PlacementPointsEditor";
import { TiebreakerEditor } from "./TiebreakerEditor";

interface ScoringConfigurationProps {
  readonly initialConfig: ScoringConfig;
  readonly tournamentId: string;
  readonly repository: GuestTournamentRepository;
  readonly onSaved: (tournament: GuestTournament) => void;
}

export function ScoringConfiguration({
  initialConfig,
  tournamentId,
  repository,
  onSaved,
}: ScoringConfigurationProps) {
  const controller = useScoringConfiguration(
    initialConfig,
    tournamentId,
    repository,
    onSaved,
  );
  const { applyChange, draft, finishError, formik, generalIssues, isDirty, isSaving,
    placementErrors, saveError, saved, selectCustom, selectStandardPreset,
    tiebreakError } = controller;

  return (
    <section className="mt-10 scroll-mt-4 sm:mt-14" id="scoring">
      <p className="eyebrow">03 · Scoring</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            Configure scoring
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Choose the standard BGMI rules or adjust the values for this
            tournament.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isDirty
              ? "bg-amber-300/10 text-amber-200"
              : "bg-lime-300/10 text-lime-200"
          }`}
          role="status"
        >
          {isDirty ? "Unsaved changes" : "Saved"}
        </span>
      </div>

      <form className="panel mt-5 overflow-hidden" onSubmit={formik.handleSubmit} noValidate>
        <div className="border-b border-white/8 p-5 sm:p-6">
          <span className="field-label">Scoring rules</span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Scoring preset">
            <button
              className={`min-h-12 rounded-lg border px-3 text-sm font-black transition-colors ${
                draft.preset === "BGMI_STANDARD"
                  ? "border-lime-300 bg-lime-300 text-slate-950"
                  : "border-white/10 bg-white/3 text-slate-300"
              }`}
              type="button"
              aria-pressed={draft.preset === "BGMI_STANDARD"}
              onClick={selectStandardPreset}
            >
              BGMI Standard
            </button>
            <button
              className={`min-h-12 rounded-lg border px-3 text-sm font-black transition-colors ${
                draft.preset === "CUSTOM"
                  ? "border-lime-300 bg-lime-300 text-slate-950"
                  : "border-white/10 bg-white/3 text-slate-300"
              }`}
              type="button"
              aria-pressed={draft.preset === "CUSTOM"}
              onClick={selectCustom}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="space-y-8 p-5 sm:p-6">
          <PlacementPointsEditor
            rows={draft.placementPoints}
            errors={placementErrors}
            onChange={(placement, points) =>
              applyChange({
                placementPoints: draft.placementPoints.map((row) =>
                  row.placement === placement ? { ...row, points } : row,
                ),
              })
            }
          />

          <div className="max-w-sm">
            <Label className="field-label" htmlFor="pointsPerFinish">
              Points per finish
            </Label>
            <Input
              className="field-control font-black tabular-nums"
              id="pointsPerFinish"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={draft.pointsPerFinish}
              aria-invalid={Boolean(finishError)}
              onChange={(event) =>
                applyChange({ pointsPerFinish: event.currentTarget.value })
              }
            />
            {finishError ? <p className="field-error">{finishError}</p> : null}
          </div>

          <TiebreakerEditor
            criteria={draft.tiebreakers}
            error={tiebreakError}
            onChange={(tiebreakers) => applyChange({ tiebreakers })}
          />

          {generalIssues.length > 0 ? (
            <ul className="space-y-1 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300" role="alert">
              {generalIssues.map((issue) => (
                <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}
          {saveError ? (
            <p className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300" role="alert">
              {saveError}
            </p>
          ) : null}
          {saved ? (
            <p className="rounded-lg border border-lime-300/20 bg-lime-300/5 p-3 text-sm font-bold text-lime-200" role="status">
              Scoring saved
            </p>
          ) : null}

          <Button
            className="primary-action w-full disabled:cursor-not-allowed"
            type="submit"
            disabled={isSaving || !isDirty}
          >
            {isSaving ? "Saving scoring…" : "Save Scoring"}
          </Button>
        </div>
      </form>
    </section>
  );
}
