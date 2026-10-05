import type { GuestOverallStandingsSnapshot } from "@/features/standings/loadGuestOverallStandings";
import { StandingsTable } from "./StandingsTable";

export function StandingsRows({
  snapshot,
}: {
  readonly snapshot: GuestOverallStandingsSnapshot;
}) {
  const teamById = new Map(snapshot.teams.map((team) => [team.id, team]));
  return (
    <StandingsTable
      standings={snapshot.standings}
      teamById={teamById}
      finalizedMatchCount={snapshot.finalizedMatchCount}
    />
  );
}
