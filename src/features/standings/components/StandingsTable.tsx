"use client";

import type { TournamentStanding } from "@/domain/scoring/types";
import type { Team } from "@/domain/teams/types";
import { formatStandingsScore } from "../utils/formatStandingsScore";
import { StandingsMobileList } from "./StandingsMobileList";

interface StandingsTableProps {
  readonly standings: readonly TournamentStanding[];
  readonly teamById: ReadonlyMap<string, Team>;
  readonly finalizedMatchCount: number;
}

function getDesktopRankCell(rank: number) {
  switch (rank) {
    case 1:
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-black text-xs shadow-2xs">
          1
        </span>
      );
    case 2:
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-black text-xs shadow-2xs">
          2
        </span>
      );
    case 3:
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-orange-100 text-orange-800 font-black text-xs shadow-2xs">
          3
        </span>
      );
    default:
      return (
        <span className="font-bold text-slate-400 tabular-nums text-xs">
          {rank}
        </span>
      );
  }
}

export function StandingsTable({
  standings,
  teamById,
  finalizedMatchCount,
}: StandingsTableProps) {
  const unknownTeamCount = standings.filter(
    (row) => !teamById.has(row.teamId),
  ).length;

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
      data-purpose="standings-leaderboard"
    >
      {unknownTeamCount > 0 ? (
        <div
          className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-800"
          role="alert"
        >
          {unknownTeamCount === 1
            ? "One finalized result references a team no longer in this roster."
            : `${unknownTeamCount} finalized results reference teams no longer in this roster.`}
        </div>
      ) : null}

      {/* Desktop Standings Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="w-16 px-4 py-3 text-center">
                Rank
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Team
              </th>
              <th scope="col" className="w-20 px-3 py-3 text-center">
                MP
              </th>
              <th scope="col" className="w-20 px-3 py-3 text-center">
                WWCD
              </th>
              <th scope="col" className="w-32 px-3 py-3 text-right">
                Placement Pts
              </th>
              <th scope="col" className="w-28 px-3 py-3 text-right">
                Finishes
              </th>
              <th scope="col" className="w-28 px-6 py-3 text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {standings.map((row) => {
              const team = teamById.get(row.teamId);
              const teamName = team?.name ?? `Unknown team (${row.teamId})`;
              const hasDnp =
                finalizedMatchCount > 0 &&
                row.matchesPlayed < finalizedMatchCount;
              const dnpCount = finalizedMatchCount - row.matchesPlayed;
              const isTopThree = row.rank <= 3;

              return (
                <tr
                  key={row.teamId}
                  data-standing-team={row.teamId}
                  className={`transition-colors hover:bg-slate-50/70 ${
                    isTopThree ? "bg-amber-50/15" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 text-center">
                    {getDesktopRankCell(row.rank)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {teamName}
                      </span>
                      {hasDnp ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          {dnpCount} DNP
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center font-medium tabular-nums text-slate-600 text-sm">
                    {row.matchesPlayed}
                  </td>
                  <td className="px-3 py-3.5 text-center font-medium tabular-nums text-slate-600 text-sm">
                    {row.wwcd}
                  </td>
                  <td className="px-3 py-3.5 text-right font-medium tabular-nums text-slate-600 text-sm">
                    {formatStandingsScore(row.placementPoints)}
                  </td>
                  <td className="px-3 py-3.5 text-right font-medium tabular-nums text-slate-600 text-sm">
                    {row.totalKills}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <strong className="text-base font-black tabular-nums text-slate-900">
                      {formatStandingsScore(row.totalPoints)}
                    </strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Standings Dense List */}
      <StandingsMobileList
        standings={standings}
        teamById={teamById}
        finalizedMatchCount={finalizedMatchCount}
      />
    </div>
  );
}
