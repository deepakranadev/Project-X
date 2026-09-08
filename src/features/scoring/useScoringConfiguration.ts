"use client";

import { useFormik } from "formik";
import { useEffect, useRef, useState, useMemo } from "react";

import type { ScoringConfig } from "@/domain/scoring/types";
import { createBgmiStandardScoringConfig } from "@/domain/tournaments/scoringPresets";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import type { GuestTournament } from "@/features/tournaments/types";

import {
  scoringConfigToDraft,
  scoringDraftToConfig,
  type ScoringConfigDraft,
} from "./scoringConfigDraft";

function updateDraft(
  current: ScoringConfigDraft,
  changes: Partial<ScoringConfigDraft>,
): ScoringConfigDraft {
  return { ...current, ...changes, preset: "CUSTOM" };
}

export function useScoringConfiguration(
  initialConfig: ScoringConfig,
  tournamentId: string,
  repository: GuestTournamentRepository,
  onSaved: (tournament: GuestTournament) => void,
) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isSaving = useRef(false);
  const [isSavingState, setIsSavingState] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: scoringConfigToDraft(initialConfig),
    validate: (values) => {
      const mapping = scoringDraftToConfig(values as ScoringConfigDraft);
      if (mapping.valid) return {};
      const formikErrors: Record<string, string> = {};
      for (const issue of mapping.issues) {
        formikErrors[issue.field] = issue.message;
      }
      return formikErrors;
    },
    onSubmit: async (values, { resetForm }) => {
      if (isSaving.current) return;
      
      const mapping = scoringDraftToConfig(values);
      if (!mapping.valid) return;

      isSaving.current = true;
      setIsSavingState(true);
      setSaveError(null);
      try {
        const tournament = await repository.updateTournament(tournamentId, {
          scoringConfig: mapping.config,
        });
        if (!tournament) throw new Error("This tournament is no longer saved on this device.");

        resetForm({ values: scoringConfigToDraft(tournament.scoringConfig) });
        setSaved(true);
        onSaved(tournament);
      } catch {
        setSaveError("Scoring could not be saved. Check browser storage permissions and try again.");
      } finally {
        isSaving.current = false;
        setIsSavingState(false);
      }
    },
  });

  const { dirty, values: draft, errors } = formik;

  useEffect(() => {
    if (!dirty) return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  function applyChange(changes: Partial<ScoringConfigDraft>) {
    void formik.setValues(updateDraft(draft, changes));
    setSaveError(null);
    setSaved(false);
  }

  function selectStandardPreset() {
    void formik.setValues(scoringConfigToDraft(createBgmiStandardScoringConfig()));
    setSaveError(null);
    setSaved(false);
  }

  function selectCustom() {
    void formik.setValues({ ...draft, preset: "CUSTOM" });
    setSaved(false);
  }

  const generalIssues = useMemo(() => {
    return Object.entries(errors)
      .filter(([field]) => !field.startsWith("placementPoints.") && field !== "pointsPerFinish" && field !== "tiebreakers")
      .map(([field, message]) => ({ field, message: message as string }));
  }, [errors]);

  const placementErrors: Record<number, string | undefined> = {};
  const formikErrorsAny = errors as Record<string, unknown>;
  for (const field of Object.keys(errors)) {
    if (!field.startsWith("placementPoints.")) continue;
    const placement = Number(field.split(".").at(-1));
    if (Number.isInteger(placement)) placementErrors[placement] = formikErrorsAny[field] as string;
  }

  return {
    applyChange,
    draft,
    finishError: errors.pointsPerFinish as string | undefined,
    formik,
    generalIssues,
    isDirty: dirty,
    isSaving: isSavingState,
    placementErrors,
    saveError,
    saved,
    selectCustom,
    selectStandardPreset,
    tiebreakError: errors.tiebreakers as string | undefined,
  };
}
