"use client";

import { memo, type KeyboardEvent } from "react";

import type { StoredMatchResult } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";

interface MatchResultRowProps {
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

  return (
    <div
      className={`grid min-w-0 grid-cols-[minmax(0,1fr)_3.75rem_3.75rem_3.25rem] items-center gap-1.5 px-3 py-2.5 transition-colors sm:grid-cols-[minmax(0,1fr)_5rem_5rem_4.5rem] sm:gap-3 sm:px-6 ${hasIssue ? "bg-red-500/5" : isDnp ? "bg-surface opacity-60" : "bg-surface hover:bg-surface-raised"}`}
      data-result-team={result.teamId}
    >
      <span className="min-w-0 pr-1">
        <span className="block truncate text-sm font-extrabold text-foreground">
          {teamName}
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-muted-foreground">
          {team?.slotNumber
            ? `Slot ${team.slotNumber}`
            : team?.shortName ?? "No slot"}
        </span>
      </span>
      <input
        className="h-11 min-w-0 w-full rounded-lg border border-border bg-background px-1 text-center text-base font-black tabular-nums text-foreground outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground disabled:opacity-50"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
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
      <input
        className="h-11 min-w-0 w-full rounded-lg border border-border bg-background px-1 text-center text-base font-black tabular-nums text-foreground outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground disabled:opacity-50"
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        data-result-input="kills"
        aria-label={`Finishes for ${teamName}`}
        aria-invalid={hasIssue}
        disabled={disabled || isDnp || !team}
        value={result.kills ?? ""}
        onChange={(event) => onNumberChange(result.id, "kills", event.currentTarget.value)}
        onKeyDown={onInputKeyDown}
      />
      <button
        className={`h-11 rounded-lg border text-xs font-black transition-colors ${
          isDnp
            ? "border-amber-500 bg-amber-500 text-white"
            : "border-border text-muted-foreground hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-600"
        }`}
        type="button"
        aria-label={`${isDnp ? "Mark" : "Set"} ${teamName} ${isDnp ? "as played" : "as DNP"}`}
        aria-pressed={isDnp}
        disabled={disabled || !team}
        onClick={() => onToggleDnp(result.id)}
      >
        {isDnp ? "DNP" : "—"}
      </button>
    </div>
  );
});
