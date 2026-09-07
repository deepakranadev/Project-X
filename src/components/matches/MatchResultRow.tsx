"use client";

import type { KeyboardEvent } from "react";

import type { StoredMatchResult } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";

interface MatchResultRowProps {
  readonly result: StoredMatchResult;
  readonly team: Team | undefined;
  readonly hasIssue: boolean;
  readonly onNumberChange: (
    field: "placement" | "kills",
    rawValue: string,
  ) => void;
  readonly onToggleDnp: () => void;
  readonly onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function MatchResultRow({
  result,
  team,
  hasIssue,
  onNumberChange,
  onToggleDnp,
  onInputKeyDown,
}: MatchResultRowProps) {
  const isDnp = result.participationStatus === "DNP";
  const teamName = team?.name ?? `Unknown team (${result.teamId})`;

  return (
    <div
      className={`grid min-w-0 grid-cols-[minmax(0,1fr)_3.75rem_3.75rem_3.25rem] items-center gap-1.5 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_4.5rem] sm:gap-3 sm:px-6 ${hasIssue ? "bg-red-400/6" : ""}`}
      data-result-team={result.teamId}
    >
      <span className="min-w-0 pr-1">
        <span className="block truncate text-sm font-extrabold text-white">
          {teamName}
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
          {team?.slotNumber
            ? `Slot ${team.slotNumber}`
            : team?.shortName ?? "No slot"}
        </span>
      </span>
      <input
        className="h-11 min-w-0 w-full rounded-lg border border-white/10 bg-slate-950 px-1 text-center text-base font-black tabular-nums text-white outline-none focus:border-lime-300 disabled:text-slate-600"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        data-result-input="placement"
        aria-label={`Placement for ${teamName}`}
        aria-invalid={hasIssue}
        disabled={isDnp || !team}
        value={result.placement ?? ""}
        onChange={(event) =>
          onNumberChange("placement", event.currentTarget.value)
        }
        onKeyDown={onInputKeyDown}
      />
      <input
        className="h-11 min-w-0 w-full rounded-lg border border-white/10 bg-slate-950 px-1 text-center text-base font-black tabular-nums text-white outline-none focus:border-lime-300 disabled:text-slate-600"
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        data-result-input="kills"
        aria-label={`Finishes for ${teamName}`}
        aria-invalid={hasIssue}
        disabled={isDnp || !team}
        value={result.kills ?? ""}
        onChange={(event) => onNumberChange("kills", event.currentTarget.value)}
        onKeyDown={onInputKeyDown}
      />
      <button
        className={`h-11 rounded-lg border text-xs font-black ${
          isDnp
            ? "border-amber-300 bg-amber-300 text-slate-950"
            : "border-white/10 text-slate-400 hover:border-amber-300/50 hover:text-amber-200"
        }`}
        type="button"
        aria-label={`${isDnp ? "Mark" : "Set"} ${teamName} ${isDnp ? "as played" : "as DNP"}`}
        aria-pressed={isDnp}
        disabled={!team}
        onClick={onToggleDnp}
      >
        {isDnp ? "DNP" : "—"}
      </button>
    </div>
  );
}

