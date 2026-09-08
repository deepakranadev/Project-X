"use client";

import { useCallback, useEffect, useState } from "react";

import { InvalidScoringConfigError } from "@/domain/scoring/validateScoringConfig";
import type { GuestTeamRepository } from "@/features/teams/teamRepository";
import type { GuestTeam } from "@/features/teams/types";
import type { GuestTournamentRepository } from "@/features/tournaments/tournamentRepository";
import type { GuestTournament } from "@/features/tournaments/types";

export type WorkspaceState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly tournament: GuestTournament;
      readonly teams: readonly GuestTeam[];
      readonly tournamentLogoUrl: string | null;
      readonly organizerLogoUrl: string | null;
    }
  | { readonly status: "missing" }
  | { readonly status: "invalid-scoring"; readonly message: string }
  | { readonly status: "error" };

export function useTournamentWorkspace(
  tournamentId: string,
  tournamentRepository: GuestTournamentRepository | null,
  teamRepository: GuestTeamRepository | null,
) {
  const [state, setState] = useState<WorkspaceState>({ status: "loading" });
  const [standingsRefreshVersion, setStandingsRefreshVersion] = useState(0);

  useEffect(() => {
    if (!tournamentRepository || !teamRepository) return;
    const tRepo = tournamentRepository;
    const teamsRepo = teamRepository;
    let active = true;
    let tournamentLogoUrl: string | null = null;
    let organizerLogoUrl: string | null = null;
    async function loadWorkspace() {
      try {
        const [tournament, teams] = await Promise.all([
          tRepo.getTournament(tournamentId),
          teamsRepo.listTeamsByTournament(tournamentId),
        ]);
        if (!active) return;
        if (!tournament) {
          setState({ status: "missing" });
          return;
        }
        tournamentLogoUrl = tournament.tournamentLogo
          ? URL.createObjectURL(tournament.tournamentLogo.blob)
          : null;
        organizerLogoUrl = tournament.organizerLogo
          ? URL.createObjectURL(tournament.organizerLogo.blob)
          : null;
        setState({
          status: "ready",
          tournament,
          teams,
          tournamentLogoUrl,
          organizerLogoUrl,
        });
      } catch (error) {
        if (!active) return;
        if (error instanceof InvalidScoringConfigError) {
          const precisionIsInvalid = error.issues.some((issue) => issue.code === "UNSUPPORTED_SCORE_PRECISION");
          setState({
            status: "invalid-scoring",
            message: precisionIsInvalid
              ? "This tournament has a legacy scoring value with more than 2 decimal places. Its saved data was not changed."
              : "This tournament has a legacy scoring configuration that is no longer valid. Its saved data was not changed.",
          });
          return;
        }
        setState({ status: "error" });
      }
    }
    void loadWorkspace();
    return () => {
      active = false;
      if (tournamentLogoUrl) URL.revokeObjectURL(tournamentLogoUrl);
      if (organizerLogoUrl) URL.revokeObjectURL(organizerLogoUrl);
    };
  }, [teamRepository, tournamentId, tournamentRepository]);

  const publishTournament = useCallback((tournament: GuestTournament) => {
    setState((current) => current.status === "ready" ? { ...current, tournament } : current);
  }, []);

  const publishTeams = useCallback((teams: readonly GuestTeam[]) => {
    setState((current) => current.status === "ready" ? { ...current, teams } : current);
    setStandingsRefreshVersion((version) => version + 1);
  }, []);

  const publishMatchesChanged = useCallback(() => {
    setStandingsRefreshVersion((version) => version + 1);
  }, []);

  return { publishMatchesChanged, publishTeams, publishTournament, standingsRefreshVersion, state };
}
