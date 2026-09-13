import { redirect } from "next/navigation";

export default async function TournamentPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/tournaments/${id}/overview`);
}
