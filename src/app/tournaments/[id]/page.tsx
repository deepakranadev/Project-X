import type { Metadata } from "next";

import { TournamentWorkspaceScreen } from "@/screens/tournament-workspace/TournamentWorkspaceScreen";

export const metadata: Metadata = {
  title: "Tournament workspace",
};

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TournamentWorkspaceScreen tournamentId={id} />;
}
