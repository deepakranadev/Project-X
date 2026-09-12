import type { Metadata } from "next";

import { ScoringRoute } from "@/screens/tournament-workspace/ScoringRoute";

export const metadata: Metadata = {
  title: "Scoring - Tournament workspace",
};

export default async function ScoringPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScoringRoute tournamentId={id} />;
}
