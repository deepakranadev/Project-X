"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";

import type {
  CreateTournamentInput,
  TournamentImage,
} from "@/domain/tournaments/types";
import {
  MAX_LOGO_FILE_SIZE_BYTES,
  MAX_ORGANIZER_NAME_LENGTH,
  MAX_TOURNAMENT_NAME_LENGTH,
  TournamentValidationError,
  type TournamentValidationField,
  validateTournamentImage,
} from "@/domain/tournaments/validation";
import { getClientTournamentRepository } from "@/lib/persistence/clientTournamentRepository";
import { createGuestTournament } from "@/lib/persistence/createGuestTournament";

type LogoField = "tournamentLogo" | "organizerLogo";
type FormErrors = Partial<
  Record<TournamentValidationField | "form", string>
>;

function errorMessageForStorage(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "This device is out of browser storage. Free some space, then try again.";
  }

  return "We could not save this tournament on your device. Check browser storage permissions and try again.";
}

export function TournamentCreationForm() {
  const router = useRouter();
  const [logos, setLogos] = useState<
    Record<LogoField, TournamentImage | null>
  >({
    tournamentLogo: null,
    organizerLogo: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  function clearError(field: TournamentValidationField): void {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function handleLogoChange(
    event: ChangeEvent<HTMLInputElement>,
    field: LogoField,
  ): void {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!file) {
      setLogos((current) => ({ ...current, [field]: null }));
      clearError(field);
      return;
    }

    const image: TournamentImage = { blob: file, fileName: file.name };
    const issues = validateTournamentImage(image, field);
    if (issues.length > 0) {
      setLogos((current) => ({ ...current, [field]: null }));
      setErrors((current) => ({
        ...current,
        [field]: issues[0]?.message,
        form: undefined,
      }));
      event.currentTarget.value = "";
      return;
    }

    setLogos((current) => ({ ...current, [field]: image }));
    clearError(field);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const formData = new FormData(event.currentTarget);
    const input: CreateTournamentInput = {
      name: String(formData.get("name") ?? ""),
      game: String(formData.get("game") ?? ""),
      tournamentLogo: logos.tournamentLogo,
      organizerName: String(formData.get("organizerName") ?? ""),
      organizerLogo: logos.organizerLogo,
    };

    setIsSaving(true);
    setErrors({});

    try {
      const tournament = await createGuestTournament(
        input,
        getClientTournamentRepository(),
      );
      router.push(`/tournaments/${encodeURIComponent(tournament.id)}`);
    } catch (error) {
      if (error instanceof TournamentValidationError) {
        const validationErrors: FormErrors = {};
        for (const issue of error.issues) {
          validationErrors[issue.field] ??= issue.message;
        }
        setErrors(validationErrors);
      } else {
        setErrors({ form: errorMessageForStorage(error) });
      }
      setIsSaving(false);
    }
  }

  return (
    <form className="panel space-y-5 p-5 sm:p-7" onSubmit={handleSubmit} noValidate>
      <div>
        <label className="field-label" htmlFor="name">
          Tournament name
        </label>
        <input
          className="field-control"
          id="name"
          name="name"
          placeholder="e.g. Sunday Showdown"
          autoComplete="off"
          maxLength={MAX_TOURNAMENT_NAME_LENGTH}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          onChange={() => clearError("name")}
          required
          autoFocus
        />
        {errors.name ? (
          <p className="field-error" id="name-error">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label className="field-label" htmlFor="game">
          Game
        </label>
        <select className="field-control" id="game" name="game" defaultValue="BGMI">
          <option value="BGMI">BGMI</option>
        </select>
        {errors.game ? <p className="field-error">{errors.game}</p> : null}
      </div>

      <div>
        <span className="field-label">
          Tournament logo <span className="field-optional">Optional</span>
        </span>
        <label className="file-control" htmlFor="tournamentLogo">
          <span className="min-w-0 truncate">
            {logos.tournamentLogo?.fileName ?? "Choose PNG, JPG, or WEBP"}
          </span>
          <strong className="shrink-0 text-lime-300">Browse</strong>
          <input
            className="sr-only"
            id="tournamentLogo"
            name="tournamentLogo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-describedby="tournamentLogo-hint"
            onChange={(event) => handleLogoChange(event, "tournamentLogo")}
          />
        </label>
        <p className="mt-2 text-xs text-slate-500" id="tournamentLogo-hint">
          Maximum {MAX_LOGO_FILE_SIZE_BYTES / 1024 / 1024} MB
        </p>
        {errors.tournamentLogo ? (
          <p className="field-error">{errors.tournamentLogo}</p>
        ) : null}
      </div>

      <div>
        <label className="field-label" htmlFor="organizerName">
          Organizer name <span className="field-optional">Optional</span>
        </label>
        <input
          className="field-control"
          id="organizerName"
          name="organizerName"
          placeholder="e.g. Nova Esports"
          autoComplete="organization"
          maxLength={MAX_ORGANIZER_NAME_LENGTH}
          aria-invalid={Boolean(errors.organizerName)}
          onChange={() => clearError("organizerName")}
        />
        {errors.organizerName ? (
          <p className="field-error">{errors.organizerName}</p>
        ) : null}
      </div>

      <div>
        <span className="field-label">
          Organizer logo <span className="field-optional">Optional</span>
        </span>
        <label className="file-control" htmlFor="organizerLogo">
          <span className="min-w-0 truncate">
            {logos.organizerLogo?.fileName ?? "Choose PNG, JPG, or WEBP"}
          </span>
          <strong className="shrink-0 text-lime-300">Browse</strong>
          <input
            className="sr-only"
            id="organizerLogo"
            name="organizerLogo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-describedby="organizerLogo-hint"
            onChange={(event) => handleLogoChange(event, "organizerLogo")}
          />
        </label>
        <p className="mt-2 text-xs text-slate-500" id="organizerLogo-hint">
          Maximum {MAX_LOGO_FILE_SIZE_BYTES / 1024 / 1024} MB
        </p>
        {errors.organizerLogo ? (
          <p className="field-error">{errors.organizerLogo}</p>
        ) : null}
      </div>

      {errors.form ? (
        <p className="field-error rounded-lg border border-red-400/20 bg-red-400/5 p-3" role="alert">
          {errors.form}
        </p>
      ) : null}

      <button
        className="primary-action mt-2 w-full disabled:cursor-wait disabled:opacity-70"
        type="submit"
        disabled={isSaving}
      >
        {isSaving ? "Saving…" : "Create Tournament"}
        <span aria-hidden="true">{isSaving ? "" : "→"}</span>
      </button>
    </form>
  );
}
