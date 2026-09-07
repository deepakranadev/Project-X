"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";

import type { Team } from "@/domain/teams/types";
import {
  MAX_TEAM_NAME_LENGTH,
  MAX_TEAM_SHORT_NAME_LENGTH,
  MAX_TEAM_SLOT_NUMBER,
  TeamValidationError,
  type TeamValidationField,
  validateTeamLogo,
} from "@/domain/teams/validation";
import type { PersistedImage } from "@/domain/tournaments/types";
import { MAX_LOGO_FILE_SIZE_BYTES } from "@/domain/tournaments/validation";
import { getClientTeamRepository } from "@/lib/persistence/clientTeamRepository";
import { TeamRepositoryError } from "@/lib/persistence/indexedDbTeamRepository";

import { PersistedImagePreview } from "./PersistedImagePreview";

interface TeamEditSheetProps {
  readonly team: Team;
  readonly onClose: () => void;
  readonly onDeleted: () => Promise<void>;
  readonly onSaved: () => Promise<void>;
}

type EditErrors = Partial<Record<TeamValidationField | "form", string>>;

export function TeamEditSheet({
  team,
  onClose,
  onDeleted,
  onSaved,
}: TeamEditSheetProps) {
  const [logo, setLogo] = useState<PersistedImage | null>(team.logo);
  const [errors, setErrors] = useState<EditErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSaving, onClose]);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!file) return;

    const nextLogo: PersistedImage = { blob: file, fileName: file.name };
    const issues = validateTeamLogo(nextLogo);
    if (issues.length > 0) {
      setErrors((current) => ({ ...current, logo: issues[0]?.message }));
      event.currentTarget.value = "";
      return;
    }

    setLogo(nextLogo);
    setErrors((current) => ({ ...current, logo: undefined, form: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const formData = new FormData(event.currentTarget);
    const rawSlot = String(formData.get("slotNumber") ?? "").trim();
    setIsSaving(true);
    setErrors({});

    try {
      const updated = await getClientTeamRepository().updateTeam(
        team.tournamentId,
        team.id,
        {
          name: String(formData.get("name") ?? ""),
          shortName: String(formData.get("shortName") ?? "") || null,
          slotNumber: rawSlot.length === 0 ? null : Number(rawSlot),
          logo,
        },
      );
      if (!updated) {
        throw new Error("This team is no longer in the tournament roster.");
      }
      await onSaved();
      onClose();
    } catch (error) {
      if (error instanceof TeamValidationError) {
        const nextErrors: EditErrors = {};
        for (const issue of error.issues) {
          nextErrors[issue.field] ??= issue.message;
        }
        setErrors(nextErrors);
      } else if (error instanceof TeamRepositoryError) {
        setErrors({
          [error.code === "SLOT_CONFLICT" ? "slotNumber" : "name"]:
            error.message,
        });
      } else {
        setErrors({
          form:
            error instanceof Error
              ? error.message
              : "This team could not be saved. Try again.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isSaving) return;
    setIsSaving(true);
    setErrors({});
    try {
      await getClientTeamRepository().deleteTeam(team.tournamentId, team.id);
      await onDeleted();
      onClose();
    } catch {
      setErrors({ form: "This team could not be removed. Try again." });
      setIsSaving(false);
    }
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

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="field-label" htmlFor="editTeamName">
              Team name
            </label>
            <input
              className="field-control"
              id="editTeamName"
              name="name"
              defaultValue={team.name}
              maxLength={MAX_TEAM_NAME_LENGTH}
              required
              autoFocus
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <p className="field-error">{errors.name}</p> : null}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
            <div>
              <label className="field-label" htmlFor="editTeamShortName">
                Short name <span className="field-optional">Optional</span>
              </label>
              <input
                className="field-control"
                id="editTeamShortName"
                name="shortName"
                defaultValue={team.shortName ?? ""}
                maxLength={MAX_TEAM_SHORT_NAME_LENGTH}
                placeholder="e.g. SOUL"
                aria-invalid={Boolean(errors.shortName)}
              />
              {errors.shortName ? (
                <p className="field-error">{errors.shortName}</p>
              ) : null}
            </div>
            <div>
              <label className="field-label" htmlFor="editTeamSlot">
                Slot number
              </label>
              <input
                className="field-control tabular-nums"
                id="editTeamSlot"
                name="slotNumber"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_TEAM_SLOT_NUMBER}
                step={1}
                defaultValue={team.slotNumber ?? ""}
                aria-invalid={Boolean(errors.slotNumber)}
              />
              {errors.slotNumber ? (
                <p className="field-error">{errors.slotNumber}</p>
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
                  onClick={() => setLogo(null)}
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
              Maximum {MAX_LOGO_FILE_SIZE_BYTES / 1024 / 1024} MB
            </p>
            {errors.logo ? <p className="field-error">{errors.logo}</p> : null}
          </div>

          {errors.form ? (
            <p
              className="field-error rounded-lg border border-red-400/20 bg-red-400/5 p-3"
              role="alert"
            >
              {errors.form}
            </p>
          ) : null}

          <button
            className="primary-action w-full disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={isSaving}
          >
            {isSaving && !confirmingDelete ? "Saving…" : "Save team"}
          </button>
        </form>

        <div className="mt-5 border-t border-white/8 pt-5">
          {confirmingDelete ? (
            <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3">
              <p className="text-sm font-bold text-white">
                Remove {team.name} from this tournament?
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                This removes the locally saved team record.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="min-h-11 rounded-lg border border-white/10 text-sm font-bold text-slate-300"
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="min-h-11 rounded-lg bg-red-400 px-3 text-sm font-black text-slate-950 disabled:opacity-60"
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isSaving}
                >
                  {isSaving ? "Removing…" : "Yes, remove"}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="min-h-11 text-sm font-bold text-red-300 hover:text-red-200"
              type="button"
              onClick={() => setConfirmingDelete(true)}
            >
              Remove team
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
