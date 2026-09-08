"use client";

import { useCallback, useState } from "react";

import { createGuestTournament } from "./createGuestTournament";
import type { GuestTournamentRepository } from "./tournamentRepository";
import type { CreateTournamentInput, GuestTournament } from "./types";
import {
  TournamentValidationError,
  type TournamentValidationField,
  validateTournamentImage,
} from "./validation";

export type TournamentLogoField = "tournamentLogo" | "organizerLogo";
export type TournamentCreationErrors = Partial<
  Record<TournamentValidationField | "form", string>
>;

function storageErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "This device is out of browser storage. Free some space, then try again.";
  }
  return "We could not save this tournament on your device. Check browser storage permissions and try again.";
}

export function useTournamentCreation(
  repository: GuestTournamentRepository,
  onCreated: (tournament: GuestTournament) => void,
) {
  const [logos, setLogos] = useState<
    Record<TournamentLogoField, NonNullable<GuestTournament["tournamentLogo"]> | null>
  >({ tournamentLogo: null, organizerLogo: null });
  const [errors, setErrors] = useState<TournamentCreationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const clearError = useCallback((field: TournamentValidationField) => {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }, []);

  const selectLogo = useCallback(
    (field: TournamentLogoField, file: File | null): boolean => {
      if (!file) {
        setLogos((current) => ({ ...current, [field]: null }));
        clearError(field);
        return true;
      }
      const image = { blob: file, fileName: file.name };
      const issues = validateTournamentImage(image, field);
      if (issues.length > 0) {
        setLogos((current) => ({ ...current, [field]: null }));
        setErrors((current) => ({
          ...current,
          [field]: issues[0]?.message,
          form: undefined,
        }));
        return false;
      }
      setLogos((current) => ({ ...current, [field]: image }));
      clearError(field);
      return true;
    },
    [clearError],
  );

  const submit = useCallback(
    async (input: Omit<CreateTournamentInput, TournamentLogoField>) => {
      if (isSaving) return;
      setIsSaving(true);
      setErrors({});
      try {
        const tournament = await createGuestTournament(
          { ...input, ...logos },
          repository,
        );
        onCreated(tournament);
      } catch (error) {
        if (error instanceof TournamentValidationError) {
          const validationErrors: TournamentCreationErrors = {};
          for (const issue of error.issues) {
            validationErrors[issue.field] ??= issue.message;
          }
          setErrors(validationErrors);
        } else {
          setErrors({ form: storageErrorMessage(error) });
        }
        setIsSaving(false);
      }
    },
    [isSaving, logos, onCreated, repository],
  );

  return { clearError, errors, isSaving, logos, selectLogo, submit };
}
