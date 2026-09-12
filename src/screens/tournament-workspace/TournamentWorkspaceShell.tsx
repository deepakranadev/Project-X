"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { DesktopSidebar, MobileBottomNav, type WorkspaceSection } from "./TournamentWorkspaceNavigation";
import { WorkspaceRepositoryProvider, useWorkspaceRepositories } from "./WorkspaceRepositoryProvider";

function ShellContent({ tournamentId, children }: { readonly tournamentId: string; readonly children: ReactNode }) {
  const repositories = useWorkspaceRepositories();
  const [tournamentName, setTournamentName] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    repositories.tournament.getTournament(tournamentId).then(t => {
      if (!active) return;
      if (t) setTournamentName(t.name);
      else setError(true);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, [repositories.tournament, tournamentId]);

  // For ROUTE-R0, we use a fake active section until R4 cutover.
  const activeSection: WorkspaceSection = "tournament";

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-5 bg-background">
        <main className="panel w-full max-w-md p-6 text-center sm:p-8">
          <p className="eyebrow">Not found</p>
          <h1 className="mt-3 text-2xl font-black text-white">Tournament not found</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            This guest tournament may belong to another browser or device, or storage is unavailable.
          </p>
          <Link className="primary-action mt-6" href="/tournaments/new">
            Create a tournament
          </Link>
        </main>
      </div>
    );
  }

  if (!tournamentName) {
    return (
      <div className="min-h-screen grid place-items-center px-5 bg-background">
        <p className="text-sm text-slate-400" role="status">
          Opening tournament…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background text-foreground flex flex-col md:flex-row">
      <DesktopSidebar
        activeSection={activeSection}
        onNavigate={() => {}} // No-op during R0
      />

      <div className="flex-1 flex flex-col min-w-0 pb-[4.5rem] md:pb-0 h-screen overflow-y-auto">
        <header className="md:hidden flex items-center justify-between gap-4 px-4 pt-4 pb-3 border-b border-slate-200/60 bg-[#F8F9FB] sticky top-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" aria-label="Go back" className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200/60 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-[15px] font-bold text-slate-900 tracking-tight truncate">
                {tournamentName}
              </h1>
            </div>
          </div>
        </header>

        {children}
      </div>

      <MobileBottomNav activeSection={activeSection} onNavigate={() => {}} />
    </div>
  );
}

export function TournamentWorkspaceShell({
  tournamentId,
  children,
}: {
  readonly tournamentId: string;
  readonly children: ReactNode;
}) {
  return (
    <WorkspaceRepositoryProvider>
      <ShellContent tournamentId={tournamentId}>
        {children}
      </ShellContent>
    </WorkspaceRepositoryProvider>
  );
}
