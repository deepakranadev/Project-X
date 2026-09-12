import type { Metadata } from "next";

import { MatchesRoute } from "@/screens/tournament-workspace/MatchesRoute";

export const metadata: Metadata = {
  title: "Matches | Tournament",
};

export default function MatchesPage({
  params,
}: {
  readonly params: { readonly id: string };
}) {
  return <MatchesRoute tournamentId={params.id} />;
}
