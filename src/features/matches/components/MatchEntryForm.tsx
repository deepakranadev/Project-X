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
      <div className="border-b border-border bg-surface p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Manual result entry</p>
            <h3 className="mt-1 text-xl font-black text-foreground sm:text-2xl">
              Match {match.matchNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-black border ${match.status === "FINALIZED" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "border-amber-500/20 bg-amber-500/10 text-amber-700"}`}>
              {match.status === "FINALIZED" ? "Finalized" : "Draft"}
            </span>
            <button
              className="min-h-10 rounded-lg px-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Enter placement, then finishes. Press Enter to continue.
        </p>
        <button
          className="min-h-11 rounded-lg border border-border bg-surface-raised px-3 text-sm font-bold text-foreground transition-colors hover:border-foreground/30 hover:bg-foreground/5"
          type="button"
          disabled={draft.isLoading || persistence.editorLocked}
          onClick={draft.autoFillPlacements}
        >
          Auto-fill placements
        </button>
      </div>

      {uniqueMessages.length > 0 ? (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 sm:px-6" role="alert">
          <p className="text-sm font-black text-red-700">Fix these rows before finalizing:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-red-600">
            {uniqueMessages.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </div>
      ) : null}

      {draft.isLoading ? (
        <p className="p-5 text-sm text-muted-foreground bg-surface" role="status">Opening result draft…</p>
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

      <div className="border-t border-border bg-surface p-4 sm:p-6">
        {draft.error ? <p className="mb-3 text-sm text-red-600" role="alert">{draft.error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-muted-foreground" role="status">
            {draft.saveState === "saving" ? "Saving…" : draft.saveState === "saved" ? "Saved" : draft.isDirty ? "Changes waiting to save" : "Saved"}
          </span>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <button
              className="secondary-action min-h-12 px-4 disabled:opacity-50"
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
