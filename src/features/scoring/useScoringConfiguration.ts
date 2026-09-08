"use client";

import { useEffect, useState } from "react";

import type { ScoringConfig } from "@/domain/scoring/types";
import { createBgmiStandardScoringConfig } from "@/domain/tournaments/scoringPresets";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import type { GuestTournament } from "@/features/tournaments/types";

import {
  scoringConfigToDraft,
  scoringDraftToConfig,
  type ScoringConfigDraft,
  type ScoringDraftIssue,
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

  async function save() {
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
      const tournament = await repository.updateTournament(tournamentId, {
        scoringConfig: mapping.config,
      });
      if (!tournament) throw new Error("This tournament is no longer saved on this device.");
      setDraft(scoringConfigToDraft(tournament.scoringConfig));
      setIsDirty(false);
      setSaved(true);
      onSaved(tournament);
    } catch {
      setSaveError("Scoring could not be saved. Check browser storage permissions and try again.");
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

  return {
    applyChange,
    draft,
    finishError: issues.find((issue) => issue.field === "pointsPerFinish")?.message,
    generalIssues: issues.filter((issue) => !issue.field.startsWith("placementPoints.") && issue.field !== "pointsPerFinish" && issue.field !== "tiebreakers"),
    isDirty,
    isSaving,
    placementErrors,
    save,
    saveError,
    saved,
    selectCustom,
    selectStandardPreset,
    tiebreakError: issues.find((issue) => issue.field === "tiebreakers")?.message,
  };
}
