"use client";

import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTeam } from "@/features/teams/types";
import { useTeamManagement } from "@/features/teams/useTeamManagement";

import { TeamBulkForm } from "./TeamBulkForm";
import { TeamEditSheet } from "./TeamEditSheet";
import { TeamRoster } from "./TeamRoster";

interface TeamManagementProps {
  readonly tournamentId: string;
  readonly teams: readonly GuestTeam[];
  readonly repository: GuestTeamRepository;
  readonly onTeamsChanged: (teams: readonly GuestTeam[]) => void;
}

export function TeamManagement({
  tournamentId,
  teams,
  repository,
  onTeamsChanged,
}: TeamManagementProps) {
  const controller = useTeamManagement(
    tournamentId,
    teams,
    repository,
    onTeamsChanged,
  );
  const { editingTeam, error, isReordering, setEditingTeam } = controller;

  return (
    <div className="mt-5 space-y-5 sm:mt-7 sm:space-y-7">
      <TeamBulkForm
        existingTeams={teams}
        tournamentId={tournamentId}
        repository={repository}
        onCreated={controller.publishCreated}
      />


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
          onMove={(index, direction) => void controller.move(index, direction)}
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
          repository={repository}
          onClose={() => setEditingTeam(null)}
          onSaved={controller.publishSaved}
          onDeleted={controller.publishDeleted}
        />
      ) : null}
    </div>
  );
}
