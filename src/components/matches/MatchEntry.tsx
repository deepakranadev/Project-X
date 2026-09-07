"use client";

import {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createEmptyManualResults } from "@/domain/matches/createEmptyManualResults";
import type {
  StoredMatchResult,
  TournamentMatch,
} from "@/domain/matches/types";
import {
  type ManualMatchValidationIssue,
  validateManualMatchResults,
} from "@/domain/matches/validation";
import type { Team } from "@/domain/teams/types";
import { finalizeGuestMatch } from "@/lib/persistence/finalizeGuestMatch";
import { getClientMatchRepository } from "@/lib/persistence/clientMatchRepository";
import { getClientMatchResultRepository } from "@/lib/persistence/clientMatchResultRepository";
import { getClientTeamRepository } from "@/lib/persistence/clientTeamRepository";

import { formatMatchEntryIssue, matchResultHasIssue } from "./matchEntryIssues";
import { MatchResultRow } from "./MatchResultRow";

interface MatchEntryProps {
  readonly match: TournamentMatch;
  readonly teams: readonly Team[];
  readonly onClose: () => void;
  readonly onMatchChange: (match: TournamentMatch) => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function MatchEntry({
  match,
  teams,
  onClose,
  onMatchChange,
}: MatchEntryProps) {
  const [results, setResults] = useState<readonly StoredMatchResult[]>([]);
  const [draftName, setDraftName] = useState(match.name ?? "");
  const [status, setStatus] = useState(match.status);
  const [issues, setIssues] = useState<readonly ManualMatchValidationIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLFormElement>(null);
  const resultsRef = useRef<readonly StoredMatchResult[]>([]);
  const nameRef = useRef(draftName);
  const revisionRef = useRef(0);

  const replaceResults = useCallback(
    (next: readonly StoredMatchResult[], markDirty = true) => {
      resultsRef.current = next;
      setResults(next);
      if (markDirty) {
        const nextRevision = revisionRef.current + 1;
        revisionRef.current = nextRevision;
        setRevision(nextRevision);
        setIsDirty(true);
        setStatus("DRAFT");
        setSaveState("idle");
        setError(null);
        setIssues([]);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;

    async function loadResults() {
      try {
        const stored = await getClientMatchResultRepository().getResultsByMatch(
          match.tournamentId,
          match.id,
        );
        if (!active) return;
        const storedByTeam = new Map(stored.map((result) => [result.teamId, result]));
        const missingTeams = teams.filter((team) => !storedByTeam.has(team.id));
        const created = createEmptyManualResults({
          tournamentId: match.tournamentId,
          matchId: match.id,
          teams: missingTeams,
        });
        const currentTeamIds = new Set(teams.map((team) => team.id));
        const ordered = [
          ...teams.map((team) => storedByTeam.get(team.id) ?? created.find((result) => result.teamId === team.id)),
          ...stored.filter((result) => !currentTeamIds.has(result.teamId)),
        ].filter((result): result is StoredMatchResult => Boolean(result));

        if (created.length > 0) {
          await getClientMatchResultRepository().bulkSaveResults(
            match.tournamentId,
            match.id,
            created,
          );
        }
        if (!active) return;
        replaceResults(ordered, false);
      } catch {
        if (active) {
          setError(
            "The saved result draft could not be opened. Check browser storage permissions and try again.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadResults();
    return () => {
      active = false;
    };
  }, [match.id, match.tournamentId, replaceResults, teams]);

  const saveDraft = useCallback(async (force = false): Promise<boolean> => {
    if (!force && !isDirty) return true;
    const savingRevision = revisionRef.current;
    setSaveState("saving");
    setError(null);
    try {
      await getClientMatchResultRepository().saveDraftResults(
        match.tournamentId,
        match.id,
        resultsRef.current,
      );
      const updated = await getClientMatchRepository().updateMatch(
        match.tournamentId,
        match.id,
        { name: nameRef.current.trim() || undefined, status: "DRAFT" },
      );
      if (!updated) throw new Error("The match no longer exists.");
      setStatus("DRAFT");
      onMatchChange(updated);
      if (revisionRef.current === savingRevision) {
        setIsDirty(false);
        setSaveState("saved");
      }
      return true;
    } catch {
      setSaveState("error");
      setError(
        "This draft could not be saved. Check browser storage permissions and try again.",
      );
      return false;
    }
  }, [isDirty, match.id, match.tournamentId, onMatchChange]);

  useEffect(() => {
    if (!isDirty || isLoading) return;
    const timer = window.setTimeout(() => void saveDraft(), 500);
    return () => window.clearTimeout(timer);
  }, [isDirty, isLoading, revision, saveDraft]);

  useEffect(() => {
    if (!isDirty && saveState !== "saving") return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty, saveState]);

  useEffect(() => {
    if (!isDirty) return;
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") void saveDraft(true);
    };
    const flushOnPageHide = () => void saveDraft(true);
    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("pagehide", flushOnPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("pagehide", flushOnPageHide);
    };
  }, [isDirty, saveDraft]);

  function markNameChanged(value: string) {
    nameRef.current = value;
    setDraftName(value);
    const nextRevision = revisionRef.current + 1;
    revisionRef.current = nextRevision;
    setRevision(nextRevision);
    setIsDirty(true);
    setStatus("DRAFT");
    setSaveState("idle");
    setError(null);
  }

  function updateNumber(
    resultIndex: number,
    field: "placement" | "kills",
    rawValue: string,
  ) {
    const value = rawValue === "" ? null : Number(rawValue);
    replaceResults(
      results.map((result, index) =>
        index === resultIndex ? { ...result, [field]: value } : result,
      ),
    );
  }

  function toggleDnp(resultIndex: number) {
    replaceResults(
      results.map((result, index) => {
        if (index !== resultIndex) return result;
        if (result.participationStatus === "PLAYED") {
          return {
            ...result,
            placement: null,
            kills: null,
            participationStatus: "DNP" as const,
          };
        }
        return { ...result, participationStatus: "PLAYED" as const };
      }),
    );
  }

  function autoFillPlacements() {
    let placement = 0;
    replaceResults(
      results.map((result) => {
        if (result.participationStatus === "DNP") return result;
        placement += 1;
        return { ...result, placement };
      }),
    );
  }

  function focusNextInput(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const inputs = Array.from(
      editorRef.current?.querySelectorAll<HTMLInputElement>(
        "input[data-result-input]:not(:disabled)",
      ) ?? [],
    );
    const currentIndex = inputs.indexOf(event.currentTarget);
    const next = inputs[currentIndex + 1];
    if (next) {
      next.focus();
      next.select();
    }
  }

  function handleEditorBlur(event: FocusEvent<HTMLFormElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    if (isDirty) void saveDraft();
  }

  async function handleClose() {
    const saved = await saveDraft(true);
    if (saved) onClose();
  }

  async function handleFinalize() {
    const validation = validateManualMatchResults(resultsRef.current, {
      tournamentId: match.tournamentId,
      matchId: match.id,
      participantTeamIds: teams.map((team) => team.id),
    });
    if (!validation.valid) {
      setIssues(validation.issues);
      await saveDraft(true);
      return;
    }

    setSaveState("saving");
    setError(null);
    try {
      const finalized = await finalizeGuestMatch({
        tournamentId: match.tournamentId,
        matchId: match.id,
        name: nameRef.current,
        results: resultsRef.current,
        matchRepository: getClientMatchRepository(),
        matchResultRepository: getClientMatchResultRepository(),
        teamRepository: getClientTeamRepository(),
      });
      if (!finalized.ok) {
        setIssues(finalized.issues);
        setStatus("DRAFT");
        setSaveState("saved");
        return;
      }
      resultsRef.current = finalized.results;
      setResults(finalized.results);
      setIssues([]);
      setStatus("FINALIZED");
      setIsDirty(false);
      setSaveState("saved");
      onMatchChange(finalized.match);
    } catch {
      setSaveState("error");
      setError("The match could not be finalized. Your draft remains available.");
    }
  }

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const uniqueMessages = [...new Set(issues.map(formatMatchEntryIssue))];

  return (
    <form
      className="panel mt-5 overflow-hidden"
      ref={editorRef}
      data-match-entry={match.id}
      onSubmit={(event) => event.preventDefault()}
      onBlur={handleEditorBlur}
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
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-black ${
                status === "FINALIZED"
                  ? "bg-lime-300/10 text-lime-200"
                  : "bg-amber-300/10 text-amber-200"
              }`}
            >
              {status === "FINALIZED" ? "Finalized" : "Draft"}
            </span>
            <button
              className="min-h-10 rounded-lg px-2 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white"
              type="button"
              onClick={() => void handleClose()}
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
          value={draftName}
          onChange={(event) => markNameChanged(event.currentTarget.value)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-4 py-3 sm:px-6">
        <p className="text-sm text-slate-400">
          Enter placement, then finishes. Press Enter to continue.
        </p>
        <button
          className="min-h-11 rounded-lg border border-white/10 px-3 text-sm font-bold text-slate-200 hover:border-lime-300/40 hover:text-lime-300"
          type="button"
          disabled={isLoading}
          onClick={autoFillPlacements}
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

      {isLoading ? (
        <p className="p-5 text-sm text-slate-400" role="status">Opening result draft…</p>
      ) : (
        <div className="divide-y divide-white/6" data-testid="manual-result-grid">
          <div className="grid grid-cols-[minmax(0,1fr)_3.75rem_3.75rem_3.25rem] gap-1.5 bg-white/2 px-3 py-2 text-[0.68rem] font-black uppercase tracking-wide text-slate-500 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_4.5rem] sm:gap-3 sm:px-6">
            <span>Team</span><span className="text-center">Place</span><span className="text-center">Fin</span><span className="text-center">DNP</span>
          </div>
          {results.map((result, index) => {
            const team = teamById.get(result.teamId);
            const hasIssue = matchResultHasIssue(result, index, issues);
            return (
              <MatchResultRow
                key={result.id}
                result={result}
                team={team}
                hasIssue={hasIssue}
                onNumberChange={(field, value) =>
                  updateNumber(index, field, value)
                }
                onToggleDnp={() => toggleDnp(index)}
                onInputKeyDown={focusNextInput}
              />
            );
          })}
        </div>
      )}

      <div className="border-t border-white/8 p-4 sm:p-6">
        {error ? <p className="mb-3 text-sm text-red-300" role="alert">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500" role="status">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : isDirty ? "Changes waiting to save" : "Saved"}
          </span>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <button
              className="min-h-12 rounded-lg border border-white/10 px-4 text-sm font-black text-white disabled:opacity-50"
              type="button"
              disabled={isLoading || saveState === "saving"}
              onClick={() => void saveDraft(true)}
            >
              Save Draft
            </button>
            <button
              className="primary-action min-h-12 px-4 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={isLoading || saveState === "saving"}
              onClick={() => void handleFinalize()}
            >
              Finalize Match
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
