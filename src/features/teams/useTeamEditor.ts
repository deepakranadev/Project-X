"use client";

import { useState } from "react";

import { TeamDeletionError } from "@/domain/teams/errors";

import { publishSuccessfulTeamMutation } from "./teamRosterState";
import {
  TeamRepositoryError,
  type GuestTeamRepository,
} from "./teamRepository";
import type { GuestTeam } from "./types";
import {
  TeamValidationError,
  type TeamValidationField,
  validateTeamLogo,
} from "./validation";

export type TeamEditErrors = Partial<Record<TeamValidationField | "form", string>>;

export function useTeamEditor(
  team: GuestTeam,
  repository: GuestTeamRepository,
  onSaved: (team: GuestTeam) => void,
  onDeleted: (teamId: string) => void,
  onClose: () => void,
) {
  const [logo, setLogo] = useState<GuestTeam["logo"]>(team.logo);
  const [errors, setErrors] = useState<TeamEditErrors>({});
  const [activeAction, setActiveAction] = useState<"save" | "delete" | null>(null);
  const isSaving = activeAction !== null;

  function selectLogo(file: File | null): boolean {
    if (!file) return true;
    const nextLogo = { blob: file, fileName: file.name };
    const issues = validateTeamLogo(nextLogo);
    if (issues.length > 0) {
      setErrors((current) => ({ ...current, logo: issues[0]?.message }));
      return false;
    }
    setLogo(nextLogo);
    setErrors((current) => ({ ...current, logo: undefined, form: undefined }));
    return true;
  }

  async function save(formData: FormData) {
    if (isSaving) return;
    const rawSlot = String(formData.get("slotNumber") ?? "").trim();
    setActiveAction("save");
    setErrors({});
    try {
      await publishSuccessfulTeamMutation(async () => {
        const updated = await repository.updateTeam(team.tournamentId, team.id, {
          name: String(formData.get("name") ?? ""),
          shortName: String(formData.get("shortName") ?? "") || null,
          slotNumber: rawSlot.length === 0 ? null : Number(rawSlot),
          logo,
        });
        if (!updated) throw new Error("This team is no longer in the tournament roster.");
        return updated;
      }, onSaved);
      onClose();
    } catch (error) {
      if (error instanceof TeamValidationError) {
        const nextErrors: TeamEditErrors = {};
        for (const issue of error.issues) nextErrors[issue.field] ??= issue.message;
        setErrors(nextErrors);
      } else if (error instanceof TeamRepositoryError) {
        setErrors({
          [error.code === "SLOT_CONFLICT" ? "slotNumber" : "name"]: error.message,
        });
      } else {
        setErrors({ form: error instanceof Error ? error.message : "This team could not be saved. Try again." });
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function deleteTeam() {
    if (isSaving) return;
    setActiveAction("delete");
    setErrors({});
    try {
      await publishSuccessfulTeamMutation(
        async () => {
          await repository.deleteTeam(team.tournamentId, team.id);
          return team.id;
        },
        onDeleted,
      );
      onClose();
    } catch (error) {
      setErrors({
        form:
          error instanceof TeamDeletionError && error.code === "TEAM_HAS_MATCH_HISTORY"
            ? "This team can't be deleted because it already has match history."
            : "This team could not be removed. Try again.",
      });
      setActiveAction(null);
    }
  }

  return {
    deleteTeam,
    errors,
    isDeleting: activeAction === "delete",
    isSaving,
    logo,
    removeLogo: () => setLogo(null),
    save,
    selectLogo,
  };
}
