import type { GuestTeam } from "./types";

export function replaceRosterTeam(
  teams: readonly GuestTeam[],
  updated: GuestTeam,
): readonly GuestTeam[] {
  return teams.map((team) => (team.id === updated.id ? updated : team));
}

export function removeRosterTeam(
  teams: readonly GuestTeam[],
  teamId: string,
): readonly GuestTeam[] {
  return teams.filter((team) => team.id !== teamId);
}

export async function publishSuccessfulTeamMutation<T>(
  mutation: () => Promise<T>,
  publish: (result: T) => void,
): Promise<T> {
  const result = await mutation();
  publish(result);
  return result;
}
