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
    <section className="mt-8 scroll-mt-24 md:scroll-mt-10 sm:mt-12" id="scoring">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-muted" aria-hidden="true">
          03
        </span>
        <p className="eyebrow">Scoring</p>
      </div>
      <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">
            Configure scoring
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Choose the standard BGMI rules or adjust the values for this
            tournament.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
            isDirty
              ? "border-amber-500/20 bg-amber-50 text-amber-900"
              : "border-green-500/20 bg-green-50 text-green-900"
          }`}
          role="status"
        >
          {isDirty ? "Unsaved changes" : "Saved"}
        </span>
      </div>

      <form className="panel mt-5 overflow-hidden" onSubmit={formik.handleSubmit} noValidate>
        <div className="border-b border-border p-5 sm:p-6 bg-surface">
          <span className="field-label">Scoring rules</span>
          <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Scoring preset">
            <button
              className={`min-h-12 rounded-lg border px-3 text-sm font-bold transition-colors ${
                draft.preset === "BGMI_STANDARD"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:bg-surface-raised"
              }`}
              type="button"
              aria-pressed={draft.preset === "BGMI_STANDARD"}
              onClick={selectStandardPreset}
            >
              BGMI Standard
            </button>
            <button
              className={`min-h-12 rounded-lg border px-3 text-sm font-bold transition-colors ${
                draft.preset === "CUSTOM"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:bg-surface-raised"
              }`}
              type="button"
              aria-pressed={draft.preset === "CUSTOM"}
              onClick={selectCustom}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="space-y-8 p-5 sm:p-6 bg-background">
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
              className="field-control font-black tabular-nums mt-1.5"
              id="pointsPerFinish"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={draft.pointsPerFinish}
              aria-invalid={Boolean(finishError)}
              disabled={draft.preset === "BGMI_STANDARD"}
              onChange={(event) =>
                applyChange({ pointsPerFinish: event.currentTarget.value })
              }
            />
            {finishError ? <p className="field-error mt-2">{finishError}</p> : null}
          </div>

          <TiebreakerEditor
            criteria={draft.tiebreakers}
            error={tiebreakError}
            onChange={(tiebreakers) => applyChange({ tiebreakers })}
          />

          {generalIssues.length > 0 ? (
            <ul className="space-y-1 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {generalIssues.map((issue) => (
                <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}
          {saveError ? (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {saveError}
            </p>
          ) : null}
          {saved ? (
            <p className="rounded-lg border border-green-500/20 bg-green-50 p-3 text-sm font-bold text-green-900" role="status">
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
