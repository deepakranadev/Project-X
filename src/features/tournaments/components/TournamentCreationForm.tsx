"use client";

import { type ChangeEvent, type FormEvent } from "react";

import {
  MAX_ORGANIZER_NAME_LENGTH,
  MAX_TOURNAMENT_NAME_LENGTH,
} from "@/domain/tournaments/validation";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import type { GuestTournament } from "@/features/tournaments/types";
import {
  type TournamentLogoField,
  useTournamentCreation,
} from "@/features/tournaments/useTournamentCreation";
import { TOURNAMENT_LOGO_FILE_SIZE_LIMIT_MB } from "@/features/tournaments/validation";

interface TournamentCreationFormProps {
  readonly repository: GuestTournamentRepository;
  readonly onCreated: (tournament: GuestTournament) => void;
}

export function TournamentCreationForm({
  repository,
  onCreated,
}: TournamentCreationFormProps) {
  const controller = useTournamentCreation(repository, onCreated);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>, field: TournamentLogoField) {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!controller.selectLogo(field, file)) event.currentTarget.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (controller.isSaving) return;

    const formData = new FormData(event.currentTarget);
    void controller.submit({
      name: String(formData.get("name") ?? ""),
      game: String(formData.get("game") ?? ""),
      organizerName: String(formData.get("organizerName") ?? ""),
    });
  }

  const { clearError, errors, isSaving, logos } = controller;

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
          Maximum {TOURNAMENT_LOGO_FILE_SIZE_LIMIT_MB} MB
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
          Maximum {TOURNAMENT_LOGO_FILE_SIZE_LIMIT_MB} MB
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
