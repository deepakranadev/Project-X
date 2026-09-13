"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useWorkspaceRepositories } from "./WorkspaceRepositoryProvider";

interface WorkspaceCountState {
  readonly counts: {
    readonly teams: number | null;
    readonly matches: number | null;
  };
  readonly refreshCounts: () => Promise<void>;
  readonly setTeamsCount: (count: number) => void;
  readonly setMatchesCount: (count: number) => void;
}

const WorkspaceCountContext = createContext<WorkspaceCountState | null>(null);

export function WorkspaceCountProvider({
  tournamentId,
  children,
}: {
  readonly tournamentId: string;
  readonly children: ReactNode;
}) {
  const repositories = useWorkspaceRepositories();
  const [counts, setCounts] = useState<{
    readonly teams: number | null;
    readonly matches: number | null;
  }>({
    teams: null,
    matches: null,
  });

  const refreshCounts = useCallback(async () => {
    try {
      const [teams, matches] = await Promise.all([
        repositories.teams.listTeamsByTournament(tournamentId),
        repositories.matchFeature.matches.listMatchesByTournament(tournamentId),
      ]);
      setCounts({ teams: teams.length, matches: matches.length });
    } catch {
      // ignore read error
    }
  }, [repositories.teams, repositories.matchFeature.matches, tournamentId]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [teams, matches] = await Promise.all([
          repositories.teams.listTeamsByTournament(tournamentId),
          repositories.matchFeature.matches.listMatchesByTournament(tournamentId),
        ]);
        if (active) {
          setCounts({ teams: teams.length, matches: matches.length });
        }
      } catch {
        // ignore
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [repositories.teams, repositories.matchFeature.matches, tournamentId]);

  const setTeamsCount = useCallback((count: number) => {
    setCounts((prev) => ({ ...prev, teams: count }));
  }, []);

  const setMatchesCount = useCallback((count: number) => {
    setCounts((prev) => ({ ...prev, matches: count }));
  }, []);

  return (
    <WorkspaceCountContext.Provider
      value={{
        counts,
        refreshCounts,
        setTeamsCount,
        setMatchesCount,
      }}
    >
      {children}
    </WorkspaceCountContext.Provider>
  );
}

export function useWorkspaceCounts(): WorkspaceCountState {
  const context = useContext(WorkspaceCountContext);
  if (!context) {
    throw new Error(
      "useWorkspaceCounts must be used within a WorkspaceCountProvider",
    );
  }
  return context;
}
