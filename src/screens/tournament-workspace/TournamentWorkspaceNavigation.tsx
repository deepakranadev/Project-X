import React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useWorkspaceCounts } from "./WorkspaceCountContext";

export type WorkspaceSection = "overview" | "teams" | "scoring" | "matches" | "standings";

export interface NavigationProps {
  readonly tournamentId: string;
}

function useActiveSection(): WorkspaceSection {
  const segment = useSelectedLayoutSegment();
  switch (segment) {
    case "teams":
    case "scoring":
    case "matches":
    case "standings":
      return segment;
    case "overview":
    default:
      return "overview";
  }
}

export function DesktopSidebar({ tournamentId }: NavigationProps) {
  const activeSection = useActiveSection();
  const { counts } = useWorkspaceCounts();

  const getLinkClass = (section: WorkspaceSection) => {
    const isActive = activeSection === section;
    return `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand-50 text-brand-primary group"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 group"
    }`;
  };

  const getIconClass = (section: WorkspaceSection) => {
    return activeSection === section
      ? "text-brand-primary"
      : "text-slate-400 group-hover:text-slate-600";
  };

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-slate-200 bg-white h-full flex-shrink-0" data-purpose="main-sidebar">
      <div>
        {/* Workspace / Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {/* OpenLoby Orange Emblem Icon */}
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-sm shadow-orange-500/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">OpenLoby</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-3 py-5">
          <div className="px-3 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tournament</span>
          </div>
          <nav className="space-y-1" data-purpose="tournament-navigation" aria-label="Tournament navigation desktop">
            {/* Overview */}
            <Link className={getLinkClass("overview")} href={`/tournaments/${tournamentId}/overview`}>
              <div className="flex items-center space-x-3">
                <svg className={`w-4 h-4 ${getIconClass("overview")}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="7" rx="1.5" width="7" x="3" y="3"></rect>
                  <rect height="7" rx="1.5" width="7" x="14" y="3"></rect>
                  <rect height="7" rx="1.5" width="7" x="14" y="14"></rect>
                  <rect height="7" rx="1.5" width="7" x="3" y="14"></rect>
                </svg>
                <span>Overview</span>
              </div>
              {activeSection === "overview" && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>}
            </Link>

            {/* Teams */}
            <Link className={getLinkClass("teams")} href={`/tournaments/${tournamentId}/teams`}>
              <div className="flex items-center space-x-3">
                <svg className={`w-4 h-4 ${getIconClass("teams")}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Teams</span>
              </div>
              {counts.teams !== null && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-tabular">{counts.teams}</span>
              )}
            </Link>

            {/* Scoring Rules */}
            <Link className={getLinkClass("scoring")} href={`/tournaments/${tournamentId}/scoring`}>
              <div className="flex items-center space-x-3">
                <svg className={`w-4 h-4 ${getIconClass("scoring")}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Scoring</span>
              </div>
              {activeSection === "scoring" && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>}
            </Link>

            {/* Matches */}
            <Link className={getLinkClass("matches")} href={`/tournaments/${tournamentId}/matches`}>
              <div className="flex items-center space-x-3">
                <svg className={`w-4 h-4 ${getIconClass("matches")}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="14" rx="2" ry="2" width="20" x="2" y="7"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span>Matches</span>
              </div>
              {counts.matches !== null ? (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-tabular">{counts.matches}</span>
              ) : activeSection === "matches" ? (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              ) : null}
            </Link>

            {/* Standings */}
            <Link className={getLinkClass("standings")} href={`/tournaments/${tournamentId}/standings`}>
              <div className="flex items-center space-x-3">
                <svg className={`w-4 h-4 ${getIconClass("standings")}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" x2="18" y1="20" y2="10"></line>
                  <line x1="12" x2="12" y1="20" y2="4"></line>
                  <line x1="6" x2="6" y1="20" y2="14"></line>
                </svg>
                <span>Standings</span>
              </div>
              {activeSection === "standings" && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>}
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav({ tournamentId }: NavigationProps) {
  const activeSection = useActiveSection();

  const getLinkClass = (section: WorkspaceSection) => {
    const isActive = activeSection === section;
    return `flex flex-col items-center gap-0.5 py-1 px-3 ${
      isActive ? "text-[#e05305]" : "text-slate-400 hover:text-slate-600"
    }`;
  };

  const getSvgClass = (section: WorkspaceSection) => {
    const isActive = activeSection === section;
    return `w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.8]"}`;
  };

  const getLabelClass = (section: WorkspaceSection) => {
    const isActive = activeSection === section;
    return `text-[10px] ${isActive ? "font-bold" : "font-medium"}`;
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pt-1.5 pb-3 z-30 flex justify-around items-center pb-safe" data-purpose="bottom-navigation" aria-label="Tournament navigation mobile">
      {/* Overview */}
      <Link className={getLinkClass("overview")} style={{ color: activeSection === "overview" ? "#e05305" : undefined }} href={`/tournaments/${tournamentId}/overview`}>
        <svg className={getSvgClass("overview")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span className={getLabelClass("overview")}>Overview</span>
      </Link>

      {/* Teams */}
      <Link className={getLinkClass("teams")} style={{ color: activeSection === "teams" ? "#e05305" : undefined }} href={`/tournaments/${tournamentId}/teams`}>
        <svg className={getSvgClass("teams")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span className={getLabelClass("teams")}>Teams</span>
      </Link>

      {/* Scoring */}
      <Link className={getLinkClass("scoring")} style={{ color: activeSection === "scoring" ? "#e05305" : undefined }} href={`/tournaments/${tournamentId}/scoring`}>
        <svg className={getSvgClass("scoring")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.6 6.6 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span className={getLabelClass("scoring")}>Scoring</span>
      </Link>

      {/* Matches */}
      <Link className={getLinkClass("matches")} style={{ color: activeSection === "matches" ? "#e05305" : undefined }} href={`/tournaments/${tournamentId}/matches`}>
        <svg className={getSvgClass("matches")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.496m5.007 0a7.454 7.454 0 01-.982-3.172M9.496 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span className={getLabelClass("matches")}>Matches</span>
      </Link>

      {/* Standings */}
      <Link className={getLinkClass("standings")} style={{ color: activeSection === "standings" ? "#e05305" : undefined }} href={`/tournaments/${tournamentId}/standings`}>
        <svg className={getSvgClass("standings")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span className={getLabelClass("standings")}>Standings</span>
      </Link>
    </nav>
  );
}
