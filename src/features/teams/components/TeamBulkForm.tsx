"use client";

import { type FormEvent, useMemo, useState } from "react";

import { validateBulkTeamNames } from "@/domain/teams/parseBulkTeamNames";
import type { Team } from "@/domain/teams/types";
import {
  createGuestTeamsFromText,
  GuestTeamCreationError,
} from "@/features/teams/createGuestTeams";
import { getClientTeamRepository } from "@/infrastructure/persistence/indexed-db/clientTeamRepository";

interface TeamBulkFormProps {
  readonly existingTeams: readonly Team[];
  readonly tournamentId: string;
  readonly onCreated: () => Promise<void>;
}

function teamCountLabel(count: number): string {
  return `${count} ${count === 1 ? "team" : "teams"} detected`;
}

export function TeamBulkForm({
  existingTeams,
  tournamentId,
  onCreated,
}: TeamBulkFormProps) {
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
  const errors = serverErrors.length > 0 ? serverErrors : visibleIssues;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setSubmitted(true);
    setServerErrors([]);
    if (validation.issues.length > 0) return;

    setIsSaving(true);
    try {
      await createGuestTeamsFromText(
        tournamentId,
        pastedNames,
        getClientTeamRepository(),
      );
      setPastedNames("");
      setSubmitted(false);
      await onCreated();
    } catch (error) {
      if (error instanceof GuestTeamCreationError) {
        setServerErrors(error.issues.map((issue) => issue.message));
      } else {
        setServerErrors([
          error instanceof Error
            ? error.message
            : "Teams could not be saved. Check browser storage and try again.",
        ]);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel p-5 sm:p-6" onSubmit={handleSubmit} noValidate>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Fast roster entry</p>
          <h2 className="mt-2 text-xl font-extrabold text-white">
            Paste one team per line
          </h2>
        </div>
        <span className="rounded-md bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-400">
          Bulk add
        </span>
      </div>

      <label className="sr-only" htmlFor="bulkTeamNames">
        Paste one team per line
      </label>
      <textarea
        className="field-control mt-4 min-h-44 resize-y leading-7"
        id="bulkTeamNames"
        name="bulkTeamNames"
        value={pastedNames}
        placeholder={"Team Soul\nGodLike Esports\nTeam XSpark\nOrangutan\n8Bit\nRevenant"}
        autoCapitalize="words"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setPastedNames(event.currentTarget.value);
          setServerErrors([]);
          setSubmitted(false);
        }}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        aria-describedby="bulk-team-summary bulk-team-errors"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-sm font-bold text-lime-300"
          id="bulk-team-summary"
          aria-live="polite"
        >
          {teamCountLabel(validation.detectedCount)}
        </p>
        <p className="text-xs text-slate-500">Blank lines are ignored</p>
      </div>

      {errors.length > 0 ? (
        <ul
          className="mt-4 space-y-2 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm leading-5 text-red-300"
          id="bulk-team-errors"
          role="alert"
        >
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}

      <button
        className="primary-action mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={isSaving || validation.issues.length > 0}
      >
        {isSaving
          ? "Adding teams…"
          : `Add ${validation.detectedCount} ${validation.detectedCount === 1 ? "Team" : "Teams"}`}
        <span aria-hidden="true">{isSaving ? "" : "→"}</span>
      </button>
    </form>
  );
}
