import type { ReactNode } from "react";
import type { Metadata } from "next";

import { TournamentWorkspaceShell } from "@/screens/tournament-workspace/TournamentWorkspaceShell";

export const metadata: Metadata = {
  title: "Tournament workspace",
};

export default async function WorkspaceLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <TournamentWorkspaceShell tournamentId={id}>
      {children}
    </TournamentWorkspaceShell>
  );
}
