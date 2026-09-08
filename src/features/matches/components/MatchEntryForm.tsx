import type { FormEvent, KeyboardEvent, RefObject } from "react";

import type { TournamentMatch } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";
import { formatMatchEntryIssue } from "@/features/matches/matchEntryIssues";
import type { MatchDraftController } from "@/features/matches/useMatchDraftState";
import type { MatchPersistenceController } from "@/features/matches/useMatchPersistence";

import { MatchResultGrid } from "./MatchResultGrid";

interface MatchEntryFormProps {
  readonly draft: MatchDraftController;
  readonly editorRef: RefObject<HTMLFormElement | null>;
  readonly match: TournamentMatch;
  readonly persistence: MatchPersistenceController;
  readonly teams: readonly Team[];
  readonly onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function MatchEntryForm({
  draft,
  editorRef,
  match,
  persistence,
  teams,
  onInputKeyDown,
}: MatchEntryFormProps) {
  const uniqueMessages = [...new Set(draft.issues.map(formatMatchEntryIssue))];

  return (
    <form
      className="panel mt-5 overflow-hidden"
      ref={editorRef}
      data-match-entry={match.id}
      onSubmit={(event: FormEvent) => event.preventDefault()}
      onBlur={persistence.handleEditorBlur}
    >
      <div className="border-b border-white/8 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Manual result entry</p>
            <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">
              Match {match.matchNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${match.status === "FINALIZED" ? "bg-lime-300/10 text-lime-200" : "bg-amber-300/10 text-amber-200"}`}>
              {match.status === "FINALIZED" ? "Finalized" : "Draft"}
            </span>
            <button
              className="min-h-10 rounded-lg px-2 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white"
              type="button"
              disabled={persistence.explicitAction !== null}
              onClick={() => void persistence.close()}
            >
              Close
            </button>
          </div>
        </div>
        <label className="field-label mt-4" htmlFor={`match-name-${match.id}`}>
          Match name <span className="field-optional">Optional</span>
        </label>
        <input
          className="field-control"
          id={`match-name-${match.id}`}
          maxLength={80}
          placeholder={`Match ${match.matchNumber}`}
          disabled={persistence.editorLocked}
          value={draft.draftName}
          onChange={(event) => draft.markNameChanged(event.currentTarget.value)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-4 py-3 sm:px-6">
        <p className="text-sm text-slate-400">
          Enter placement, then finishes. Press Enter to continue.
        </p>
        <button
          className="min-h-11 rounded-lg border border-white/10 px-3 text-sm font-bold text-slate-200 hover:border-lime-300/40 hover:text-lime-300"
          type="button"
          disabled={draft.isLoading || persistence.editorLocked}
          onClick={draft.autoFillPlacements}
        >
          Auto-fill placements
        </button>
      </div>

      {uniqueMessages.length > 0 ? (
        <div className="border-b border-red-400/20 bg-red-400/5 px-4 py-3 sm:px-6" role="alert">
          <p className="text-sm font-black text-red-200">Fix these rows before finalizing:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-red-300">
            {uniqueMessages.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </div>
      ) : null}

      {draft.isLoading ? (
        <p className="p-5 text-sm text-slate-400" role="status">Opening result draft…</p>
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

      <div className="border-t border-white/8 p-4 sm:p-6">
        {draft.error ? <p className="mb-3 text-sm text-red-300" role="alert">{draft.error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500" role="status">
            {draft.saveState === "saving" ? "Saving…" : draft.saveState === "saved" ? "Saved" : draft.isDirty ? "Changes waiting to save" : "Saved"}
          </span>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <button
              className="min-h-12 rounded-lg border border-white/10 px-4 text-sm font-black text-white disabled:opacity-50"
              type="button"
              disabled={draft.isLoading || persistence.editorLocked}
              onClick={() => void persistence.save()}
            >
              Save Draft
            </button>
            <button
              className="primary-action min-h-12 px-4 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={draft.isLoading || persistence.editorLocked}
              onClick={() => void persistence.finalize()}
            >
              Finalize Match
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
