import type { Metadata } from "next";
import Link from "next/link";

import { TournamentCreationForm } from "@/components/tournament/TournamentCreationForm";

export const metadata: Metadata = {
  title: "Create tournament",
};

export default function NewTournamentPage() {
  return (
    <div className="site-shell">
      <header className="mx-auto flex w-full max-w-3xl items-center px-5 py-5 sm:px-8">
        <Link className="secondary-action" href="/">
          <span aria-hidden="true">←</span>
          Back
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-12 sm:px-8">
        <div className="mb-7">
          <p className="eyebrow">New points table</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">
            Create your tournament
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
            One quick setup. No account needed.
          </p>
        </div>

        <TournamentCreationForm />
      </main>
    </div>
  );
}
