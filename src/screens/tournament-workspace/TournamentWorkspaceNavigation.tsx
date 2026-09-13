import React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

export type WorkspaceSection = "overview" | "teams" | "scoring" | "matches" | "standings";

interface NavigationProps {
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

  const getLinkClass = (section: WorkspaceSection) =>
    `rounded-lg px-3 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
      activeSection === section
        ? "bg-surface-raised text-foreground"
        : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
    }`;

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface px-5 py-6 sticky top-0 h-screen overflow-y-auto">
      <Link className="brand-mark text-foreground" href="/" aria-label="PT Forge home">
        <span>PT</span> FORGE
      </Link>
      <div className="mt-10">
        <p className="text-[0.65rem] font-black tracking-[0.18em] text-muted mb-4 uppercase">Tournament</p>
        <nav className="flex flex-col gap-1.5" aria-label="Tournament navigation desktop">
            <Link className={getLinkClass("overview")} href={`/tournaments/${tournamentId}/overview`}>Overview</Link>
            <Link className={getLinkClass("teams")} href={`/tournaments/${tournamentId}/teams`}>Teams</Link>
            <Link className={getLinkClass("scoring")} href={`/tournaments/${tournamentId}/scoring`}>Scoring</Link>
            <Link className={getLinkClass("matches")} href={`/tournaments/${tournamentId}/matches`}>Matches</Link>
            <Link className={getLinkClass("standings")} href={`/tournaments/${tournamentId}/standings`}>Standings</Link>
        </nav>
      </div>
    </aside>
  );
}

export function MobileBottomNav({ tournamentId }: NavigationProps) {
  const activeSection = useActiveSection();

  const getLinkClass = (section: WorkspaceSection) =>
    `flex-1 flex flex-col items-center py-3 text-[0.65rem] font-black uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
      activeSection === section ? "text-foreground" : "text-muted hover:text-foreground"
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface px-2 flex items-center justify-between z-40 pb-safe" aria-label="Tournament navigation mobile">
      <Link className={getLinkClass("overview")} href={`/tournaments/${tournamentId}/overview`}>
          Overview
      </Link>
      <Link className={getLinkClass("teams")} href={`/tournaments/${tournamentId}/teams`}>
          Teams
      </Link>
      <Link className={getLinkClass("scoring")} href={`/tournaments/${tournamentId}/scoring`}>
          Scoring
      </Link>
      <Link className={getLinkClass("matches")} href={`/tournaments/${tournamentId}/matches`}>
          Matches
      </Link>
      <Link className={getLinkClass("standings")} href={`/tournaments/${tournamentId}/standings`}>
          Standings
      </Link>
    </nav>
  );
}
