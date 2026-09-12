"use client";

import type { Tournament } from "@/domain/tournaments/types";
import { useOverallStandings, type StandingsRepositories } from "@/features/standings/useOverallStandings";
import type { GuestTeam } from "@/features/teams/types";

import { StandingsRows } from "./StandingsRows";

interface OverallStandingsProps {
  readonly tournament: Tournament;
  readonly teams: readonly GuestTeam[];
  readonly repositories: StandingsRepositories;
  readonly refreshVersion: number;
}

function matchCountLabel(count: number): string {
  return `${count} finalized ${count === 1 ? "match" : "matches"}`;
}

export function OverallStandings({
  tournament,
  teams,
  repositories,
  refreshVersion,
}: OverallStandingsProps) {
  const state = useOverallStandings(tournament, teams, repositories, refreshVersion);

  return (
    <section className="mt-10 scroll-mt-4 sm:mt-14" id="standings">
      <p className="eyebrow">05 · Overall standings</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">
            Overall points table
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Calculated from finalized matches using this tournament’s scoring
            rules.
          </p>
        </div>
        {state.status === "ready" && state.snapshot.finalizedMatchCount > 0 ? (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-500/20">
            {matchCountLabel(state.snapshot.finalizedMatchCount)}
          </span>
        ) : null}
      </div>

      <div className="panel mt-5 overflow-hidden">
        {state.status === "loading" ? (
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Calculating standings…
          </p>
        ) : null}

        {state.status === "error" ? (
          <div className="p-6 bg-red-500/5" role="alert">
            <p className="text-sm font-black text-red-700">
              Standings could not be calculated.
            </p>
            <p className="mt-2 text-sm leading-6 text-red-600">
              Reopen the affected finalized match and correct its result rows,
              then finalize it again.
            </p>
          </div>
        ) : null}

        {state.status === "ready" &&
        state.snapshot.finalizedMatchCount === 0 ? (
          <div className="p-7 text-center bg-surface" role="status">
            <p className="text-sm font-black text-foreground">
              {state.snapshot.totalMatchCount === 0
                ? "No finalized matches yet."
                : "Only draft matches exist."}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
