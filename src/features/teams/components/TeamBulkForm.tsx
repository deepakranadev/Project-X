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
  readonly onCancel?: () => void;
}

function teamCountLabel(count: number): string {
  return `${count} ${count === 1 ? "team" : "teams"} detected`;
}

export function TeamBulkForm({
  existingTeams,
  tournamentId,
  repository,
  onCreated,
  onCancel,
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
    <form
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm"
      onSubmit={handleSubmit}
      noValidate
      id="bulk-add-section"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            Fast roster entry
          </span>
          <h2 className="mt-1 text-lg font-bold text-slate-900 tracking-tight">
            Paste one team per line
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-orange-50 text-[#e05305] border border-orange-100/80 px-2.5 py-0.5 text-xs font-semibold">
            Bulk add
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium px-1.5 py-0.5"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <label className="sr-only" htmlFor="bulkTeamNames">
        Paste one team per line
      </label>
      <Textarea
        className="mt-4 min-h-36 resize-y w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e05305] focus:border-[#e05305] leading-6 font-sans shadow-xs"
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

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
        <p
          className={`text-xs font-bold ${validation.detectedCount > 0 ? "text-emerald-600" : "text-slate-400"
            }`}
          id="bulk-team-summary"
          aria-live="polite"
        >
          {teamCountLabel(validation.detectedCount)}
        </p>
        <p className="text-xs text-slate-400">Blank lines are ignored</p>
      </div>

      {errors.length > 0 ? (
        <ul
          className="mt-3 space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-600"
          id="bulk-team-errors"
          role="alert"
        >
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex items-center justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="text-xs font-medium text-slate-600 border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </Button>
        )}
        <Button
          className="w-full sm:w-auto px-6 py-2.5 bg-[#e05305] hover:bg-[#c94703] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isSaving || validation.issues.length > 0 || validation.detectedCount === 0}
        >
          {isSaving
            ? "Adding teams…"
            : `Add ${validation.detectedCount || ""} ${validation.detectedCount === 1 ? "Team" : "Teams"
            }`}
        </Button>
      </div>
    </form>
  );
}
