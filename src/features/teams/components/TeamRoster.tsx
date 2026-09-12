"use client";

import type { GuestTeam } from "@/features/teams/types";
import { Button } from "@/shared/ui/button";

import { PersistedImagePreview } from "./PersistedImagePreview";

interface TeamRosterProps {
  readonly teams: readonly GuestTeam[];
  readonly isReordering: boolean;
  readonly onEdit: (team: GuestTeam) => void;
  readonly onMove: (teamIndex: number, direction: -1 | 1) => void;
}

function TeamMark({ team }: { readonly team: GuestTeam }) {
  if (team.logo) {
    return (
      <PersistedImagePreview
        image={team.logo}
        alt={`${team.name} logo`}
        className="h-9 w-9 shrink-0 rounded-lg border border-border bg-surface-raised object-cover"
      />
    );
  }

  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised text-sm font-black text-foreground"
      aria-hidden="true"
    >
      {team.name.charAt(0).toUpperCase()}
    </span>
  );
}

export function TeamRoster({
  teams,
  isReordering,
  onEdit,
  onMove,
}: TeamRosterProps) {
  return (
    <section className="panel overflow-hidden" aria-labelledby="teams-heading">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
        <h2
          className="text-xs font-black tracking-[0.18em] text-muted-foreground"
          id="teams-heading"
        >
          TEAMS
        </h2>
        <span className="text-xs font-bold text-foreground bg-surface-raised px-2 py-0.5 rounded-full border border-border">{teams.length} registered</span>
      </div>

      <ol className="divide-y divide-border bg-background">
        {teams.map((team, index) => (
          <li
            className="grid min-w-0 grid-cols-[2rem_2.25rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2.5 sm:grid-cols-[2.5rem_2.25rem_minmax(0,1fr)_auto] sm:gap-3 sm:px-6 hover:bg-surface-raised/50 transition-colors"
            key={team.id}
          >
            <span className="text-xs font-black tabular-nums text-muted-foreground">
              {team.slotNumber === null ? "—" : `#${team.slotNumber}`}
            </span>
            <TeamMark team={team} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">
                {team.name}
              </span>
              {team.shortName ? (
                <span className="block truncate text-[11px] font-semibold text-muted-foreground">
                  {team.shortName}
                </span>
              ) : null}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-7 text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-25"
                type="button"
                aria-label={`Move ${team.name} up`}
                title="Move up"
                disabled={isReordering || index === 0}
                onClick={() => onMove(index, -1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-7 text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-25"
                type="button"
                aria-label={`Move ${team.name} down`}
                title="Move down"
                disabled={isReordering || index === teams.length - 1}
                onClick={() => onMove(index, 1)}
              >
                ↓
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-1 h-8 min-h-8 border-border bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-surface-raised"
                type="button"
                aria-label={`Edit ${team.name}`}
                onClick={() => onEdit(team)}
              >
                Edit
              </Button>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
