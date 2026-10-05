"use client";

import type { TournamentStanding } from "@/domain/scoring/types";
import type { Team } from "@/domain/teams/types";
import { formatStandingsScore } from "../utils/formatStandingsScore";

interface StandingsMobileListProps {
  readonly standings: readonly TournamentStanding[];
  readonly teamById: ReadonlyMap<string, Team>;
  readonly finalizedMatchCount: number;
}

export function StandingsMobileList({
  standings,
  teamById,
  finalizedMatchCount,
}: StandingsMobileListProps) {
  return (
    <div className="md:hidden" data-standings-mobile>
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-3 py-2 flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span className="w-8 text-center shrink-0">#</span>
        <span className="flex-1 min-w-0 px-2 text-left">Team</span>
        <span className="w-10 text-center shrink-0">MP</span>
        <span className="w-12 text-center shrink-0">Fin</span>
        <span className="w-14 text-right shrink-0">Total</span>
      </div>

      {/* Rows */}
      <ol className="divide-y divide-slate-100">
        {standings.map((row) => {
          const team = teamById.get(row.teamId);
          const teamName = team?.name ?? `Unknown team (${row.teamId})`;
          const hasDnp =
            finalizedMatchCount > 0 && row.matchesPlayed < finalizedMatchCount;
          const dnpCount = finalizedMatchCount - row.matchesPlayed;
          const isTopThree = row.rank <= 3;

          return (
            <li
              key={row.teamId}
              data-standing-team={row.teamId}
              className={`flex items-center px-3 py-2.5 transition-colors relative ${
                isTopThree ? "bg-orange-50/20" : ""
              }`}
            >
              {/* Left rank accent line for top 3 */}
              {isTopThree ? (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-brand-primary rounded-r" />
              ) : null}

              {/* Rank number: rendered as #{rank} to satisfy Playwright toContainText("#1") */}
              <div className="w-8 shrink-0 text-center">
                <span
                  className={`text-xs font-black tabular-nums ${
                    row.rank === 1
                      ? "text-brand-primary font-black"
                      : isTopThree
                        ? "text-slate-800 font-black"
                        : "text-slate-400 font-bold"
                  }`}
                >
                  #{row.rank}
                </span>
              </div>

              {/* Team Name */}
              <div className="flex-1 min-w-0 px-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">
                    {teamName}
                  </p>
                  {row.rank === 1 ? (
                    <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-black bg-brand-50 text-brand-primary border border-brand-primary/20">
                      1st
                    </span>
                  ) : null}
                  {hasDnp ? (
                    <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-500">
                      {dnpCount} DNP
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Matches Played */}
              <div className="w-10 shrink-0 text-center">
                <span className="text-xs font-semibold tabular-nums text-slate-600">
                  {row.matchesPlayed}
                </span>
              </div>

              {/* Finishes */}
              <div className="w-12 shrink-0 text-center">
                <span className="text-xs font-semibold tabular-nums text-slate-600">
                  {row.totalKills}
                </span>
              </div>

              {/* Total Points */}
              <div className="w-14 shrink-0 text-right">
                <strong
                  className={`text-sm tabular-nums ${
                    row.rank === 1
                      ? "font-black text-brand-primary"
                      : "font-black text-slate-900"
                  }`}
                >
                  {formatStandingsScore(row.totalPoints)}
                </strong>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
