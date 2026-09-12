import React from "react";
import Link from "next/link";

export type WorkspaceSection = "tournament" | "teams" | "scoring" | "matches" | "standings";

interface NavigationProps {
  readonly activeSection: WorkspaceSection;
  readonly onNavigate: (section: WorkspaceSection) => void;
  readonly counts?: { teams: number };
}

export function DesktopSidebar({ activeSection, onNavigate }: NavigationProps) {
  const getLinkClass = (section: WorkspaceSection) =>
    `rounded-lg px-3 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
      activeSection === section
        ? "bg-surface-raised text-foreground"
        : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
    }`;

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, section: WorkspaceSection) => {
    e.preventDefault();
    onNavigate(section);
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface px-5 py-6 sticky top-0 h-screen overflow-y-auto">
      <Link className="brand-mark text-foreground" href="/" aria-label="PT Forge home">
        <span>PT</span> FORGE
      </Link>
      <div className="mt-10">
        <p className="text-[0.65rem] font-black tracking-[0.18em] text-muted mb-4 uppercase">Tournament</p>
        <nav className="flex flex-col gap-1.5" aria-label="Tournament navigation desktop">
            <a className={getLinkClass("tournament")} href="#tournament" onClick={(e) => handleNav(e, "tournament")}>Overview</a>
            <a className={getLinkClass("teams")} href="#teams" onClick={(e) => handleNav(e, "teams")}>Teams</a>
            <a className={getLinkClass("scoring")} href="#scoring" onClick={(e) => handleNav(e, "scoring")}>Scoring</a>
            <a className={getLinkClass("matches")} href="#matches" onClick={(e) => handleNav(e, "matches")}>Matches</a>
            <a className={getLinkClass("standings")} href="#standings" onClick={(e) => handleNav(e, "standings")}>Standings</a>
        </nav>
      </div>
    </aside>
  );
}

export function MobileBottomNav({ activeSection, onNavigate }: NavigationProps) {
  const getLinkClass = (section: WorkspaceSection) =>
    `flex-1 flex flex-col items-center py-3 text-[0.65rem] font-black uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
      activeSection === section ? "text-foreground" : "text-muted hover:text-foreground"
    }`;

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, section: WorkspaceSection) => {
    e.preventDefault();
    onNavigate(section);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface px-2 flex items-center justify-between z-40 pb-safe" aria-label="Tournament navigation mobile">
      <a className={getLinkClass("tournament")} href="#tournament" onClick={(e) => handleNav(e, "tournament")}>
          Overview
      </a>
      <a className={getLinkClass("teams")} href="#teams" onClick={(e) => handleNav(e, "teams")}>
          Teams
      </a>
      <a className={getLinkClass("scoring")} href="#scoring" onClick={(e) => handleNav(e, "scoring")}>
          Scoring
      </a>
      <a className={getLinkClass("matches")} href="#matches" onClick={(e) => handleNav(e, "matches")}>
          Matches
      </a>
      <a className={getLinkClass("standings")} href="#standings" onClick={(e) => handleNav(e, "standings")}>
          Standings
      </a>
    </nav>
  );
}
