"use client";

import type { TournamentStanding } from "@/domain/scoring/types";
import type { Team } from "@/domain/teams/types";
import { formatStandingsScore } from "../utils/formatStandingsScore";

interface StandingsTopThreeProps {
  readonly standings: readonly TournamentStanding[];
  readonly teamById: ReadonlyMap<string, Team>;
}

function getRankBadgeStyle(rank: number): {
  readonly circle: string;
  readonly labelColor: string;
  readonly labelText: string;
  readonly border?: string;
} {
  switch (rank) {
    case 1:
      return {
        circle: "bg-amber-100 text-amber-800 border border-amber-300/80",
        labelColor: "text-amber-700",
        labelText: "1ST PLACE",
        border: "border-l-4 border-l-amber-400 border-amber-200/70",
      };
    case 2:
      return {
        circle: "bg-slate-100 text-slate-700 border border-slate-300/80",
        labelColor: "text-slate-500",
        labelText: "2ND PLACE",
        border: "border-slate-200",
      };
    case 3:
      return {
        circle: "bg-orange-100 text-orange-800 border border-orange-300/80",
        labelColor: "text-orange-700",
        labelText: "3RD PLACE",
        border: "border-slate-200",
      };
    default:
      return {
        circle: "bg-slate-100 text-slate-600 border border-slate-200",
        labelColor: "text-slate-500",
        labelText: `RANK ${rank}`,
        border: "border-slate-200",
      };
  }
}

export function StandingsTopThree({
  standings,
  teamById,
}: StandingsTopThreeProps) {
  const topThree = standings.slice(0, 3);
  if (topThree.length === 0) return null;

  // For mobile 3-column podium layout:
  // If 3 items exist, order as [2nd, 1st, 3rd] to match mobile Stitch podium.
  // Otherwise, use natural slice.
  const mobileOrder =
    topThree.length === 3
      ? [topThree[1], topThree[0], topThree[2]]
      : topThree;

  return (
    <div className="space-y-3" data-purpose="standings-top-three">
      {/* Desktop Top-3 Cards */}
      <div className="hidden md:grid md:grid-cols-3 gap-3.5">
        {topThree.map((row) => {
          const team = teamById.get(row.teamId);
          const style = getRankBadgeStyle(row.rank);
          const points = formatStandingsScore(row.totalPoints);
          const placementPts = formatStandingsScore(row.placementPoints);

          return (
            <div
              key={row.teamId}
              className={`bg-white rounded-xl border p-4 shadow-xs flex items-center justify-between gap-3 ${style.border}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${style.circle}`}
                >
                  {row.rank}
                </span>
                <div className="min-w-0">
                  <span
                    className={`block text-[10px] font-black uppercase tracking-wider ${style.labelColor}`}
                  >
                    {style.labelText}
                  </span>
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {team?.name ?? `Team (${row.teamId})`}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {row.wwcd} WWCD · {placementPts} Place · {row.totalKills} Fin
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="block text-2xl font-black text-slate-900 tabular-nums">
                  {points}
                </span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase -mt-0.5">
                  pts
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Top-3 Podium */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-black uppercase tracking-wider text-slate-500">
            Tournament Leaders
          </span>
          <span className="text-[10px] font-semibold text-brand-primary">
            sorted by pts &gt; fin
          </span>
        </div>

        <div
          className={`grid gap-2 ${
            mobileOrder.length === 1
              ? "grid-cols-1"
              : mobileOrder.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
          }`}
        >
          {mobileOrder.map((row) => {
            const team = teamById.get(row.teamId);
            const isFirst = row.rank === 1;
            const points = formatStandingsScore(row.totalPoints);

            return (
              <div
                key={row.teamId}
                className={`rounded-xl p-2.5 flex flex-col justify-between shadow-2xs transition-all ${
                  isFirst
                    ? "border-2 border-brand-primary bg-orange-50/30"
                    : "border border-slate-200/90 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                      isFirst
                        ? "bg-brand-primary text-white"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {row.rank}
                  </span>
                  <span
                    className={`text-xs font-black tabular-nums ${
                      isFirst ? "text-brand-primary" : "text-slate-800"
                    }`}
                  >
                    {points}{" "}
                    <span className="text-[9px] font-medium text-slate-400">
                      pts
                    </span>
                  </span>
                </div>

                <div className="mt-1.5 min-w-0">
                  <p
                    className={`text-xs truncate ${
                      isFirst
                        ? "font-black text-slate-900"
                        : "font-bold text-slate-800"
                    }`}
                  >
                    {team?.name ?? `Team (${row.teamId})`}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    {row.totalKills} kills
                    {isFirst ? " · Leader" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
