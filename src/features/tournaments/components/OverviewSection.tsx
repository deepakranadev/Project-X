"use client";

import React from "react";
import type { Tournament } from "@/domain/tournaments/types";
import type { Team } from "@/domain/teams/types";
import { useOverviewData, type OverviewRepositories } from "../useOverviewData";
import { OverviewPresentation } from "./OverviewPresentation";

interface OverviewSectionProps {
  readonly tournament: Tournament;
  readonly teams: readonly Team[];
  readonly repositories: OverviewRepositories;
  readonly refreshVersion: number;
  readonly tournamentLogoUrl: string | null;
  readonly organizerLogoUrl: string | null;
  readonly onNavigate: (sectionId: string) => void;
}

export function OverviewSection({
  tournament,
  teams,
  repositories,
  refreshVersion,
  onNavigate,
}: OverviewSectionProps) {
  const dataState = useOverviewData(tournament, teams, repositories, refreshVersion);

  return (
    <div className="flex flex-col gap-4 md:gap-6 pb-24 md:pb-10">
      {dataState.status === "loading" && (
        <div className="p-8 text-center text-slate-400 text-sm">Loading overview...</div>
      )}

      {dataState.status === "error" && (
        <div className="p-8 text-center text-red-500 text-sm">Failed to load overview data.</div>
      )}

      {dataState.status === "ready" && (
        <OverviewPresentation state={dataState} tournament={tournament} teams={teams} onNavigate={onNavigate} />
      )}
    </div>
  );
}
