import type { Metadata } from "next";

import { TournamentWorkspace } from "@/components/tournament/TournamentWorkspace";

export const metadata: Metadata = {
  title: "Tournament workspace",
};

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TournamentWorkspace tournamentId={id} />;
}
