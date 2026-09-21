"use client";

import type { FormEvent, KeyboardEvent, RefObject } from "react";

import type { TournamentMatch } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";
import { formatMatchEntryIssue } from "@/features/matches/matchEntryIssues";
import type { MatchDraftController } from "@/features/matches/useMatchDraftState";
import type { MatchPersistenceController } from "@/features/matches/useMatchPersistence";

import { MatchEntryActions } from "./MatchEntryActions";
import { MatchEntryHeader } from "./MatchEntryHeader";
import { MatchEntryToolbar } from "./MatchEntryToolbar";
import { MatchResultGrid } from "./MatchResultGrid";

interface MatchEntryFormProps {
  readonly tournamentId: string;
  readonly tournamentName?: string;
  readonly draft: MatchDraftController;
  readonly editorRef: RefObject<HTMLFormElement | null>;
  readonly match: TournamentMatch;
  readonly persistence: MatchPersistenceController;
  readonly teams: readonly Team[];
  readonly onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function MatchEntryForm({
  tournamentId,
  tournamentName,
  draft,
  editorRef,
  match,
  persistence,
  teams,
  onInputKeyDown,
}: MatchEntryFormProps) {
  const uniqueMessages = [...new Set(draft.issues.map(formatMatchEntryIssue))];

  const enteredCount = draft.results.filter(
    (r) =>
      r.participationStatus === "DNP" ||
      (r.placement !== null && r.kills !== null),
  ).length;

  return (
    <form
      className="w-full space-y-4"
      ref={editorRef}
      data-match-entry={match.id}
      onSubmit={(event: FormEvent) => event.preventDefault()}
      onBlur={persistence.handleEditorBlur}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
        {/* Header section: breadcrumb, title, badges */}
        <div className="col-start-1 row-start-1">
          <MatchEntryHeader
            tournamentId={tournamentId}
            tournamentName={tournamentName}
            match={match}
            draft={draft}
            persistence={persistence}
          />
        </div>

        {/* Action buttons: Top right on desktop, bottom on mobile */}
        <div className="col-start-1 row-start-6 md:col-start-2 md:row-start-1 pt-1 md:pt-6">
          <MatchEntryActions
            isLoading={draft.isLoading}
            editorLocked={persistence.editorLocked}
            onSave={() => void persistence.save()}
            onFinalize={() => void persistence.finalize()}
          />
        </div>

        {/* Optional match name input */}
        <div className="col-span-1 md:col-span-2 row-start-2 flex items-center gap-2">
          <label
            htmlFor={`match-name-${match.id}`}
            className="text-xs font-semibold text-slate-600"
          >
            Match name <span className="text-[11px] font-normal text-slate-400">Optional</span>
          </label>
          <input
            className="h-8 max-w-xs rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 shadow-sm focus:border-[#e05305] focus:outline-none focus:ring-1 focus:ring-[#e05305]/30 disabled:bg-slate-50 disabled:text-slate-400"
            id={`match-name-${match.id}`}
            maxLength={80}
            placeholder={`Match ${match.matchNumber}`}
            disabled={persistence.editorLocked}
            value={draft.draftName}
            onChange={(event) => draft.markNameChanged(event.currentTarget.value)}
          />
        </div>

        {/* Progress bar and autofill toolbar */}
        <div className="col-span-1 md:col-span-2 row-start-3">
          <MatchEntryToolbar
            totalTeams={teams.length}
            enteredCount={enteredCount}
            isLoading={draft.isLoading}
            editorLocked={persistence.editorLocked}
            onAutoFill={draft.autoFillPlacements}
          />
        </div>

        {/* Error message */}
        {draft.error ? (
          <div
            className="col-span-1 md:col-span-2 row-start-4 rounded-xl border border-red-200 bg-red-50 p-3"
            role="alert"
          >
            <p className="text-xs font-bold text-red-700">{draft.error}</p>
          </div>
        ) : null}

        {/* Validation issues banner */}
        {uniqueMessages.length > 0 ? (
          <div
            className="col-span-1 md:col-span-2 row-start-4 rounded-xl border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <p className="text-xs font-black text-red-700">
              Fix these rows before finalizing:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-red-600">
              {uniqueMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Result grid or loading indicator */}
        <div className="col-span-1 md:col-span-2 row-start-5">
          {draft.isLoading ? (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-8 text-center"
              role="status"
            >
              <p className="text-xs font-semibold text-slate-400">
                Opening result draft…
              </p>
            </div>
          ) : (
            <MatchResultGrid
              disabled={persistence.editorLocked}
              issues={draft.issues}
              results={draft.results}
              teams={teams}
              onInputKeyDown={onInputKeyDown}
              onNumberChange={draft.updateNumber}
              onToggleDnp={draft.toggleDnp}
            />
          )}
        </div>
      </div>
    </form>
  );
}
