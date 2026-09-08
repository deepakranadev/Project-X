"use client";

import { useMemo, useState } from "react";

import { createGuestTeamsFromText, GuestTeamCreationError } from "./createGuestTeams";
import { validateBulkTeamNames } from "./parseBulkTeamNames";
import { publishSuccessfulTeamMutation } from "./teamRosterState";
import type { GuestTeamRepository } from "./teamRepository";
import type { GuestTeam } from "./types";

export function useTeamBulkEntry(
  tournamentId: string,
  existingTeams: readonly GuestTeam[],
  repository: GuestTeamRepository,
  onCreated: (teams: readonly GuestTeam[]) => void,
) {
  const [pastedNames, setPastedNames] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<readonly string[]>([]);
  const validation = useMemo(
    () => validateBulkTeamNames(pastedNames, existingTeams),
    [existingTeams, pastedNames],
  );
  const visibleIssues = pastedNames.length > 0 || submitted
    ? validation.issues.map((issue) => issue.message)
    : [];

  function changePastedNames(value: string) {
    setPastedNames(value);
    setServerErrors([]);
    setSubmitted(false);
  }

  async function submit() {
    if (isSaving) return;
    setSubmitted(true);
    setServerErrors([]);
    if (validation.issues.length > 0) return;

    setIsSaving(true);
    try {
      await createGuestTeamsFromText(tournamentId, pastedNames, repository);
      await publishSuccessfulTeamMutation(
        () => repository.listTeamsByTournament(tournamentId),
        onCreated,
      );
      setPastedNames("");
      setSubmitted(false);
    } catch (error) {
      setServerErrors(
        error instanceof GuestTeamCreationError
          ? error.issues.map((issue) => issue.message)
          : [
              error instanceof Error
                ? error.message
                : "Teams could not be saved. Check browser storage and try again.",
            ],
      );
    } finally {
      setIsSaving(false);
    }
  }

  return {
    changePastedNames,
    errors: serverErrors.length > 0 ? serverErrors : visibleIssues,
    isSaving,
    pastedNames,
    submit,
    validation,
  };
}
