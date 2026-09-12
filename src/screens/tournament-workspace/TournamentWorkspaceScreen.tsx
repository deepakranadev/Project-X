"use client";

import React from "react";
import Link from "next/link";

import { MatchManagement } from "@/features/matches/components/MatchManagement";
import { ScoringConfiguration } from "@/features/scoring/components/ScoringConfiguration";
import { OverallStandings } from "@/features/standings/components/OverallStandings";
import { TeamManagement } from "@/features/teams/components/TeamManagement";
import { OverviewSection } from "@/features/tournaments/components/OverviewSection";
import { useClientWorkspaceRepositories } from "../clientRepositoryComposition";
import { useTournamentWorkspace } from "./useTournamentWorkspace";
import { DesktopSidebar, MobileBottomNav, type WorkspaceSection } from "./TournamentWorkspaceNavigation";

export interface TournamentWorkspaceScreenProps {
  readonly tournamentId: string;
}

function useWorkspaceNavigation(): {
  activeSection: WorkspaceSection;
  setActiveSection: (section: WorkspaceSection) => void;
} {
  const [activeSection, setActiveSectionState] = React.useState<WorkspaceSection>("tournament");

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const validSections: WorkspaceSection[] = ["tournament", "teams", "scoring", "matches", "standings"];
      if (validSections.includes(hash as WorkspaceSection)) {
        setActiveSectionState(hash as WorkspaceSection);
      } else {
        setActiveSectionState("tournament");
      }
    };

    // Check initial hash safely on client
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const setActiveSection = React.useCallback((section: WorkspaceSection) => {
    window.history.pushState(null, "", `#${section}`);
    setActiveSectionState(section);
  }, []);

  return { activeSection, setActiveSection };
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

  const { activeSection, setActiveSection } = useWorkspaceNavigation();

  if (!repositories || state.status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center px-5 bg-background">
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
      <div className="min-h-screen grid place-items-center px-5 bg-background">
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
    <div className="min-h-[100svh] bg-background text-foreground flex flex-col md:flex-row">
      <DesktopSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        counts={{ teams: state.teams.length }}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-[4.5rem] md:pb-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between gap-4 px-4 pt-4 pb-3 border-b border-slate-200/60 bg-[#F8F9FB] sticky top-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" aria-label="Go back" className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200/60 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-[15px] font-bold text-slate-900 tracking-tight truncate">
                {tournament.name}
              </h1>
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200/60 transition-colors shrink-0" aria-label="More options">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /><circle cx="5" cy="12" r="1.5" /></svg>
          </button>
        </header>



        <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 md:py-8 flex flex-col gap-4 md:gap-6">
          {/* Desktop Header */}
          <section className="hidden md:block space-y-3" data-purpose="tournament-header">
            <nav className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <Link href="/" className="hover:text-slate-600 transition-colors">Tournaments</Link>
              <span className="">/</span>
              <span className="text-slate-600 truncate max-w-[300px]">{tournament.name}</span>
            </nav>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <h1 className="text-2xl lg:text-[28px] font-bold text-slate-900 tracking-tight">
                  {tournament.name}
                </h1>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#e6f9f0] text-[#059669]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mr-1.5" />
                  Active
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm" aria-label="More tournament actions">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                </button>
              </div>
            </div>
          </section>

          <div className={activeSection !== "tournament" ? "hidden" : ""}>
            <OverviewSection
              tournament={tournament}
              teams={state.teams}
              repositories={repositories.standings}
              refreshVersion={workspace.standingsRefreshVersion}
              tournamentLogoUrl={state.tournamentLogoUrl}
              organizerLogoUrl={state.organizerLogoUrl}
              onNavigate={(section: string) => setActiveSection(section as WorkspaceSection)}
            />
          </div>

          <div className={activeSection !== "teams" ? "hidden" : ""}>
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
          </div>

          <div className={activeSection !== "scoring" ? "hidden" : ""}>
            <ScoringConfiguration
              initialConfig={tournament.scoringConfig}
              tournamentId={tournamentId}
              repository={repositories.tournament}
              onSaved={workspace.publishTournament}
            />
          </div>

          <div className={activeSection !== "matches" ? "hidden" : ""}>
            <MatchManagement
              tournamentId={tournamentId}
              teams={state.teams}
              repositories={repositories.matchFeature}
              onMatchesChanged={workspace.publishMatchesChanged}
            />
          </div>

          <div className={activeSection !== "standings" ? "hidden" : ""}>
            <OverallStandings
              tournament={tournament}
              teams={state.teams}
              repositories={repositories.standings}
              refreshVersion={workspace.standingsRefreshVersion}
            />
          </div>
        </main>
      </div>

      <MobileBottomNav activeSection={activeSection} onNavigate={setActiveSection} />
    </div>
  );
}
