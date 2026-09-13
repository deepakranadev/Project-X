"use client";

import React from "react";
import type { ScoringConfig } from "@/domain/scoring/types";
import type { Tournament } from "@/domain/tournaments/types";
import { useScoringConfiguration } from "@/features/scoring/useScoringConfiguration";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import type { GuestTournament } from "@/features/tournaments/types";

import { ScoringHeaderSection } from "./ScoringHeaderSection";
import { ScoringModeSelector } from "./ScoringModeSelector";
import { PlacementPointsEditor } from "./PlacementPointsEditor";
import { FinishPointsSection } from "./FinishPointsSection";
import { ScoringSaveCard } from "./ScoringSaveCard";
import { TiebreakerEditor } from "./TiebreakerEditor";

interface ScoringConfigurationProps {
  readonly tournament: Tournament;
  readonly initialConfig: ScoringConfig;
  readonly tournamentId: string;
  readonly repository: GuestTournamentRepository;
  readonly onSaved: (tournament: GuestTournament) => void;
}

export function ScoringConfiguration({
  tournament,
  initialConfig,
  tournamentId,
  repository,
  onSaved,
}: ScoringConfigurationProps) {
  const controller = useScoringConfiguration(
    initialConfig,
    tournamentId,
    repository,
    onSaved,
  );
  const {
    applyChange,
    draft,
    finishError,
    formik,
    generalIssues,
    isDirty,
    isSaving,
    placementErrors,
    saveError,
    saved,
    selectCustom,
    selectStandardPreset,
    tiebreakError,
  } = controller;

  const isStandard = draft.preset === "BGMI_STANDARD";

  return (
    <section className="w-full space-y-4 md:space-y-6" id="scoring">
      <form onSubmit={formik.handleSubmit} noValidate className="space-y-4 md:space-y-6 w-full">
        {/* Header with Breadcrumbs and Status */}
        <ScoringHeaderSection tournament={tournament} isDirty={isDirty} />

        {/* Main 12-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start w-full">
          {/* Primary Left Column: Mode Selector, Placement Points Table */}
          <div className="md:col-span-7 min-w-0 w-full space-y-4 md:space-y-6">
            <ScoringModeSelector
              preset={draft.preset}
              onSelectStandard={selectStandardPreset}
              onSelectCustom={selectCustom}
            />

            <PlacementPointsEditor
              rows={draft.placementPoints}
              errors={placementErrors}
              isStandard={isStandard}
              onChange={(placement, points) =>
                applyChange({
                  placementPoints: draft.placementPoints.map((row) =>
                    row.placement === placement ? { ...row, points } : row,
                  ),
                })
              }
            />
          </div>

          {/* Supporting Right Column: Finish Points, Save Card, Scope Info, Advanced Rules */}
          <div className="md:col-span-5 min-w-0 w-full space-y-4 md:space-y-6">
            <FinishPointsSection
              pointsPerFinish={draft.pointsPerFinish}
              isStandard={isStandard}
              finishError={finishError}
              onChange={(pointsPerFinish) => applyChange({ pointsPerFinish })}
            />

            <ScoringSaveCard
              isSaving={isSaving}
              isDirty={isDirty}
              saved={saved}
              saveError={saveError}
              generalIssues={generalIssues}
            />

            {/* Custom Mode Hint */}
            <div
              className="flex items-center gap-2 px-1 py-1 text-xs text-slate-500"
              data-purpose="mode-hint"
            >
              <svg
                className="w-4 h-4 text-[#ea580c] shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>
                Switch preset to{" "}
                <strong className="font-semibold text-slate-700">Custom</strong>{" "}
                to modify numeric values and decimal points.
              </span>
            </div>

            {/* Advanced Ranking Rules (Right Column below custom mode hint) */}
            <TiebreakerEditor
              criteria={draft.tiebreakers}
              error={tiebreakError}
              onChange={(tiebreakers) => applyChange({ tiebreakers })}
            />
          </div>
        </div>
      </form>
    </section>
  );
}
