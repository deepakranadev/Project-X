"use client";

import { type FormEvent, useEffect, useState } from "react";

import type { ScoringConfig } from "@/domain/scoring/types";
import {
  scoringConfigToDraft,
  scoringDraftToConfig,
  type ScoringConfigDraft,
  type ScoringDraftIssue,
} from "@/domain/tournaments/scoringConfigDraft";
import { createBgmiStandardScoringConfig } from "@/domain/tournaments/scoringPresets";
import type { Tournament } from "@/domain/tournaments/types";
import { getClientTournamentRepository } from "@/infrastructure/persistence/indexed-db/clientTournamentRepository";

import { PlacementPointsEditor } from "./PlacementPointsEditor";
import { TiebreakerEditor } from "./TiebreakerEditor";

interface ScoringConfigurationProps {
  readonly initialConfig: ScoringConfig;
  readonly tournamentId: string;
  readonly onSaved: (tournament: Tournament) => void;
}

function updateDraft(
  current: ScoringConfigDraft,
  changes: Partial<ScoringConfigDraft>,
): ScoringConfigDraft {
  return { ...current, ...changes, preset: "CUSTOM" };
}

export function ScoringConfiguration({
  initialConfig,
  tournamentId,
  onSaved,
}: ScoringConfigurationProps) {
  const [draft, setDraft] = useState(() => scoringConfigToDraft(initialConfig));
  const [issues, setIssues] = useState<readonly ScoringDraftIssue[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isDirty) return;

    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  function applyChange(changes: Partial<ScoringConfigDraft>) {
    setDraft((current) => updateDraft(current, changes));
    setIssues([]);
    setSaveError(null);
    setSaved(false);
    setIsDirty(true);
  }

  function selectStandardPreset() {
    setDraft(scoringConfigToDraft(createBgmiStandardScoringConfig()));
    setIssues([]);
    setSaveError(null);
    setSaved(false);
    setIsDirty(true);
  }

  function selectCustom() {
    setDraft((current) => ({ ...current, preset: "CUSTOM" }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const mapping = scoringDraftToConfig(draft);
    if (!mapping.valid) {
      setIssues(mapping.issues);
      setSaved(false);
      return;
    }

    setIsSaving(true);
    setIssues([]);
    setSaveError(null);
    try {
      const tournament = await getClientTournamentRepository().updateTournament(
        tournamentId,
        { scoringConfig: mapping.config },
      );
      if (!tournament) {
        throw new Error("This tournament is no longer saved on this device.");
      }

      setDraft(scoringConfigToDraft(tournament.scoringConfig));
      setIsDirty(false);
      setSaved(true);
      onSaved(tournament);
    } catch {
      setSaveError(
        "Scoring could not be saved. Check browser storage permissions and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const placementErrors: Record<number, string | undefined> = {};
  for (const issue of issues) {
    if (!issue.field.startsWith("placementPoints.")) continue;
    const placement = Number(issue.field.split(".").at(-1));
    if (Number.isInteger(placement)) placementErrors[placement] = issue.message;
  }
  const finishError = issues.find(
    (issue) => issue.field === "pointsPerFinish",
  )?.message;
  const tiebreakError = issues.find(
    (issue) => issue.field === "tiebreakers",
  )?.message;
  const generalIssues = issues.filter(
    (issue) =>
      !issue.field.startsWith("placementPoints.") &&
      issue.field !== "pointsPerFinish" &&
      issue.field !== "tiebreakers",
  );

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

      <form className="panel mt-5 overflow-hidden" onSubmit={handleSubmit} noValidate>
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
            <label className="field-label" htmlFor="pointsPerFinish">
              Points per finish
            </label>
            <input
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

          <button
            className="primary-action w-full disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={isSaving || !isDirty}
          >
            {isSaving ? "Saving scoring…" : "Save Scoring"}
          </button>
        </div>
      </form>
    </section>
  );
}
