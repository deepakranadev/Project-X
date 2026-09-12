"use client";

import { type FocusEvent, useCallback, useEffect, useRef, useState } from "react";

import type { TournamentMatch } from "@/domain/matches/types";
import { validateManualMatchResults } from "@/domain/matches/validation";
import type { Team } from "@/domain/teams/types";

import { finalizeGuestMatch } from "./finalizeGuestMatch";
import type { MatchDraftController } from "./useMatchDraftState";
import type { MatchLifecycleRepository } from "./matchLifecycleRepository";
import type { MatchWriteCoordinator, ExplicitMatchAction } from "./matchWriteCoordinator";

export function useMatchPersistence(
  match: TournamentMatch,
  teams: readonly Team[],
  repository: MatchLifecycleRepository,
  draft: MatchDraftController,
  coordinator: MatchWriteCoordinator,
  onClose: () => void,
  onMatchChange: (match: TournamentMatch) => void,
) {
  const [explicitAction, setExplicitAction] = useState<ExplicitMatchAction | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const {
    acceptPersistedResults,
    dirtyRef,
    nameRef,
    resultsRef,
    revisionRef,
    setError,
    setSaveState,
  } = draft;

  const cancelPendingAutosave = useCallback(() => {
    if (autosaveTimerRef.current === null) return;
    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
  }, []);

  const flushLatestSnapshot = useCallback(() => {
    cancelPendingAutosave();
    if (!dirtyRef.current || coordinator.hasExplicitAction()) return;

    const savingName = nameRef.current;
    const savingResults = resultsRef.current;

    void coordinator.enqueue(async () => {
      try {
        await repository.saveMatchDraft({
          tournamentId: match.tournamentId,
          matchId: match.id,
          name: savingName,
          results: savingResults,
        });
      } catch (e) {
        console.error("MatchEntry unmount flush failed:", e);
      }
    });
  }, [cancelPendingAutosave, dirtyRef, match.id, match.tournamentId, nameRef, repository, resultsRef, coordinator]);

  useEffect(() => {
    return () => flushLatestSnapshot();
  }, [flushLatestSnapshot]);

  const persistDraftSnapshot = useCallback(async (force = false): Promise<boolean> => {
    if (!force && !dirtyRef.current) return true;
    const savingRevision = revisionRef.current;
    const savingResults = resultsRef.current;
    const savingName = nameRef.current;
    setSaveState("saving");
    setError(null);
    try {
      const saved = await repository.saveMatchDraft({
        tournamentId: match.tournamentId,
        matchId: match.id,
        name: savingName,
        results: savingResults,
      });
      onMatchChange(saved.match);
      acceptPersistedResults(saved.results, savingRevision);
      return true;
    } catch {
      setSaveState("error");
      setError("This draft could not be saved. Check browser storage permissions and try again.");
      return false;
    }
  }, [acceptPersistedResults, dirtyRef, match.id, match.tournamentId, nameRef,
    onMatchChange, repository, resultsRef, revisionRef, setError, setSaveState]);

  const queueAutosave = useCallback(() => {
    cancelPendingAutosave();
    if (!dirtyRef.current || coordinator.hasExplicitAction()) return;
    void coordinator.enqueue(() => persistDraftSnapshot());
  }, [cancelPendingAutosave, dirtyRef, persistDraftSnapshot, coordinator]);

  useEffect(() => {
    cancelPendingAutosave();
    if (draft.isLoading || !draft.isDirty || match.status === "FINALIZED" || explicitAction !== null) return;
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      queueAutosave();
    }, 500);
    return cancelPendingAutosave;
  }, [cancelPendingAutosave, draft.isDirty, draft.isLoading, draft.revision, explicitAction, match.status, queueAutosave]);

  useEffect(() => {
    if (!draft.isDirty && draft.saveState !== "saving") return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [draft.isDirty, draft.saveState]);

  useEffect(() => {
    if (!draft.isDirty) return;
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") queueAutosave();
    };
    const flushOnPageHide = () => queueAutosave();
    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("pagehide", flushOnPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("pagehide", flushOnPageHide);
    };
  }, [draft.isDirty, queueAutosave]);

  function handleEditorBlur(event: FocusEvent<HTMLFormElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    if (draft.dirtyRef.current) queueAutosave();
  }

  async function close() {
    cancelPendingAutosave();
    if (coordinator.hasExplicitAction()) return;
    setExplicitAction("close");
    let shouldClose = false;
    try {
      const closed = await coordinator.runExplicit(
        "close",
        () => persistDraftSnapshot(false),
      );
      shouldClose = closed.started && closed.value;
    } finally {
      setExplicitAction(null);
    }
    if (shouldClose) onClose();
  }

  async function save() {
    cancelPendingAutosave();
    if (coordinator.hasExplicitAction()) return;
    setExplicitAction("save");
    try {
      await coordinator.runExplicit("save", () => persistDraftSnapshot(true));
    } finally {
      setExplicitAction(null);
    }
  }

  async function finalize() {
    cancelPendingAutosave();
    if (coordinator.hasExplicitAction()) return;
    setExplicitAction("finalize");
    draft.setSaveState("saving");
    draft.setError(null);
    try {
      await coordinator.runExplicit("finalize", async () => {
        const latestResults = draft.resultsRef.current;
        const validation = validateManualMatchResults(latestResults, {
          tournamentId: match.tournamentId,
          matchId: match.id,
          participantTeamIds: teams.map((team) => team.id),
        });
        if (!validation.valid) {
          draft.setIssues(validation.issues);
          await persistDraftSnapshot(true);
          return;
        }
        const finalized = await finalizeGuestMatch({
          tournamentId: match.tournamentId,
          matchId: match.id,
          name: draft.nameRef.current,
          results: latestResults,
          lifecycleRepository: repository,
        });
        if (!finalized.ok) {
          draft.setIssues(finalized.issues);
          draft.setSaveState("saved");
          return;
        }
        draft.acceptFinalizedResults(finalized.results);
        onMatchChange(finalized.match);
      });
    } catch {
      draft.setSaveState("error");
      draft.setError("The match could not be finalized. Your draft remains available.");
    } finally {
      setExplicitAction(null);
    }
  }

  return {
    close,
    editorLocked: match.status === "FINALIZED" || explicitAction !== null,
    explicitAction,
    finalize,
    handleEditorBlur,
    save,
  };
}

export type MatchPersistenceController = ReturnType<typeof useMatchPersistence>;
