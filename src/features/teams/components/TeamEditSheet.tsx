"use client";

import {
  type ChangeEvent,
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
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";

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

  function handleOpenChange(open: boolean) {
    if (!open && !controller.isLocked()) {
      onClose();
    }
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!controller.selectLogo(file)) event.currentTarget.value = "";
  }

  return (
    <Sheet open={true} onOpenChange={handleOpenChange}>
      <SheetContent
        className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-700 bg-[#10151a] p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        side="bottom"
      >
        <SheetHeader className="text-left mb-6">
          <p className="eyebrow">Roster details</p>
          <SheetTitle className="text-2xl font-black text-white">Edit team</SheetTitle>
          <SheetDescription className="sr-only">Edit team details such as name, short name, slot, and logo.</SheetDescription>
        </SheetHeader>

        <form className="mt-6 space-y-5" onSubmit={formik.handleSubmit} noValidate>
          <div>
            <Label className="field-label" htmlFor="editTeamName">
              Team name
            </Label>
            <Input
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
              <Label className="field-label" htmlFor="editTeamShortName">
                Short name <span className="field-optional">Optional</span>
              </Label>
              <Input
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
              <Label className="field-label" htmlFor="editTeamSlot">
                Slot number
              </Label>
              <Input
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

          <Button
            className="primary-action w-full disabled:cursor-wait"
            type="submit"
            disabled={isSaving}
          >
            {isSaving && !isDeleting ? "Saving…" : "Save team"}
          </Button>
        </form>

        <TeamDeletionControls
          isDeleting={isDeleting}
          teamName={team.name}
          onDelete={() => void controller.deleteTeam()}
        />
      </SheetContent>
    </Sheet>
  );
}
