"use client";

import { useFormik } from "formik";
import { useRef, useState } from "react";

import { createGuestTournament } from "./createGuestTournament";
import type { GuestTournamentRepository } from "./tournamentRepository";
import type { GuestTournament } from "./types";
import {
  TournamentValidationError,
  validateTournamentImage,
} from "./validation";

export type TournamentLogoField = "tournamentLogo" | "organizerLogo";

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
  const [formError, setFormError] = useState<string | null>(null);
  const isSaving = useRef(false);
  const [isSavingState, setIsSavingState] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      game: "BGMI",
      organizerName: "",
      tournamentLogo: undefined as unknown,
      organizerLogo: undefined as unknown,
    },
    onSubmit: async (values, { setErrors }) => {
      if (isSaving.current) return;
      isSaving.current = true;
      setIsSavingState(true);
      setFormError(null);
      try {
        const tournament = await createGuestTournament(
          { ...values, ...logos },
          repository,
        );
        onCreated(tournament);
      } catch (error) {
        if (error instanceof TournamentValidationError) {
          const validationErrors: Record<string, string> = {};
          for (const issue of error.issues) {
            validationErrors[issue.field] ??= issue.message;
          }
          setErrors(validationErrors);
        } else {
          setFormError(storageErrorMessage(error));
        }
      } finally {
        isSaving.current = false;
        setIsSavingState(false);
      }
    },
  });

  function selectLogo(field: TournamentLogoField, file: File | null): boolean {
    if (!file) {
      setLogos((current) => ({ ...current, [field]: null }));
      formik.setFieldError(field, undefined);
      return true;
    }
    const image = { blob: file, fileName: file.name };
    const issues = validateTournamentImage(image, field);
    if (issues.length > 0) {
      setLogos((current) => ({ ...current, [field]: null }));
      formik.setFieldError(field, issues[0]?.message);
      setFormError(null);
      return false;
    }
    setLogos((current) => ({ ...current, [field]: image }));
    formik.setFieldError(field, undefined);
    return true;
  }

  return { formError, formik, isSaving: isSavingState, logos, selectLogo };
}
