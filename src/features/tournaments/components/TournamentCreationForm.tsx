"use client";

import { type ChangeEvent } from "react";

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
  const { formError, formik, logos } = controller;

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>, field: TournamentLogoField) {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!controller.selectLogo(field, file)) event.currentTarget.value = "";
  }

  return (
    <form className="panel space-y-5 p-5 sm:p-7" onSubmit={formik.handleSubmit} noValidate>
      <div>
        <label className="field-label" htmlFor="name">
          Tournament name
        </label>
        <input
          className="field-control"
          id="name"
          placeholder="e.g. Sunday Showdown"
          autoComplete="off"
          maxLength={MAX_TOURNAMENT_NAME_LENGTH}
          aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
          aria-describedby={formik.touched.name && formik.errors.name ? "name-error" : undefined}
          required
          autoFocus
          {...formik.getFieldProps("name")}
        />
        {formik.touched.name && formik.errors.name ? (
          <p className="field-error" id="name-error">
            {formik.errors.name as string}
          </p>
        ) : null}
      </div>

      <div>
        <label className="field-label" htmlFor="game">
          Game
        </label>
        <select className="field-control" id="game" {...formik.getFieldProps("game")}>
          <option value="BGMI">BGMI</option>
        </select>
        {formik.touched.game && formik.errors.game ? <p className="field-error">{formik.errors.game as string}</p> : null}
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
        {formik.errors.tournamentLogo ? (
          <p className="field-error">{formik.errors.tournamentLogo as string}</p>
        ) : null}
      </div>

      <div>
        <label className="field-label" htmlFor="organizerName">
          Organizer name <span className="field-optional">Optional</span>
        </label>
        <input
          className="field-control"
          id="organizerName"
          placeholder="e.g. Nova Esports"
          autoComplete="organization"
          maxLength={MAX_ORGANIZER_NAME_LENGTH}
          aria-invalid={Boolean(formik.touched.organizerName && formik.errors.organizerName)}
          {...formik.getFieldProps("organizerName")}
        />
        {formik.touched.organizerName && formik.errors.organizerName ? (
          <p className="field-error">{formik.errors.organizerName as string}</p>
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
        {formik.errors.organizerLogo ? (
          <p className="field-error">{formik.errors.organizerLogo as string}</p>
        ) : null}
      </div>

      {formError ? (
        <p className="field-error rounded-lg border border-red-400/20 bg-red-400/5 p-3" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        className="primary-action mt-2 w-full disabled:cursor-wait disabled:opacity-70"
        type="submit"
        disabled={formik.isSubmitting}
      >
        {formik.isSubmitting ? "Saving…" : "Create Tournament"}
        <span aria-hidden="true">{formik.isSubmitting ? "" : "→"}</span>
      </button>
    </form>
  );
}
