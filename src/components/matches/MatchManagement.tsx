"use client";

import { useCallback, useEffect, useState } from "react";

import { createEmptyManualResults } from "@/domain/matches/createEmptyManualResults";
import type { TournamentMatch } from "@/domain/matches/types";
import type { Team } from "@/domain/teams/types";
import { getClientMatchRepository } from "@/lib/persistence/clientMatchRepository";
import { getClientMatchResultRepository } from "@/lib/persistence/clientMatchResultRepository";
import { getClientTeamRepository } from "@/lib/persistence/clientTeamRepository";
import { createGuestMatch } from "@/lib/persistence/createGuestMatch";

import { MatchEntry } from "./MatchEntry";

interface MatchManagementProps {
  readonly tournamentId: string;
  readonly onMatchesChanged: () => void;
}

export function MatchManagement({
  tournamentId,
  onMatchesChanged,
}: MatchManagementProps) {
  const [matches, setMatches] = useState<readonly TournamentMatch[]>([]);
  const [teams, setTeams] = useState<readonly Team[]>([]);
  const [activeMatch, setActiveMatch] = useState<TournamentMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [savedMatches, roster] = await Promise.all([
      getClientMatchRepository().listMatchesByTournament(tournamentId),
      getClientTeamRepository().listTeamsByTournament(tournamentId),
    ]);
    setMatches(savedMatches);
    setTeams(roster);
    return { matches: savedMatches, teams: roster };
  }, [tournamentId]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [savedMatches, roster] = await Promise.all([
          getClientMatchRepository().listMatchesByTournament(tournamentId),
          getClientTeamRepository().listTeamsByTournament(tournamentId),
        ]);
        if (active) {
          setMatches(savedMatches);
          setTeams(roster);
        }
      } catch {
        if (active) {
          setError("Matches could not be opened. Check browser storage permissions and refresh.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [tournamentId]);

  async function createMatch() {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);
    setNotice(null);
    try {
      const current = await reload();
      if (current.teams.length === 0) {
        setError("Add at least one team before creating a match.");
        return;
      }
      const created = await createGuestMatch({
        tournamentId,
        repository: getClientMatchRepository(),
      });
      const initialResults = createEmptyManualResults({
        tournamentId,
        matchId: created.id,
        teams: current.teams,
      });
      await getClientMatchResultRepository().bulkSaveResults(
        tournamentId,
        created.id,
        initialResults,
      );
      setMatches([...current.matches, created]);
      setTeams(current.teams);
      setActiveMatch(created);
      setNotice(`Match ${created.matchNumber} created. Draft saved on this device.`);
      onMatchesChanged();
      window.setTimeout(() => {
        document.getElementById("match-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "The match could not be created. Try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function openMatch(match: TournamentMatch) {
    try {
      const current = await reload();
      const latest = current.matches.find((candidate) => candidate.id === match.id);
      if (!latest) throw new Error("This match is no longer saved on this device.");
      let openedMatch = latest;
      if (latest.status === "FINALIZED") {
        const reopened = await getClientMatchRepository().updateMatch(
          tournamentId,
          latest.id,
          { status: "DRAFT" },
        );
        if (!reopened) throw new Error("This match is no longer saved on this device.");
        openedMatch = reopened;
        setMatches((saved) =>
          saved.map((candidate) =>
            candidate.id === reopened.id ? reopened : candidate,
          ),
        );
        setNotice(
          `Match ${reopened.matchNumber} reopened as a draft. Finalize it again after reviewing changes.`,
        );
        onMatchesChanged();
      }
      setActiveMatch(openedMatch);
      setError(null);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "The match could not be opened.");
    }
  }

  async function deleteMatch(match: TournamentMatch) {
    const confirmed = window.confirm(
      `Delete Match ${match.matchNumber}? Its saved result draft will also be removed.`,
    );
    if (!confirmed) return;
    try {
      await getClientMatchRepository().deleteMatch(tournamentId, match.id);
      setMatches((current) => current.filter((candidate) => candidate.id !== match.id));
      if (activeMatch?.id === match.id) setActiveMatch(null);
      setNotice(`Match ${match.matchNumber} and its results were deleted.`);
      setError(null);
      onMatchesChanged();
    } catch {
      setError("The match could not be deleted. Try again.");
    }
  }

  function handleMatchChange(updated: TournamentMatch) {
    setMatches((current) =>
      current.map((match) => match.id === updated.id ? updated : match),
    );
    setActiveMatch((current) =>
      current?.id === updated.id ? updated : current,
    );
    onMatchesChanged();
  }

  return (
    <section className="mt-10 scroll-mt-4 sm:mt-14" id="matches">
      <p className="eyebrow">04 · Matches</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">Enter match results</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Create a match and enter every team’s placement and finishes in one pass.
          </p>
        </div>
        <button
          className="primary-action disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={isCreating || isLoading}
          onClick={() => void createMatch()}
        >
          {isCreating ? "Creating…" : "Create Match"}
        </button>
      </div>

      {notice ? <p className="mt-4 rounded-lg border border-lime-300/20 bg-lime-300/5 px-4 py-3 text-sm font-semibold text-lime-200" role="status">{notice}</p> : null}
      {error ? <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300" role="alert">{error}</p> : null}

      <div className="panel mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-4 sm:px-6">
          <h3 className="text-xs font-black tracking-[0.18em] text-slate-300">MATCHES</h3>
          <span className="text-sm font-black text-lime-300">{matches.length}</span>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-slate-400" role="status">Loading matches…</p>
        ) : matches.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-bold text-white">No matches yet.</p>
            <p className="mt-2 text-sm text-slate-400">Create Match 1 when the roster is ready.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/6">
            {matches.map((match) => (
              <li className="flex items-center gap-3 px-4 py-3 sm:px-6" key={match.id}>
                <button
                  className="min-h-11 min-w-0 flex-1 text-left"
                  type="button"
                  aria-label={`Open Match ${match.matchNumber}`}
                  onClick={() => void openMatch(match)}
                >
                  <span className="block truncate text-sm font-black text-white">
                    {match.name || `Match ${match.matchNumber}`}
                  </span>
                  {match.name ? <span className="mt-0.5 block text-xs text-slate-500">Match {match.matchNumber}</span> : null}
                </button>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${match.status === "FINALIZED" ? "bg-lime-300/10 text-lime-200" : "bg-amber-300/10 text-amber-200"}`}>
                  {match.status === "FINALIZED" ? "Finalized" : "Draft"}
                </span>
                <button
                  className="min-h-11 rounded-lg px-2 text-xs font-bold text-red-300 hover:bg-red-400/10"
                  type="button"
                  aria-label={`Delete Match ${match.matchNumber}`}
                  onClick={() => void deleteMatch(match)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {activeMatch ? (
        <div className="scroll-mt-4" id="match-editor">
          <MatchEntry
            key={activeMatch.id}
            match={activeMatch}
            teams={teams}
            onClose={() => setActiveMatch(null)}
            onMatchChange={handleMatchChange}
          />
        </div>
      ) : null}
    </section>
  );
}
