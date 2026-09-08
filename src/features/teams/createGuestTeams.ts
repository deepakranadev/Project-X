import {
  validateBulkTeamNames,
  type BulkTeamParseIssue,
} from "./parseBulkTeamNames";

import type { GuestTeamRepository } from "./teamRepository";
import type { GuestTeam } from "./types";

export interface GuestTeamCreationDependencies {
  readonly createId?: () => string;
  readonly now?: () => string;
}

export class GuestTeamCreationError extends Error {
  readonly issues: readonly BulkTeamParseIssue[];

  constructor(issues: readonly BulkTeamParseIssue[]) {
    super(issues.map((issue) => issue.message).join(" "));
    this.name = "GuestTeamCreationError";
    this.issues = issues;
  }
}

function defaultCreateId(): string {
  return globalThis.crypto.randomUUID();
}

function defaultNow(): string {
  return new Date().toISOString();
}

export async function createGuestTeamsFromText(
  tournamentId: string,
  pastedNames: string,
  repository: GuestTeamRepository,
  dependencies: GuestTeamCreationDependencies = {},
): Promise<readonly GuestTeam[]> {
  const existingTeams = await repository.listTeamsByTournament(tournamentId);
  const parsed = validateBulkTeamNames(pastedNames, existingTeams);
  if (parsed.issues.length > 0) {
    throw new GuestTeamCreationError(parsed.issues);
  }

  const highestSlot = existingTeams.reduce(
    (highest, team) => Math.max(highest, team.slotNumber ?? 0),
    0,
  );
  const timestamp = (dependencies.now ?? defaultNow)();
  const createId = dependencies.createId ?? defaultCreateId;
  const teams: GuestTeam[] = parsed.candidates.map((candidate, index) => ({
    id: createId(),
    tournamentId,
    name: candidate.name,
    shortName: null,
    slotNumber: highestSlot + index + 1,
    logo: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  return repository.bulkCreateTeams(teams);
}
