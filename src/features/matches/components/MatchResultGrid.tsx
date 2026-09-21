"use client";

import type { KeyboardEvent } from "react";

import type { StoredMatchResult } from "@/domain/matches/types";
import type { ManualMatchValidationIssue } from "@/domain/matches/validation";
import type { Team } from "@/domain/teams/types";
import { matchResultHasIssue } from "@/features/matches/matchEntryIssues";

import { MatchResultRow } from "./MatchResultRow";

interface MatchResultGridProps {
  readonly disabled: boolean;
  readonly issues: readonly ManualMatchValidationIssue[];
  readonly results: readonly StoredMatchResult[];
  readonly teams: readonly Team[];
  readonly onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  readonly onNumberChange: (
    resultId: string,
    field: "placement" | "kills",
    rawValue: string,
  ) => void;
  readonly onToggleDnp: (resultId: string) => void;
}

export function MatchResultGrid({
  disabled,
  issues,
  results,
  teams,
  onInputKeyDown,
  onNumberChange,
  onToggleDnp,
}: MatchResultGridProps) {
  const teamById = new Map(teams.map((team) => [team.id, team]));

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      data-testid="manual-result-grid"
    >
      {/* Table header */}
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_3.5rem_3.5rem_2.75rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_5.5rem_4rem] items-center gap-1.5 sm:gap-4 border-b border-slate-200 bg-slate-50/75 px-3 sm:px-6 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
        <span className="text-center">#</span>
        <span>Team</span>
        <span className="text-center">Place</span>
        <span className="text-center">Fin</span>
        <span className="text-center">DNP</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 bg-white">
        {results.map((result, index) => (
          <MatchResultRow
            key={result.id}
            index={index}
            result={result}
            team={teamById.get(result.teamId)}
            hasIssue={matchResultHasIssue(result, index, issues)}
            disabled={disabled}
            onNumberChange={onNumberChange}
            onToggleDnp={onToggleDnp}
            onInputKeyDown={onInputKeyDown}
          />
        ))}
      </div>
    </div>
  );
}
