import type { Metadata } from "next";

import { StandingsRoute } from "@/screens/tournament-workspace/StandingsRoute";

export const metadata: Metadata = {
  title: "Standings - Tournament workspace",
};

export default async function StandingsPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StandingsRoute tournamentId={id} />;
}
