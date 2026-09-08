"use client";

import { useFormik } from "formik";
import { useMemo, useRef, useState } from "react";

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
  const [formError, setFormError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"save" | "delete" | null>(null);
  const actionLock = useRef<"save" | "delete" | null>(null);

  const initialValues = useMemo(
    () => ({
      name: team.name,
      shortName: team.shortName ?? "",
      slotNumber: team.slotNumber ?? "",
      logo: undefined as unknown,
    }),
    [team.name, team.shortName, team.slotNumber]
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    onSubmit: async (values, { setErrors, resetForm }) => {
      if (actionLock.current !== null) return;
      actionLock.current = "save";
      
      const rawSlot = String(values.slotNumber).trim();
      setActiveAction("save");
      setFormError(null);
      try {
        await publishSuccessfulTeamMutation(async () => {
          const updated = await repository.updateTeam(team.tournamentId, team.id, {
            name: values.name.trim(),
            shortName: values.shortName.trim() || null,
            slotNumber: rawSlot.length === 0 ? null : Number(rawSlot),
            logo,
          });
          if (!updated) throw new Error("This team is no longer in the tournament roster.");

          resetForm({
            values: {
              name: updated.name,
              shortName: updated.shortName ?? "",
              slotNumber: updated.slotNumber ?? "",
              logo: undefined as unknown,
            },
          });

          return updated;
        }, onSaved);
        onClose();
      } catch (error) {
        if (error instanceof TeamValidationError) {
          const nextErrors: Record<string, string> = {};
          for (const issue of error.issues) nextErrors[issue.field] ??= issue.message;
          setErrors(nextErrors);
        } else if (error instanceof TeamRepositoryError) {
          setErrors({
            [error.code === "SLOT_CONFLICT" ? "slotNumber" : "name"]: error.message,
          });
        } else {
          setFormError(error instanceof Error ? error.message : "This team could not be saved. Try again.");
        }
      } finally {
        actionLock.current = null;
        setActiveAction(null);
      }
    },
  });

  async function deleteTeam() {
    if (actionLock.current !== null || formik.isSubmitting) return;
    actionLock.current = "delete";
    setActiveAction("delete");
    setFormError(null);
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
      setFormError(
        error instanceof TeamDeletionError && error.code === "TEAM_HAS_MATCH_HISTORY"
          ? "This team can't be deleted because it already has match history."
          : "This team could not be removed. Try again.",
      );
      setActiveAction(null);
      actionLock.current = null;
    }
  }

  function selectLogo(file: File | null): boolean {
    if (!file) return true;
    const nextLogo = { blob: file, fileName: file.name };
    const issues = validateTeamLogo(nextLogo);
    if (issues.length > 0) {
      formik.setFieldError("logo", issues[0]?.message);
      return false;
    }
    setLogo(nextLogo);
    formik.setFieldError("logo", undefined);
    setFormError(null);
    return true;
  }

  return {
    deleteTeam,
    formError,
    formik,
    isDeleting: activeAction === "delete",
    isSaving: activeAction === "save",
    logo,
    removeLogo: () => setLogo(null),
    selectLogo,
  };
}
