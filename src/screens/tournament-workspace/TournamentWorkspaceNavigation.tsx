import Link from "next/link";

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface px-5 py-6 sticky top-0 h-screen overflow-y-auto">
      <Link className="brand-mark text-foreground" href="/" aria-label="PT Forge home">
        <span>PT</span> FORGE
      </Link>
      <div className="mt-10">
        <p className="text-[0.65rem] font-black tracking-[0.18em] text-muted mb-4 uppercase">Tournament</p>
        <nav className="flex flex-col gap-1.5" aria-label="Tournament navigation desktop">
            <a className="rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#tournament">Overview</a>
            <a className="rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#teams">Teams</a>
            <a className="rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#scoring">Scoring</a>
            <a className="rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#matches">Matches</a>
            <a className="rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#standings">Standings</a>
        </nav>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface px-2 flex items-center justify-between z-40 pb-safe" aria-label="Tournament navigation mobile">
      <a className="flex-1 flex flex-col items-center py-3 text-[0.65rem] font-black text-muted hover:text-foreground uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#tournament">
          Overview
      </a>
      <a className="flex-1 flex flex-col items-center py-3 text-[0.65rem] font-black text-muted hover:text-foreground uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#teams">
          Teams
      </a>
      <a className="flex-1 flex flex-col items-center py-3 text-[0.65rem] font-black text-muted hover:text-foreground uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#scoring">
          Scoring
      </a>
      <a className="flex-1 flex flex-col items-center py-3 text-[0.65rem] font-black text-muted hover:text-foreground uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#matches">
          Matches
      </a>
      <a className="flex-1 flex flex-col items-center py-3 text-[0.65rem] font-black text-muted hover:text-foreground uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" href="#standings">
          Standings
      </a>
    </nav>
  );
}
