import React from "react";
import type { Tournament } from "@/domain/tournaments/types";
import type { Team } from "@/domain/teams/types";
import type { OverviewState } from "../useOverviewData";
import { OverviewHeaderSection } from "./OverviewHeaderSection";
import { OverviewNextAction } from "./OverviewNextAction";
import { OverviewProgress } from "./OverviewProgress";
import { OverviewLeader } from "./OverviewLeader";

export function OverviewPresentation({
  state,
  tournament,
  teams,
  onNavigate,
}: {
  readonly state: Extract<OverviewState, { status: "ready" }>;
  readonly tournament: Tournament;
  readonly teams: readonly Team[];
  readonly onNavigate: (s: string) => void;
}) {
  const { matches, standingsSnapshot } = state;
  const teamsCount = standingsSnapshot.teams.length;

  const draftMatches = matches.filter((m) => m.status === "DRAFT");
  const finalizedMatches = matches.filter((m) => m.status === "FINALIZED");
  const currentMatch = draftMatches.length > 0 ? draftMatches.sort((a, b) => a.matchNumber - b.matchNumber)[0] : null;
  const currentLeader = standingsSnapshot.standings.length > 0 ? standingsSnapshot.standings[0] : null;

  return (
    <>
      <OverviewHeaderSection
        tournament={tournament}
        teamsCount={teamsCount}
        matchesCount={matches.length}
      />

      <OverviewNextAction
        currentMatch={currentMatch ?? null}
        matchesCount={matches.length}
        teamsCount={teamsCount}
        onNavigate={onNavigate}
      />

      <OverviewProgress
        matches={matches}
        finalizedMatches={finalizedMatches}
        onNavigate={onNavigate}
      />

      <OverviewLeader
        currentLeader={currentLeader ?? null}
        teams={teams}
        onNavigate={onNavigate}
      />
    </>
  );
}
