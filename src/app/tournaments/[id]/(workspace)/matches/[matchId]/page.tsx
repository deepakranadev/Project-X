import type { Metadata } from "next";

import { MatchEntryRoute } from "@/screens/tournament-workspace/MatchEntryRoute";

export const metadata: Metadata = {
  title: "Match Entry | Tournament",
};

export default function MatchEntryPage({
  params,
}: {
  readonly params: { readonly id: string; readonly matchId: string };
}) {
  return <MatchEntryRoute tournamentId={params.id} matchId={params.matchId} />;
}
