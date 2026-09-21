"use client";

import { memo, type KeyboardEvent } from "react";

import type { StoredMatchResult } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";

interface MatchResultRowProps {
  readonly index: number;
  readonly result: StoredMatchResult;
  readonly team: Team | undefined;
  readonly hasIssue: boolean;
  readonly disabled: boolean;
  readonly onNumberChange: (
    resultId: string,
    field: "placement" | "kills",
    rawValue: string,
  ) => void;
  readonly onToggleDnp: (resultId: string) => void;
  readonly onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export const MatchResultRow = memo(function MatchResultRow({
  index,
  result,
  team,
  hasIssue,
  disabled,
  onNumberChange,
  onToggleDnp,
  onInputKeyDown,
}: MatchResultRowProps) {
  const isDnp = result.participationStatus === "DNP";
  const teamName = team?.name ?? `Unknown team (${result.teamId})`;
  const slotDisplay = team?.slotNumber
    ? String(team.slotNumber).padStart(2, "0")
    : String(index + 1).padStart(2, "0");

  return (
    <div
      className={`grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)_3.5rem_3.5rem_2.75rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_5.5rem_4rem] items-center gap-1.5 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors ${
        hasIssue
          ? "bg-red-500/5"
          : isDnp
            ? "bg-slate-50/50 opacity-70"
            : "hover:bg-slate-50/60"
      }`}
      data-result-team={result.teamId}
    >
      {/* Slot identifier */}
      <span className="text-center text-xs font-bold tabular-nums text-slate-400">
        {slotDisplay}
      </span>

      {/* Team identity */}
      <div className="min-w-0 pr-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-xs sm:text-sm font-bold text-slate-900">
            {teamName}
          </span>
          {isDnp ? (
            <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
              DNP
            </span>
          ) : null}
        </div>
        <span className="block truncate text-[11px] font-medium text-slate-400">
          {team?.slotNumber
            ? `Slot ${team.slotNumber}`
            : team?.shortName ?? "No slot"}
        </span>
      </div>

      {/* Placement Input */}
      <div>
        <input
          className="h-10 sm:h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-1 text-center text-sm sm:text-base font-black tabular-nums text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#e05305] focus:ring-2 focus:ring-[#e05305]/20 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder={isDnp ? "—" : ""}
          data-result-input="placement"
          aria-label={`Placement for ${teamName}`}
          aria-invalid={hasIssue}
          disabled={disabled || isDnp || !team}
          value={result.placement ?? ""}
          onChange={(event) =>
            onNumberChange(result.id, "placement", event.currentTarget.value)
          }
          onKeyDown={onInputKeyDown}
        />
      </div>

      {/* Finishes Input */}
      <div>
        <input
          className="h-10 sm:h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-1 text-center text-sm sm:text-base font-black tabular-nums text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#e05305] focus:ring-2 focus:ring-[#e05305]/20 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder={isDnp ? "—" : ""}
          data-result-input="kills"
          aria-label={`Finishes for ${teamName}`}
          aria-invalid={hasIssue}
          disabled={disabled || isDnp || !team}
          value={result.kills ?? ""}
          onChange={(event) =>
            onNumberChange(result.id, "kills", event.currentTarget.value)
          }
          onKeyDown={onInputKeyDown}
        />
      </div>

      {/* DNP Checkbox Control */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          aria-label={`${isDnp ? "Mark" : "Set"} ${teamName} ${isDnp ? "as played" : "as DNP"}`}
          aria-pressed={isDnp}
          disabled={disabled || !team}
          onClick={() => onToggleDnp(result.id)}
          className="group flex h-10 sm:h-11 w-full items-center justify-center rounded-lg transition-colors hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-[#e05305]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
              isDnp
                ? "border-[#e05305] bg-[#e05305] text-white shadow-sm"
                : "border-slate-300 bg-white group-hover:border-slate-400"
            }`}
          >
            {isDnp ? (
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : null}
          </div>
        </button>
      </div>
    </div>
  );
});
