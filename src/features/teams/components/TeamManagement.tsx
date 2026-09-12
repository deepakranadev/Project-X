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
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
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
        <section className="rounded-2xl border border-dashed border-border bg-surface-raised/50 p-5 text-center sm:p-7">
          <p className="text-sm font-bold text-foreground">No teams added yet</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
