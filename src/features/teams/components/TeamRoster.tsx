"use client";

import type { GuestTeam } from "@/features/teams/types";

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
        className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-white/5 object-cover"
      />
    );
  }

  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-sm font-black text-lime-300"
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
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-4 sm:px-6">
        <h2
          className="text-xs font-black tracking-[0.18em] text-slate-300"
          id="teams-heading"
        >
          TEAMS
        </h2>
        <span className="text-sm font-black text-lime-300">{teams.length}</span>
      </div>

      <ol className="divide-y divide-white/6">
        {teams.map((team, index) => (
          <li
            className="grid min-w-0 grid-cols-[2.7rem_2.5rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-3 sm:grid-cols-[3.25rem_2.5rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-6"
            key={team.id}
          >
            <span className="text-sm font-black tabular-nums text-slate-400">
              {team.slotNumber === null ? "—" : `#${team.slotNumber}`}
            </span>
            <TeamMark team={team} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-white sm:text-base">
                {team.name}
              </span>
              {team.shortName ? (
                <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                  {team.shortName}
                </span>
              ) : null}
            </span>
            <span className="flex items-center gap-1">
              <button
                className="grid h-9 w-8 place-items-center rounded-md text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-25"
                type="button"
                aria-label={`Move ${team.name} up`}
                title="Move up"
                disabled={isReordering || index === 0}
                onClick={() => onMove(index, -1)}
              >
                ↑
              </button>
              <button
                className="grid h-9 w-8 place-items-center rounded-md text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-25"
                type="button"
                aria-label={`Move ${team.name} down`}
                title="Move down"
                disabled={isReordering || index === teams.length - 1}
                onClick={() => onMove(index, 1)}
              >
                ↓
              </button>
              <button
                className="min-h-9 rounded-md border border-white/10 px-2.5 text-xs font-bold text-slate-300 hover:border-lime-300/40 hover:text-lime-300"
                type="button"
                aria-label={`Edit ${team.name}`}
                onClick={() => onEdit(team)}
              >
                Edit
              </button>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
