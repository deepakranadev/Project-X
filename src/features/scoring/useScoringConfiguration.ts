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

function createDeterministicSnapshot(config: ScoringConfig): string {
  return JSON.stringify({
    placementPoints: config.placementPoints,
    pointsPerKill: config.pointsPerKill,
    tiebreakers: config.tiebreakers,
  });
}

function isDraftEqual(a: ScoringConfigDraft, b: ScoringConfigDraft): boolean {
  const configA = scoringDraftToConfig(a);
  const configB = scoringDraftToConfig(b);
  if (!configA.valid || !configB.valid) return JSON.stringify(a) === JSON.stringify(b);
  return JSON.stringify(configA.config) === JSON.stringify(configB.config);
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

  const draftKey = `openloby:scoring-draft:${tournamentId}`;
  
  const [restoredDraft, setRestoredDraft] = useState<ScoringConfigDraft | null>(() => {
    if (typeof window === "undefined") return null;
    const currentSnapshot = createDeterministicSnapshot(initialConfig);
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === 1 && parsed.baseConfigSnapshot === currentSnapshot) {
          // Verify it's not totally malformed structurally
          if (parsed.draftValues && typeof parsed.draftValues === "object") {
             return parsed.draftValues as ScoringConfigDraft;
          }
        }
        sessionStorage.removeItem(draftKey);
      }
    } catch {
      // Clean up if it was totally broken JSON
      try { sessionStorage.removeItem(draftKey); } catch {}
    }
    return null;
  });

  const authoritativeDraft = useMemo(() => scoringConfigToDraft(initialConfig), [initialConfig]);
  const initialValues = restoredDraft || authoritativeDraft;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
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

        setRestoredDraft(null);
        try { sessionStorage.removeItem(draftKey); } catch {}

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

  const { values: draft, errors } = formik;

  // We are dirty if the current form draft differs from the authoritative configuration draft
  const dirty = useMemo(() => {
    return !isDraftEqual(draft, authoritativeDraft);
  }, [draft, authoritativeDraft]);

  const latestDraftRef = useRef(draft);
  const snapshotRef = useRef(createDeterministicSnapshot(initialConfig));
  const isDirtyRef = useRef(dirty);

  useEffect(() => {
    latestDraftRef.current = draft;
    snapshotRef.current = createDeterministicSnapshot(initialConfig);
    isDirtyRef.current = dirty;
  }, [draft, initialConfig, dirty]);

  // Debounced persistence
  useEffect(() => {
    if (!dirty) {
      try { sessionStorage.removeItem(draftKey); } catch {}
      return;
    }
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({
          version: 1,
          baseConfigSnapshot: snapshotRef.current,
          draftValues: draft
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, dirty, draftKey]);

  // Sync flush on unmount
  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        try {
          sessionStorage.setItem(draftKey, JSON.stringify({
            version: 1,
            baseConfigSnapshot: snapshotRef.current,
            draftValues: latestDraftRef.current
          }));
        } catch {}
      }
    };
  }, [draftKey]);

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
