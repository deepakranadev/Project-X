"use client";

import { type FormEvent } from "react";

import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTeam } from "@/features/teams/types";
import { useTeamBulkEntry } from "@/features/teams/useTeamBulkEntry";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

interface TeamBulkFormProps {
  readonly existingTeams: readonly GuestTeam[];
  readonly tournamentId: string;
  readonly repository: GuestTeamRepository;
  readonly onCreated: (teams: readonly GuestTeam[]) => void;
}

function teamCountLabel(count: number): string {
  return `${count} ${count === 1 ? "team" : "teams"} detected`;
}

export function TeamBulkForm({
  existingTeams,
  tournamentId,
  repository,
  onCreated,
}: TeamBulkFormProps) {
  const controller = useTeamBulkEntry(
    tournamentId,
    existingTeams,
    repository,
    onCreated,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void controller.submit();
  }

  const { errors, isSaving, pastedNames, validation } = controller;

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
      <Textarea
        className="field-control mt-4 min-h-44 resize-y leading-7"
        id="bulkTeamNames"
        name="bulkTeamNames"
        value={pastedNames}
        placeholder={"Team Soul\nGodLike Esports\nTeam XSpark\nOrangutan\n8Bit\nRevenant"}
        autoCapitalize="words"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          controller.changePastedNames(event.currentTarget.value);
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

      <Button
        className="primary-action mt-5 w-full disabled:cursor-not-allowed"
        type="submit"
        disabled={isSaving || validation.issues.length > 0}
      >
        {isSaving
          ? "Adding teams…"
          : `Add ${validation.detectedCount} ${validation.detectedCount === 1 ? "Team" : "Teams"}`}
        <span aria-hidden="true">{isSaving ? "" : "→"}</span>
      </Button>
    </form>
  );
}
