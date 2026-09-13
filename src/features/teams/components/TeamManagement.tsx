"use client";

import React, { useState } from "react";
import type { Tournament } from "@/domain/tournaments/types";
import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTeam } from "@/features/teams/types";
import { useTeamManagement } from "@/features/teams/useTeamManagement";

import { TeamAddSheet } from "./TeamAddSheet";
import { TeamBulkForm } from "./TeamBulkForm";
import { TeamEditSheet } from "./TeamEditSheet";
import { TeamRosterTable } from "./TeamRosterTable";
import { TeamsHeaderSection } from "./TeamsHeaderSection";

interface TeamManagementProps {
  readonly tournament: Tournament;
  readonly tournamentId: string;
  readonly teams: readonly GuestTeam[];
  readonly repository: GuestTeamRepository;
  readonly onTeamsChanged: (teams: readonly GuestTeam[]) => void;
}

export function TeamManagement({
  tournament,
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
  const { editingTeam, error, setEditingTeam } = controller;
  const [isAddingTeam, setIsAddingTeam] = useState(false);

  function handleFocusBulkAdd() {
    const bulkInput = document.getElementById("bulkTeamNames");
    if (bulkInput) {
      bulkInput.focus();
      bulkInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function handleTeamCreated(createdTeam: GuestTeam) {
    controller.publishCreated([...teams, createdTeam]);
  }

  return (
    <div className="w-full space-y-5 md:space-y-6" data-purpose="teams-management">
      {/* Header with Breadcrumbs & Action Bar */}
      <TeamsHeaderSection
        tournament={tournament}
        teamsCount={teams.length}
        onAddTeam={() => setIsAddingTeam(true)}
        onBulkAdd={handleFocusBulkAdd}
      />

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Team Roster Table / List or Empty State */}
      <TeamRosterTable
        teams={teams}
        onEdit={setEditingTeam}
        onAddTeam={() => setIsAddingTeam(true)}
        onBulkAdd={handleFocusBulkAdd}
      />

      {/* Fast Roster Bulk Entry Card */}
      <TeamBulkForm
        existingTeams={teams}
        tournamentId={tournamentId}
        repository={repository}
        onCreated={controller.publishCreated}
      />

      {/* Add Single Team Sheet */}
      {isAddingTeam ? (
        <TeamAddSheet
          tournamentId={tournamentId}
          defaultSlotNumber={teams.length + 1}
          repository={repository}
          onClose={() => setIsAddingTeam(false)}
          onCreated={handleTeamCreated}
        />
      ) : null}

      {/* Edit / Delete Team Sheet */}
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
