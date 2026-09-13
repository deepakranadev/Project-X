"use client";

import { useFormik } from "formik";
import { useMemo, useRef, useState, type ChangeEvent } from "react";

import {
  MAX_TEAM_NAME_LENGTH,
  MAX_TEAM_SHORT_NAME_LENGTH,
  MAX_TEAM_SLOT_NUMBER,
} from "@/domain/teams/validation";
import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTeam } from "@/features/teams/types";
import {
  TEAM_LOGO_FILE_SIZE_LIMIT_MB,
  TeamValidationError,
  type TeamValidationField,
  validateTeamLogo,
} from "@/features/teams/validation";
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

interface TeamAddSheetProps {
  readonly tournamentId: string;
  readonly defaultSlotNumber: number;
  readonly repository: GuestTeamRepository;
  readonly onClose: () => void;
  readonly onCreated: (team: GuestTeam) => void;
}

export function TeamAddSheet({
  tournamentId,
  defaultSlotNumber,
  repository,
  onClose,
  onCreated,
}: TeamAddSheetProps) {
  const [logo, setLogo] = useState<GuestTeam["logo"]>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const actionLock = useRef(false);

  const initialValues = useMemo(
    () => ({
      name: "",
      shortName: "",
      slotNumber: String(defaultSlotNumber),
      logo: undefined as unknown,
    }),
    [defaultSlotNumber],
  );

  const formik = useFormik({
    initialValues,
    onSubmit: async (values, { setErrors }) => {
      if (actionLock.current) return;
      actionLock.current = true;
      setIsSaving(true);
      setFormError(null);

      const trimmedName = values.name.trim();
      if (!trimmedName) {
        setErrors({ name: "Team name is required." });
        actionLock.current = false;
        setIsSaving(false);
        return;
      }

      const rawSlot = String(values.slotNumber).trim();
      const slotNumber = rawSlot.length === 0 ? defaultSlotNumber : Number(rawSlot);
      const timestamp = new Date().toISOString();

      try {
        const created = await repository.createTeam({
          id: globalThis.crypto.randomUUID(),
          tournamentId,
          name: trimmedName,
          shortName: values.shortName.trim() || null,
          slotNumber,
          logo,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        onCreated(created);
        onClose();
      } catch (error) {
        if (error instanceof TeamValidationError) {
          const nextErrors: Record<string, string> = {};
          for (const issue of error.issues) {
            nextErrors[issue.field] ??= issue.message;
          }
          setErrors(nextErrors as Partial<Record<TeamValidationField, string>>);
        } else {
          setFormError(error instanceof Error ? error.message : "Failed to add team. Try again.");
        }
      } finally {
        actionLock.current = false;
        setIsSaving(false);
      }
    },
  });

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!file) return;
    const nextLogo = { blob: file, fileName: file.name };
    const issues = validateTeamLogo(nextLogo);
    if (issues.length > 0) {
      formik.setFieldError("logo", issues[0]?.message);
      event.currentTarget.value = "";
      return;
    }
    setLogo(nextLogo);
    formik.setFieldError("logo", undefined);
    setFormError(null);
  }

  return (
    <Sheet open={true} onOpenChange={(open) => { if (!open && !actionLock.current) onClose(); }}>
      <SheetContent
        side="responsive"
        className="max-h-[92svh] w-full overflow-y-auto rounded-t-2xl border-slate-200 bg-white p-5 shadow-2xl text-slate-900 md:max-w-lg md:max-h-[85vh] md:p-6"
      >
        <SheetHeader className="text-left mb-6">
          <p className="eyebrow">Roster setup</p>
          <SheetTitle className="text-2xl font-black text-slate-900">Add team</SheetTitle>
          <SheetDescription className="sr-only">Add a new team to the tournament roster.</SheetDescription>
        </SheetHeader>

        <form className="mt-6 space-y-5" onSubmit={formik.handleSubmit} noValidate>
          <div>
            <Label className="field-label" htmlFor="addTeamName">Team name</Label>
            <Input
              className="field-control"
              id="addTeamName"
              placeholder="e.g. Team Soul"
              maxLength={MAX_TEAM_NAME_LENGTH}
              required
              autoFocus
              aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
              {...formik.getFieldProps("name")}
            />
            {formik.touched.name && formik.errors.name ? (
              <p className="field-error">{formik.errors.name as string}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
            <div>
              <Label className="field-label" htmlFor="addTeamShortName">
                Short name <span className="field-optional">Optional</span>
              </Label>
              <Input
                className="field-control"
                id="addTeamShortName"
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
              <Label className="field-label" htmlFor="addTeamSlot">Slot number</Label>
              <Input
                className="field-control tabular-nums"
                id="addTeamSlot"
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
            <span className="field-label">Team logo <span className="field-optional">Optional</span></span>
            {logo ? (
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <PersistedImagePreview
                  image={logo}
                  alt="Team logo preview"
                  className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{logo.fileName}</span>
                <button className="text-xs font-bold text-slate-500 hover:text-red-600" type="button" onClick={() => setLogo(null)}>
                  Remove
                </button>
              </div>
            ) : null}
            <label className="file-control" htmlFor="addTeamLogo">
              <span className="truncate">{logo ? "Change logo" : "Choose PNG, JPG, or WEBP"}</span>
              <strong className="shrink-0 text-[#e05305]">Browse</strong>
              <input className="sr-only" id="addTeamLogo" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} />
            </label>
            <p className="mt-2 text-xs text-slate-500">Maximum {TEAM_LOGO_FILE_SIZE_LIMIT_MB} MB</p>
            {formik.errors.logo ? <p className="field-error">{formik.errors.logo as string}</p> : null}
          </div>

          {formError ? (
            <p className="field-error rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
              {formError}
            </p>
          ) : null}

          <Button className="primary-action w-full disabled:cursor-wait" type="submit" disabled={isSaving}>
            {isSaving ? "Adding team…" : "Add team"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
