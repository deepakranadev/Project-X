"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { DesktopSidebar, MobileBottomNav } from "./TournamentWorkspaceNavigation";
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
    <div className="min-h-[100svh] bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased select-none">
      <DesktopSidebar tournamentId={tournamentId} />

      <div className="flex-1 flex flex-col min-w-0 pb-[4.5rem] md:pb-0 h-screen overflow-y-auto">
        <header className="md:hidden pt-4 pb-3 px-4 bg-[#F8F9FB] border-b border-slate-200/60 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Back Arrow Button to Tournaments List */}
            <Link aria-label="Back to tournaments" className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200/60 transition-colors" href="/">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </Link>
            {/* Tournament Title & Status Indicator */}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-[15px] font-bold text-slate-900 tracking-tight truncate">
                {tournamentName}
              </h1>
              <span className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>
          </div>
          {/* More Options Menu */}
          <button aria-label="Tournament settings and options" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200/60 transition-colors shrink-0" type="button">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1.5"></circle>
              <circle cx="19" cy="12" r="1.5"></circle>
              <circle cx="5" cy="12" r="1.5"></circle>
            </svg>
          </button>
        </header>

        {children}
      </div>

      <MobileBottomNav tournamentId={tournamentId} />
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
