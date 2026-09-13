"use client";

import React from "react";
import type { GuestTeam } from "@/features/teams/types";

interface TeamRosterTableProps {
  readonly teams: readonly GuestTeam[];
  readonly onEdit: (team: GuestTeam) => void;
  readonly onAddTeam: () => void;
  readonly onBulkAdd: () => void;
}

export function TeamRosterTable({
  teams,
  onEdit,
  onAddTeam,
  onBulkAdd,
}: TeamRosterTableProps) {
  if (teams.length === 0) {
    return (
      <section
        aria-labelledby="teams-heading"
        className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center shadow-xs"
        data-purpose="team-empty-state"
      >
        <h2 id="teams-heading" className="sr-only">
          TEAMS
        </h2>
        <div className="w-12 h-12 rounded-full bg-orange-50 text-[#e05305] flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-900">No teams registered yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Add your tournament teams individually or paste the full roster using Bulk Add.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2.5">
          <button
            onClick={onAddTeam}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#e05305] hover:bg-[#c94703] rounded-lg shadow-sm transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
            Add Team
          </button>
          <button
            onClick={onBulkAdd}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" x2="12" y1="3" y2="15"></line>
            </svg>
            Bulk Add
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="teams-heading">
      <h2 id="teams-heading" className="sr-only">
        TEAMS
      </h2>

      {/* Desktop Table View */}
      <div
        className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
        data-purpose="team-roster-table"
      >
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-500 uppercase select-none">
          <div className="col-span-2 sm:col-span-1">Slot</div>
          <div className="col-span-7 sm:col-span-8">Team Name</div>
          <div className="col-span-3 sm:col-span-3 text-right">Actions</div>
        </div>
        <ol className="divide-y divide-slate-100">
          {teams.map((team, index) => {
            const slotDisplay = `#${team.slotNumber ?? index + 1}`;
            return (
              <li
                key={team.id}
                role="listitem"
                tabIndex={0}
                onClick={() => onEdit(team)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onEdit(team);
                  }
                }}
                className="grid grid-cols-12 gap-4 items-center px-6 py-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                <div className="col-span-2 sm:col-span-1">
                  <span className="inline-block px-2 py-0.5 text-xs font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200/80 rounded">
                    {slotDisplay}
                  </span>
                </div>
                <div className="col-span-7 sm:col-span-8 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-[#e05305] transition-colors">
                    {team.name}
                  </span>
                  {team.shortName ? (
                    <span className="text-xs text-slate-400 font-medium">
                      ({team.shortName})
                    </span>
                  ) : null}
                </div>
                <div className="col-span-3 sm:col-span-3 flex items-center justify-end gap-3 text-right">
                  <button
                    type="button"
                    aria-label={`Edit ${team.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(team);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 focus:outline-none"
                  >
                    <span>Edit</span>
                    <svg
                      className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile List View */}
      <div
        className="md:hidden bg-white rounded-xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden"
        data-purpose="team-list"
      >
        <ol className="divide-y divide-gray-100">
          {teams.map((team, index) => {
            const slotDisplay = `#${team.slotNumber ?? index + 1}`;
            return (
              <li
                key={team.id}
                role="listitem"
                tabIndex={0}
                onClick={() => onEdit(team)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onEdit(team);
                  }
                }}
                className="flex items-center justify-between px-3.5 py-3 border-b last:border-b-0 border-gray-100 hover:bg-gray-50/70 active:scale-[0.98] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-7 h-6 rounded flex items-center justify-center bg-gray-100/90 text-gray-500 font-semibold text-[11px] shrink-0 font-mono">
                    {slotDisplay}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-xs text-gray-900 truncate">
                      {team.name}
                    </span>
                    {team.shortName ? (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        ({team.shortName})
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 ml-2">
                  <button
                    type="button"
                    aria-label={`Edit ${team.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(team);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4 text-gray-400 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
