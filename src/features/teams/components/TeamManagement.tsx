"use client";

import { useCallback, useEffect, useState } from "react";

import type { Team } from "@/domain/teams/types";
import { getClientTeamRepository } from "@/infrastructure/persistence/indexed-db/clientTeamRepository";

import { TeamBulkForm } from "./TeamBulkForm";
import { TeamEditSheet } from "./TeamEditSheet";
import { TeamRoster } from "./TeamRoster";

interface TeamManagementProps {
  readonly tournamentId: string;
  readonly onTeamsChanged: () => void;
}

export function TeamManagement({
  tournamentId,
  onTeamsChanged,
}: TeamManagementProps) {
  const [teams, setTeams] = useState<readonly Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const reloadTeams = useCallback(async () => {
    const roster = await getClientTeamRepository().listTeamsByTournament(
      tournamentId,
    );
    setTeams(roster);
  }, [tournamentId]);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        const roster = await getClientTeamRepository().listTeamsByTournament(
          tournamentId,
        );
        if (active) setTeams(roster);
      } catch {
        if (active) {
          setError(
            "The team roster could not be opened. Check browser storage permissions and refresh.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadTeams();
    return () => {
      active = false;
    };
  }, [tournamentId]);

  async function handleTeamsCreated() {
    await reloadTeams();
    setError(null);
    setNotice("Roster saved on this device.");
    onTeamsChanged();
  }

  async function handleTeamSaved() {
    await reloadTeams();
    setError(null);
    setNotice("Team changes saved.");
    onTeamsChanged();
  }

  async function handleTeamDeleted() {
    await reloadTeams();
    setError(null);
    setNotice("Team removed from the roster.");
    onTeamsChanged();
  }

  async function handleMove(teamIndex: number, direction: -1 | 1) {
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
      const reordered = await getClientTeamRepository().reorderTeams(
        tournamentId,
        ordered.map((team) => team.id),
      );
      setTeams(reordered);
      setNotice("Roster order and slots updated.");
      onTeamsChanged();
    } catch (moveError) {
      setError(
        moveError instanceof Error
          ? moveError.message
          : "The roster could not be reordered. Try again.",
      );
    } finally {
      setIsReordering(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-5 sm:mt-7">
        <p className="text-sm text-slate-400" role="status">
          Loading team roster…
        </p>
      </section>
    );
  }

  return (
    <div className="mt-5 space-y-5 sm:mt-7 sm:space-y-7">
      <TeamBulkForm
        existingTeams={teams}
        tournamentId={tournamentId}
        onCreated={handleTeamsCreated}
      />

      {notice ? (
        <p
          className="rounded-lg border border-lime-300/20 bg-lime-300/5 px-4 py-3 text-sm font-semibold text-lime-200"
          role="status"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {teams.length > 0 ? (
        <TeamRoster
          teams={teams}
          isReordering={isReordering}
          onEdit={setEditingTeam}
          onMove={(index, direction) => void handleMove(index, direction)}
        />
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/35 p-5 text-center sm:p-7">
          <p className="text-sm font-bold text-white">No teams added yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Paste the roster above. Slots are assigned automatically in order.
          </p>
        </section>
      )}

      {editingTeam ? (
        <TeamEditSheet
          key={editingTeam.id}
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSaved={handleTeamSaved}
          onDeleted={handleTeamDeleted}
        />
      ) : null}
    </div>
  );
}
