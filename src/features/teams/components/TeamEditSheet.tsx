"use client";

import {
  type ChangeEvent,
  useEffect,
} from "react";

import {
  MAX_TEAM_NAME_LENGTH,
  MAX_TEAM_SHORT_NAME_LENGTH,
  MAX_TEAM_SLOT_NUMBER,
} from "@/domain/teams/validation";
import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTeam } from "@/features/teams/types";
import { useTeamEditor } from "@/features/teams/useTeamEditor";
import { TEAM_LOGO_FILE_SIZE_LIMIT_MB } from "@/features/teams/validation";

import { PersistedImagePreview } from "./PersistedImagePreview";
import { TeamDeletionControls } from "./TeamDeletionControls";

interface TeamEditSheetProps {
  readonly team: GuestTeam;
  readonly repository: GuestTeamRepository;
  readonly onClose: () => void;
  readonly onDeleted: (teamId: string) => void;
  readonly onSaved: (team: GuestTeam) => void;
}

export function TeamEditSheet({
  team,
  repository,
  onClose,
  onDeleted,
  onSaved,
}: TeamEditSheetProps) {
  const controller = useTeamEditor(
    team,
    repository,
    onSaved,
    onDeleted,
    onClose,
  );
  const { formError, formik, isDeleting, isSaving, logo } = controller;

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSaving, onClose]);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!controller.selectLogo(file)) event.currentTarget.value = "";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-0 sm:items-center sm:px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-team-heading"
    >
      <div className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-700 bg-[#10151a] p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Roster details</p>
            <h2
              className="mt-2 text-2xl font-black text-white"
              id="edit-team-heading"
            >
              Edit team
            </h2>
          </div>
          <button
            className="grid h-11 w-11 place-items-center rounded-lg text-2xl text-slate-400 hover:bg-white/5 hover:text-white"
            type="button"
            aria-label="Close team editor"
            onClick={onClose}
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={formik.handleSubmit} noValidate>
          <div>
            <label className="field-label" htmlFor="editTeamName">
              Team name
            </label>
            <input
              className="field-control"
              id="editTeamName"
              maxLength={MAX_TEAM_NAME_LENGTH}
              required
              autoFocus
              aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
              {...formik.getFieldProps("name")}
            />
            {formik.touched.name && formik.errors.name ? <p className="field-error">{formik.errors.name as string}</p> : null}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
            <div>
              <label className="field-label" htmlFor="editTeamShortName">
                Short name <span className="field-optional">Optional</span>
              </label>
              <input
                className="field-control"
                id="editTeamShortName"
                maxLength={MAX_TEAM_SHORT_NAME_LENGTH}
                placeholder="e.g. SOUL"
                aria-invalid={Boolean(formik.touched.shortName && formik.errors.shortName)}
                {...formik.getFieldProps("shortName")}
              />
              {formik.touched.shortName && formik.errors.shortName ? (
                <p className="field-error">{formik.errors.shortName as string}</p>
              ) : null}
            </div>
            <div>
              <label className="field-label" htmlFor="editTeamSlot">
                Slot number
              </label>
              <input
                className="field-control tabular-nums"
                id="editTeamSlot"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_TEAM_SLOT_NUMBER}
                step={1}
                aria-invalid={Boolean(formik.touched.slotNumber && formik.errors.slotNumber)}
                {...formik.getFieldProps("slotNumber")}
              />
              {formik.touched.slotNumber && formik.errors.slotNumber ? (
                <p className="field-error">{formik.errors.slotNumber as string}</p>
              ) : null}
            </div>
          </div>

          <div>
            <span className="field-label">
              Team logo <span className="field-optional">Optional</span>
            </span>
            {logo ? (
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-white/8 bg-black/15 p-3">
                <PersistedImagePreview
                  image={logo}
                  alt={`${team.name} logo preview`}
                  className="h-12 w-12 rounded-lg border border-white/10 object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-300">
                  {logo.fileName}
                </span>
                <button
                  className="text-xs font-bold text-slate-500 hover:text-red-300"
                  type="button"
                  onClick={controller.removeLogo}
                >
                  Remove
                </button>
              </div>
            ) : null}
            <label className="file-control" htmlFor="editTeamLogo">
              <span className="truncate">
                {logo ? "Change logo" : "Choose PNG, JPG, or WEBP"}
              </span>
              <strong className="shrink-0 text-lime-300">Browse</strong>
              <input
                className="sr-only"
                id="editTeamLogo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoChange}
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              Maximum {TEAM_LOGO_FILE_SIZE_LIMIT_MB} MB
            </p>
            {formik.errors.logo ? <p className="field-error">{formik.errors.logo as string}</p> : null}
          </div>

          {formError ? (
            <p
              className="field-error rounded-lg border border-red-400/20 bg-red-400/5 p-3"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <button
            className="primary-action w-full disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={isSaving}
          >
            {isSaving && !isDeleting ? "Saving…" : "Save team"}
          </button>
        </form>

        <TeamDeletionControls
          isDeleting={isDeleting}
          teamName={team.name}
          onDelete={() => void controller.deleteTeam()}
        />
      </div>
    </div>
  );
}
