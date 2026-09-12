import type { Metadata } from "next";

import { TeamsRoute } from "@/screens/tournament-workspace/TeamsRoute";

export const metadata: Metadata = {
  title: "Teams - Tournament workspace",
};

export default async function TeamsPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamsRoute tournamentId={id} />;
}
