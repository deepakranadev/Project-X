"use client";

import { useState } from "react";

import {
  publishSuccessfulTeamMutation,
  removeRosterTeam,
  replaceRosterTeam,
} from "./teamRosterState";
import type { GuestTeamRepository } from "./teamRepository";
import type { GuestTeam } from "./types";

export function useTeamManagement(
  tournamentId: string,
  teams: readonly GuestTeam[],
  repository: GuestTeamRepository,
  onTeamsChanged: (teams: readonly GuestTeam[]) => void,
) {
  const [editingTeam, setEditingTeam] = useState<GuestTeam | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function publish(teams: readonly GuestTeam[], message: string) {
    onTeamsChanged(teams);
    setError(null);
    setNotice(message);
  }

  async function move(teamIndex: number, direction: -1 | 1) {
    const targetIndex = teamIndex + direction;
    if (targetIndex < 0 || targetIndex >= teams.length || isReordering) return;
    const ordered = [...teams];
    const current = ordered[teamIndex];
    const target = ordered[targetIndex];
    if (!current || !target) return;
    ordered[teamIndex] = target;
    ordered[targetIndex] = current;

    setIsReordering(true);
    setError(null);
    try {
      await publishSuccessfulTeamMutation(
        () => repository.reorderTeams(tournamentId, ordered.map((team) => team.id)),
        (reordered) => publish(reordered, "Roster order and slots updated."),
      );
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "The roster could not be reordered. Try again.");
    } finally {
      setIsReordering(false);
    }
  }

  return {
    editingTeam,
    error,
    isReordering,
    move,
    notice,
    publishCreated: (roster: readonly GuestTeam[]) => publish(roster, "Roster saved on this device."),
    publishDeleted: (teamId: string) => publish(removeRosterTeam(teams, teamId), "Team removed from the roster."),
    publishSaved: (updated: GuestTeam) => publish(replaceRosterTeam(teams, updated), "Team changes saved."),
    setEditingTeam,
  };
}
