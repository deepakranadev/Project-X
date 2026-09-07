"use client";

import { useEffect, useState } from "react";

import type { Tournament } from "@/domain/tournaments/types";
import { getClientMatchRepository } from "@/lib/persistence/clientMatchRepository";
import { getClientMatchResultRepository } from "@/lib/persistence/clientMatchResultRepository";
import { getClientTeamRepository } from "@/lib/persistence/clientTeamRepository";
import {
  loadGuestOverallStandings,
  type GuestOverallStandingsSnapshot,
} from "@/lib/persistence/loadGuestOverallStandings";

interface OverallStandingsProps {
  readonly tournament: Tournament;
  readonly refreshVersion: number;
}

type StandingsState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly snapshot: GuestOverallStandingsSnapshot;
    }
  | { readonly status: "error" };

function matchCountLabel(count: number): string {
  return `${count} finalized ${count === 1 ? "match" : "matches"}`;
}

export function OverallStandings({
  tournament,
  refreshVersion,
}: OverallStandingsProps) {
  const [state, setState] = useState<StandingsState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const snapshot = await loadGuestOverallStandings({
          tournament,
          matchRepository: getClientMatchRepository(),
          matchResultRepository: getClientMatchResultRepository(),
          teamRepository: getClientTeamRepository(),
        });
        if (active) setState({ status: "ready", snapshot });
      } catch {
        if (active) setState({ status: "error" });
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [refreshVersion, tournament]);

  return (
    <section className="mt-10 scroll-mt-4 sm:mt-14" id="standings">
      <p className="eyebrow">05 · Overall standings</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            Overall points table
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Calculated from finalized matches using this tournament’s scoring
            rules.
          </p>
        </div>
        {state.status === "ready" && state.snapshot.finalizedMatchCount > 0 ? (
          <span className="rounded-full bg-lime-300/10 px-3 py-1 text-xs font-black text-lime-200">
            {matchCountLabel(state.snapshot.finalizedMatchCount)}
          </span>
        ) : null}
      </div>

      <div className="panel mt-5 overflow-hidden">
        {state.status === "loading" ? (
          <p className="p-6 text-sm text-slate-400" role="status">
            Calculating standings…
          </p>
        ) : null}

        {state.status === "error" ? (
          <div className="p-6" role="alert">
            <p className="text-sm font-black text-red-200">
              Standings could not be calculated.
            </p>
            <p className="mt-2 text-sm leading-6 text-red-300">
              Reopen the affected finalized match and correct its result rows,
              then finalize it again.
            </p>
          </div>
        ) : null}

        {state.status === "ready" &&
        state.snapshot.finalizedMatchCount === 0 ? (
          <div className="p-7 text-center" role="status">
            <p className="text-sm font-black text-white">
              {state.snapshot.totalMatchCount === 0
                ? "No finalized matches yet."
                : "Only draft matches exist."}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {state.snapshot.totalMatchCount === 0
                ? "Create and finalize a match to calculate the points table."
                : "Finalize a draft match to add it to the points table."}
            </p>
          </div>
        ) : null}

        {state.status === "ready" &&
        state.snapshot.finalizedMatchCount > 0 ? (
          <StandingsRows snapshot={state.snapshot} />
        ) : null}
      </div>
    </section>
  );
}

function StandingsRows({
  snapshot,
}: {
  readonly snapshot: GuestOverallStandingsSnapshot;
}) {
  const teamById = new Map(snapshot.teams.map((team) => [team.id, team]));
  const unknownTeamCount = snapshot.standings.filter(
    (row) => !teamById.has(row.teamId),
  ).length;

  return (
    <>
      {unknownTeamCount > 0 ? (
        <p
          className="border-b border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-200 sm:px-6"
          role="alert"
        >
          {unknownTeamCount === 1
            ? "One finalized result references a team no longer in this roster."
            : `${unknownTeamCount} finalized results reference teams no longer in this roster.`}
        </p>
      ) : null}

      <ol className="divide-y divide-white/6 sm:hidden" data-standings-mobile>
        {snapshot.standings.map((row) => {
          const name = teamById.get(row.teamId)?.name ?? `Unknown team (${row.teamId})`;
          return (
            <li
              className="grid grid-cols-[2.25rem_minmax(0,1fr)_3.5rem] gap-2 px-3 py-3.5"
              key={row.teamId}
              data-standing-team={row.teamId}
            >
              <span className="pt-0.5 text-base font-black tabular-nums text-lime-300">
                #{row.rank}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{name}</p>
                <dl className="mt-2 grid grid-cols-3 gap-2">
                  <StandingMetric label="MP" value={row.matchesPlayed} />
                  <StandingMetric label="Place pts" value={row.placementPoints} />
                  <StandingMetric label="Finish pts" value={row.killPoints} />
                </dl>
              </div>
              <div className="text-right">
                <span className="block text-xs font-black uppercase tracking-wide text-slate-500">
                  Total
                </span>
                <strong className="mt-0.5 block text-xl font-black tabular-nums text-white">
                  {row.totalPoints}
                </strong>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="hidden sm:block">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="bg-white/2 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-16 px-6 py-3">Rank</th>
              <th className="px-3 py-3">Team</th>
              <th className="w-24 px-3 py-3 text-right">Played</th>
              <th className="w-28 px-3 py-3 text-right">Place pts</th>
              <th className="w-28 px-3 py-3 text-right">Finish pts</th>
              <th className="w-24 px-6 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {snapshot.standings.map((row) => (
              <tr key={row.teamId} data-standing-team={row.teamId}>
                <td className="px-6 py-4 font-black tabular-nums text-lime-300">
                  #{row.rank}
                </td>
                <td className="truncate px-3 py-4 font-black text-white">
                  {teamById.get(row.teamId)?.name ?? `Unknown team (${row.teamId})`}
                </td>
                <td className="px-3 py-4 text-right font-bold tabular-nums text-slate-300">
                  {row.matchesPlayed}
                </td>
                <td className="px-3 py-4 text-right font-bold tabular-nums text-slate-300">
                  {row.placementPoints}
                </td>
                <td className="px-3 py-4 text-right font-bold tabular-nums text-slate-300">
                  {row.killPoints}
                </td>
                <td className="px-6 py-4 text-right text-lg font-black tabular-nums text-white">
                  {row.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StandingMetric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-600">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-black tabular-nums text-slate-300">
        {value}
      </dd>
    </div>
  );
}
