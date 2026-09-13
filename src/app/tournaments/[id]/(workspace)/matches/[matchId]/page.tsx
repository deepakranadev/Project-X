import type { Metadata } from "next";

import { MatchEntryRoute } from "@/screens/tournament-workspace/MatchEntryRoute";

export const metadata: Metadata = {
  title: "Match Entry | Tournament",
};

export default async function MatchEntryPage({
  params,
}: {
  readonly params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  return <MatchEntryRoute tournamentId={id} matchId={matchId} />;
}
