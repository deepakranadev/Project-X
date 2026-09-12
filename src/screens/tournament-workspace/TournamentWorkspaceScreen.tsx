"use client";

/* Local IndexedDB Blob URLs cannot use Next.js image optimization. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { MatchManagement } from "@/features/matches/components/MatchManagement";
import { ScoringConfiguration } from "@/features/scoring/components/ScoringConfiguration";
import { OverallStandings } from "@/features/standings/components/OverallStandings";
import { TeamManagement } from "@/features/teams/components/TeamManagement";
import { useClientWorkspaceRepositories } from "../clientRepositoryComposition";
import { useTournamentWorkspace } from "./useTournamentWorkspace";
import { DesktopSidebar, MobileBottomNav } from "./TournamentWorkspaceNavigation";

interface TournamentWorkspaceScreenProps {
  readonly tournamentId: string;
}

function StoredLogo({
  src,
  alt,
  className,
}: {
  readonly src: string;
  readonly alt: string;
  readonly className: string;
}) {
  return <img className={className} src={src} alt={alt} />;
}

export function TournamentWorkspaceScreen({
  tournamentId,
}: TournamentWorkspaceScreenProps) {
  const repositories = useClientWorkspaceRepositories();
  const workspace = useTournamentWorkspace(
    tournamentId,
    repositories?.tournament ?? null,
    repositories?.teams ?? null,
  );
  const { state } = workspace;

  if (!repositories || state.status === "loading") {
    return (
      <div className="site-shell grid place-items-center px-5">
        <p className="text-sm text-slate-400" role="status">
          Opening tournament…
        </p>
      </div>
    );
  }

  if (
    state.status === "missing" ||
    state.status === "invalid-scoring" ||
    state.status === "error"
  ) {
    const invalidScoring = state.status === "invalid-scoring";
    return (
      <div className="site-shell grid place-items-center px-5">
        <main className="panel w-full max-w-md p-6 text-center sm:p-8">
          <p className="eyebrow">
            {state.status === "missing"
              ? "Not found"
              : invalidScoring
                ? "Scoring configuration blocked"
                : "Storage unavailable"}
          </p>
          <h1 className="mt-3 text-2xl font-black text-white">
            {state.status === "missing"
              ? "Tournament not found"
              : invalidScoring
                ? "Scoring values need attention"
                : "Could not open tournament"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {state.status === "missing"
              ? "This guest tournament may belong to another browser or device."
              : invalidScoring
                ? state.message
                : "Check this browser’s storage permissions, then try again."}
          </p>
          <Link className="primary-action mt-6" href="/tournaments/new">
            Create a tournament
          </Link>
        </main>
      </div>
    );
  }

  const { tournament } = state;

  return (
    <div className="site-shell bg-background text-foreground flex flex-col md:flex-row">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <header className="md:hidden flex items-center justify-between gap-4 px-4 py-4 border-b border-border bg-surface sticky top-0 z-30">
          <Link className="brand-mark text-foreground" href="/" aria-label="PT Forge home">
            <span>PT</span> FORGE
          </Link>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
            <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
            Saved on this device
          </span>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <section className="panel scroll-mt-24 md:scroll-mt-10 overflow-hidden" id="tournament">
            <div className="h-1 bg-accent" />
            <div className="p-5 sm:p-8">
              <div className="flex items-start gap-4 sm:gap-6">
                {state.tournamentLogoUrl ? (
                  <StoredLogo
                    src={state.tournamentLogoUrl}
                    alt={`${tournament.name} logo`}
                    className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover sm:h-20 sm:w-20"
                  />
                ) : (
                  <div
                    className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-border bg-surface-raised text-xl font-black text-accent sm:h-20 sm:w-20"
                    aria-hidden="true"
                  >
                    {tournament.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="eyebrow">Tournament workspace</p>
                  <h1 className="mt-2 break-words text-3xl font-black tracking-[-0.04em] text-foreground sm:text-5xl">
                    {tournament.name}
                  </h1>
                  <span className="mt-4 inline-flex rounded-md border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-extrabold tracking-wide text-accent-strong">
                    {tournament.game}
                  </span>
                </div>
              </div>

              {tournament.organizerName || tournament.organizerLogo ? (
                <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
                  {state.organizerLogoUrl ? (
                    <StoredLogo
                      src={state.organizerLogoUrl}
                      alt="Organizer logo"
                      className="h-10 w-10 rounded-lg border border-border object-cover"
                    />
                  ) : null}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Organizer
                    </p>
                    {tournament.organizerName ? (
                      <p className="mt-1 font-bold text-foreground">
                        {tournament.organizerName}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="mt-8 scroll-mt-24 md:scroll-mt-10 sm:mt-12" id="teams">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-muted" aria-hidden="true">
                02
              </span>
              <p className="eyebrow">Team setup</p>
            </div>
            <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
              Build the roster
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Add the full lineup in one paste. You can edit names, slots, and
              logos at any time.
            </p>
          </section>

          <TeamManagement
            tournamentId={tournamentId}
            teams={state.teams}
            repository={repositories.teams}
            onTeamsChanged={workspace.publishTeams}
          />

          <ScoringConfiguration
            initialConfig={tournament.scoringConfig}
            tournamentId={tournamentId}
            repository={repositories.tournament}
            onSaved={workspace.publishTournament}
          />

          <MatchManagement
            tournamentId={tournamentId}
            teams={state.teams}
            repositories={repositories.matchFeature}
            onMatchesChanged={workspace.publishMatchesChanged}
          />

          <OverallStandings
            tournament={tournament}
            teams={state.teams}
            repositories={repositories.standings}
            refreshVersion={workspace.standingsRefreshVersion}
          />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
