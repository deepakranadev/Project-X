import type { Metadata } from "next";

import { MatchesRoute } from "@/screens/tournament-workspace/MatchesRoute";

export const metadata: Metadata = {
  title: "Matches | Tournament",
};

export default async function MatchesPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MatchesRoute tournamentId={id} />;
}
