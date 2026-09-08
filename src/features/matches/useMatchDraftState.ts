"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { StoredMatchResult, TournamentMatch } from "@/domain/matches/types";
import type { ManualMatchValidationIssue } from "@/domain/matches/validation";
import type { Team } from "@/domain/teams/types";

import {
  autoFillMatchPlacements,
  buildMatchDraftRows,
  toggleMatchResultDnp,
  updateMatchResultNumber,
} from "./matchEntryDraft";
import { createMatchId, currentMatchTimestamp } from "./matchFactories";
import type { MatchResultRepository } from "./matchResultRepository";
import { loadMatchEntryDraft } from "./loadMatchEntryDraft";

export type MatchSaveState = "idle" | "saving" | "saved" | "error";

export function useMatchDraftState(
  match: TournamentMatch,
  teams: readonly Team[],
  repository: MatchResultRepository,
) {
  const [results, setResults] = useState<readonly StoredMatchResult[]>([]);
  const [draftName, setDraftName] = useState(match.name ?? "");
  const [issues, setIssues] = useState<readonly ManualMatchValidationIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saveState, setSaveState] = useState<MatchSaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<readonly StoredMatchResult[]>([]);
  const nameRef = useRef(draftName);
  const revisionRef = useRef(0);
  const dirtyRef = useRef(false);
  const teamsRef = useRef(teams);
  const loadedMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  const replaceResults = useCallback(
    (next: readonly StoredMatchResult[], markDirty = true) => {
      resultsRef.current = next;
      setResults(next);
      if (!markDirty) return;
      const nextRevision = revisionRef.current + 1;
      revisionRef.current = nextRevision;
      setRevision(nextRevision);
      dirtyRef.current = true;
      setIsDirty(true);
      setSaveState("idle");
      setError(null);
      setIssues([]);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    loadedMatchIdRef.current = null;
    async function load() {
      try {
        const loaded = await loadMatchEntryDraft({
          tournamentId: match.tournamentId,
          matchId: match.id,
          teams: teamsRef.current,
          repository,
        });
        if (!active) return;
        replaceResults(loaded, false);
        dirtyRef.current = false;
        setIsDirty(false);
        loadedMatchIdRef.current = match.id;
      } catch {
        if (active) {
          setError("The saved result draft could not be opened. Check browser storage permissions and try again.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [match.id, match.tournamentId, replaceResults, repository]);

  useEffect(() => {
    if (isLoading || loadedMatchIdRef.current !== match.id) return;
    const reconciled = buildMatchDraftRows({
      stored: resultsRef.current,
      teams,
      tournamentId: match.tournamentId,
      matchId: match.id,
      createId: createMatchId,
      now: currentMatchTimestamp,
    });
    const orderChanged = reconciled.results.some(
      (result, index) => result.id !== resultsRef.current[index]?.id,
    );
    if (reconciled.created.length > 0 || orderChanged) {
      replaceResults(reconciled.results, reconciled.created.length > 0);
    }
  }, [isLoading, match.id, match.tournamentId, replaceResults, teams]);

  const markNameChanged = useCallback((value: string) => {
    nameRef.current = value;
    setDraftName(value);
    const nextRevision = revisionRef.current + 1;
    revisionRef.current = nextRevision;
    setRevision(nextRevision);
    dirtyRef.current = true;
    setIsDirty(true);
    setSaveState("idle");
    setError(null);
  }, []);

  const updateNumber = useCallback((resultId: string, field: "placement" | "kills", rawValue: string) => {
    replaceResults(updateMatchResultNumber(resultsRef.current, resultId, field, rawValue));
  }, [replaceResults]);

  const toggleDnp = useCallback((resultId: string) => {
    replaceResults(toggleMatchResultDnp(resultsRef.current, resultId));
  }, [replaceResults]);

  const autoFillPlacements = useCallback(() => {
    replaceResults(autoFillMatchPlacements(resultsRef.current));
  }, [replaceResults]);

  const acceptPersistedResults = useCallback((saved: readonly StoredMatchResult[], savingRevision: number) => {
    if (revisionRef.current !== savingRevision) {
      setSaveState("idle");
      return;
    }
    resultsRef.current = saved;
    setResults(saved);
    dirtyRef.current = false;
    setIsDirty(false);
    setSaveState("saved");
  }, []);

  const acceptFinalizedResults = useCallback((saved: readonly StoredMatchResult[]) => {
    resultsRef.current = saved;
    setResults(saved);
    setIssues([]);
    dirtyRef.current = false;
    setIsDirty(false);
    setSaveState("saved");
  }, []);

  return {
    acceptFinalizedResults,
    acceptPersistedResults,
    autoFillPlacements,
    dirtyRef,
    draftName,
    error,
    isDirty,
    isLoading,
    issues,
    markNameChanged,
    nameRef,
    results,
    resultsRef,
    revision,
    revisionRef,
    saveState,
    setError,
    setIssues,
    setSaveState,
    toggleDnp,
    updateNumber,
  };
}

export type MatchDraftController = ReturnType<typeof useMatchDraftState>;
