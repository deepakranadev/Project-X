"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useClientWorkspaceRepositories,
  type TournamentWorkspaceRepositories,
} from "../clientRepositoryComposition";

const WorkspaceRepositoryContext = createContext<TournamentWorkspaceRepositories | null>(null);

export function WorkspaceRepositoryProvider({ children }: { readonly children: ReactNode }) {
  const repositories = useClientWorkspaceRepositories();

  if (!repositories) {
    return (
      <div className="min-h-screen grid place-items-center px-5 bg-background">
        <p className="text-sm text-slate-400" role="status">
          Opening tournament…
        </p>
      </div>
    );
  }

  return (
    <WorkspaceRepositoryContext.Provider value={repositories}>
      {children}
    </WorkspaceRepositoryContext.Provider>
  );
}

export function useWorkspaceRepositories(): TournamentWorkspaceRepositories {
  const context = useContext(WorkspaceRepositoryContext);
  if (!context) {
    throw new Error("useWorkspaceRepositories must be used within a WorkspaceRepositoryProvider");
  }
  return context;
}
