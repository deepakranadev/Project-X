"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { TournamentCreationForm } from "@/features/tournaments/components/TournamentCreationForm";

import { useClientTournamentRepository } from "../clientRepositoryComposition";

export function CreateTournamentScreen() {
  const router = useRouter();
  const repository = useClientTournamentRepository();

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

        {repository ? (
          <TournamentCreationForm
            repository={repository}
            onCreated={(tournament) =>
              router.push(`/tournaments/${encodeURIComponent(tournament.id)}`)
            }
          />
        ) : (
          <p className="panel p-5 text-sm text-slate-400" role="status">
            Opening tournament setup…
          </p>
        )}
      </main>
    </div>
  );
}
