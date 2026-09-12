"use client";

import { type KeyboardEvent, useCallback, useRef, useMemo } from "react";

import type { TournamentMatch } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";
import type { MatchLifecycleRepository } from "@/features/matches/matchLifecycleRepository";
import type { MatchResultRepository } from "@/features/matches/matchResultRepository";
import type { MatchWriteCoordinatorRegistry } from "@/features/matches/matchWriteCoordinator";
import { useMatchDraftState } from "@/features/matches/useMatchDraftState";
import { useMatchPersistence } from "@/features/matches/useMatchPersistence";

import { MatchEntryForm } from "./MatchEntryForm";

interface MatchEntryProps {
  readonly lifecycleRepository: MatchLifecycleRepository;
  readonly match: TournamentMatch;
  readonly resultRepository: MatchResultRepository;
  readonly teams: readonly Team[];
  readonly writeCoordinators: MatchWriteCoordinatorRegistry;
  readonly onClose: () => void;
  readonly onMatchChange: (match: TournamentMatch) => void;
}

export function MatchEntry({
  lifecycleRepository,
  match,
  resultRepository,
  teams,
  writeCoordinators,
  onClose,
  onMatchChange,
}: MatchEntryProps) {
  const editorRef = useRef<HTMLFormElement>(null);
  
  const coordinator = useMemo(
    () => writeCoordinators.getCoordinator(match.id),
    [writeCoordinators, match.id]
  );

  const draft = useMatchDraftState(match, teams, resultRepository, coordinator);
  const persistence = useMatchPersistence(
    match,
    teams,
    lifecycleRepository,
    draft,
    coordinator,
    onClose,
    onMatchChange,
  );

  const focusNextInput = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const inputs = Array.from(
      editorRef.current?.querySelectorAll<HTMLInputElement>(
        "input[data-result-input]:not(:disabled)",
      ) ?? [],
    );
    const next = inputs[inputs.indexOf(event.currentTarget) + 1];
    if (next) {
      next.focus();
      next.select();
    }
  }, []);

  return (
    <MatchEntryForm
      draft={draft}
      editorRef={editorRef}
      match={match}
      persistence={persistence}
      teams={teams}
      onInputKeyDown={focusNextInput}
    />
  );
}
