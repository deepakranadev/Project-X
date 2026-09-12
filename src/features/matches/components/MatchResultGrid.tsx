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
  readonly onNumberChange: (resultId: string, field: "placement" | "kills", rawValue: string) => void;
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
    <div className="divide-y divide-border bg-surface" data-testid="manual-result-grid">
      <div className="grid grid-cols-[minmax(0,1fr)_3.75rem_3.75rem_3.25rem] gap-1.5 border-b border-border bg-surface-raised px-3 py-2 text-[0.68rem] font-black uppercase tracking-wide text-muted-foreground sm:grid-cols-[minmax(0,1fr)_5rem_5rem_4.5rem] sm:gap-3 sm:px-6">
        <span>Team</span><span className="text-center">Place</span><span className="text-center">Fin</span><span className="text-center">DNP</span>
      </div>
      {results.map((result, index) => (
        <MatchResultRow
          key={result.id}
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
  );
}
