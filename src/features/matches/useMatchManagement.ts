"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { TournamentMatch } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";

import { createGuestMatchWithInitialResults } from "./createGuestMatch";
import type { MatchFeatureDependencies } from "./matchFeatureDependencies";

export function useMatchManagement(
  tournamentId: string,
  teams: readonly Team[],
  repositories: MatchFeatureDependencies,
  onMatchesChanged: () => void,
  onMatchOpened?: (matchId: string) => void,
) {
  const [matches, setMatches] = useState<readonly TournamentMatch[]>([]);
  const [activeMatch, setActiveMatch] = useState<TournamentMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const savedMatches = await repositories.matches.listMatchesByTournament(tournamentId);
        if (active) setMatches(savedMatches);
      } catch {
        if (active) setError("Matches could not be opened. Check browser storage permissions and refresh.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [repositories, tournamentId]);

  async function createMatch() {
    if (isCreating) return;
    if (teams.length === 0) {
      setError("Add at least one team before creating a match.");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const snapshot = await createGuestMatchWithInitialResults({
        tournamentId,
        matchRepository: repositories.matches,
        teamRepository: repositories.teams,
        lifecycleRepository: repositories.lifecycle,
      });
      setMatches((current) => [...current, snapshot.match]);
      toast(`Match ${snapshot.match.matchNumber} created. Draft saved on this device.`);
      onMatchesChanged();
      
      if (onMatchOpened) {
        onMatchOpened(snapshot.match.id);
      } else {
        setActiveMatch(snapshot.match);
        window.setTimeout(() => {
          document.getElementById("match-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "The match could not be created. Try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function openMatch(match: TournamentMatch) {
    try {
      const latest = await repositories.matches.getMatch(tournamentId, match.id);
      if (!latest) throw new Error("This match is no longer saved on this device.");
      let openedMatch = latest;
      if (latest.status === "FINALIZED") {
        openedMatch = await repositories.lifecycle.reopenMatch(tournamentId, latest.id);
        setMatches((current) => current.map((candidate) => candidate.id === openedMatch.id ? openedMatch : candidate));
        toast(`Match ${openedMatch.matchNumber} reopened as a draft. Finalize it again after reviewing changes.`);
        onMatchesChanged();
      }
      
      if (onMatchOpened) {
        onMatchOpened(openedMatch.id);
      } else {
        setActiveMatch(openedMatch);
      }
      setError(null);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "The match could not be opened.");
    }
  }

  const [isDeletingMatch, setIsDeletingMatch] = useState(false);
  const deleteLockRef = useRef(false);

  async function deleteMatch(match: TournamentMatch) {
    if (deleteLockRef.current) return;
    deleteLockRef.current = true;
    setIsDeletingMatch(true);
    try {
      await repositories.matches.deleteMatch(tournamentId, match.id);
      setMatches((current) => current.filter((candidate) => candidate.id !== match.id));
      setActiveMatch((current) => current?.id === match.id ? null : current);
      toast(`Match ${match.matchNumber} and its results were deleted.`);
      setError(null);
      onMatchesChanged();
    } catch {
      setError("The match could not be deleted. Try again.");
    } finally {
      deleteLockRef.current = false;
      setIsDeletingMatch(false);
    }
  }

  const handleMatchChange = useCallback((updated: TournamentMatch) => {
    setMatches((current) => current.map((match) => match.id === updated.id ? updated : match));
    setActiveMatch((current) => current?.id === updated.id ? updated : current);
    onMatchesChanged();
  }, [onMatchesChanged]);

  const closeActiveMatch = useCallback(() => setActiveMatch(null), []);

  return {
    activeMatch,
    closeActiveMatch,
    createMatch,
    deleteMatch,
    error,
    handleMatchChange,
    isCreating,
    isDeletingMatch,
    isLoading,
    matches,
    openMatch,
  };
}
