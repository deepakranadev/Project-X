import type { Metadata } from "next";

import { OverviewRoute } from "@/screens/tournament-workspace/OverviewRoute";

export const metadata: Metadata = {
  title: "Overview - Tournament workspace",
};

export default async function OverviewPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OverviewRoute tournamentId={id} />;
}
