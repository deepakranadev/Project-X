import type { Team } from "@/domain/teams/types";
import { normalizeTeamNameKey, normalizeTeamWhitespace } from "@/domain/teams/validation";
import { TeamRepositoryError } from "@/features/teams/teamRepository";
import { assertValidTeamInput } from "@/features/teams/validation";
import type { PersistedImage } from "@/infrastructure/browser/persistedImage";

export type PersistedTeam = Team<PersistedImage>;

export function compareStoredTeams(left: PersistedTeam, right: PersistedTeam): number {
  if (left.slotNumber !== null && right.slotNumber !== null) {
    const slotComparison = left.slotNumber - right.slotNumber;
    if (slotComparison !== 0) return slotComparison;
  } else if (left.slotNumber !== null) {
    return -1;
  } else if (right.slotNumber !== null) {
    return 1;
  }
  const nameComparison = normalizeTeamNameKey(left.name).localeCompare(normalizeTeamNameKey(right.name));
  return nameComparison || left.createdAt.localeCompare(right.createdAt);
}

export function normalizeStoredTeam(team: PersistedTeam): PersistedTeam {
  const normalized = {
    ...team,
    tournamentId: team.tournamentId.trim(),
    name: normalizeTeamWhitespace(team.name),
    shortName: normalizeTeamWhitespace(team.shortName ?? "") || null,
  };
  assertValidTeamInput(normalized);
  return normalized;
}

export function assertUniqueStoredTeam(
  candidate: PersistedTeam,
  roster: readonly PersistedTeam[],
  ignoredTeamId?: string,
): void {
  const duplicateName = roster.find(
    (team) => team.id !== ignoredTeamId && normalizeTeamNameKey(team.name) === normalizeTeamNameKey(candidate.name),
  );
  if (duplicateName) {
    throw new TeamRepositoryError(
      "DUPLICATE_NAME",
      `“${candidate.name}” matches existing team “${duplicateName.name}”. Team names must be unique within this tournament.`,
    );
  }
  if (candidate.slotNumber !== null) {
    const duplicateSlot = roster.find(
      (team) => team.id !== ignoredTeamId && team.slotNumber === candidate.slotNumber,
    );
    if (duplicateSlot) {
      throw new TeamRepositoryError(
        "SLOT_CONFLICT",
        `Slot #${candidate.slotNumber} is already assigned to ${duplicateSlot.name}. Choose another slot.`,
      );
    }
  }
}
