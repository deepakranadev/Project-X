import {
  MATCH_STATUSES,
  PARTICIPATION_STATUSES,
  type MatchStatus,
  type ParticipationStatus,
} from "@/domain/matches/types";
import { MAX_TEAM_SLOT_NUMBER } from "@/domain/teams/validation";
import { assertValidScoringConfig } from "@/domain/scoring/validateScoringConfig";
import { copyScoringConfig } from "@/domain/tournaments/scoringPresets";
import type { Tournament } from "@/domain/tournaments/types";
import {
  validatePersistedImage,
  type PersistedImage,
} from "@/infrastructure/browser/persistedImage";

import type {
  MatchRecord,
  MatchResultRecord,
  TeamRecord,
  TournamentRecord,
  WritableTournamentRecord,
} from "./indexedDbRecords";
import {
  corruptStoredRecord,
  type PersistedEntityType,
} from "./persistenceErrors";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function availableRecordId(value: unknown): string | undefined {
  if (!isPlainRecord(value) || typeof value.id !== "string") return undefined;
  return value.id.trim() ? value.id : undefined;
}

function fail(
  entityType: PersistedEntityType,
  value: unknown,
  reason: string,
): never {
  throw corruptStoredRecord(entityType, availableRecordId(value), reason);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function parseImage(
  value: unknown,
  entityType: PersistedEntityType,
  record: unknown,
  field: string,
): PersistedImage | null {
  if (value === null) return null;
  if (
    !isPlainRecord(value) ||
    !(value.blob instanceof Blob) ||
    !isNonEmptyString(value.fileName)
  ) {
    fail(entityType, record, `${field} is not a valid persisted image object.`);
  }

  const image: PersistedImage = {
    blob: value.blob,
    fileName: value.fileName,
  };
  const issues = validatePersistedImage(image);
  if (issues.length > 0) {
    fail(entityType, record, `${field}: ${issues.map(({ code }) => code).join(", ")}.`);
  }
  return image;
}

function requireRecord(
  value: unknown,
  entityType: PersistedEntityType,
): Record<string, unknown> {
  if (!isPlainRecord(value)) fail(entityType, value, "The stored value is not an object.");
  return value;
}

function requireNonEmptyString(
  record: Record<string, unknown>,
  entityType: PersistedEntityType,
  field: string,
): string {
  const value = record[field];
  if (!isNonEmptyString(value)) {
    fail(entityType, record, `${field} must be a non-empty string.`);
  }
  return value;
}

function requireTimestamp(
  record: Record<string, unknown>,
  entityType: PersistedEntityType,
  field: "createdAt" | "updatedAt",
): string {
  const value = record[field];
  if (!isIsoTimestamp(value)) {
    fail(entityType, record, `${field} must be a canonical ISO timestamp.`);
  }
  return value;
}

function isMatchStatus(value: unknown): value is MatchStatus {
  return MATCH_STATUSES.some((status) => status === value);
}

function isParticipationStatus(value: unknown): value is ParticipationStatus {
  return PARTICIPATION_STATUSES.some((status) => status === value);
}

export function parseTournamentRecord(value: unknown): TournamentRecord {
  const record = requireRecord(value, "TOURNAMENT");
  const id = requireNonEmptyString(record, "TOURNAMENT", "id");
  const name = requireNonEmptyString(record, "TOURNAMENT", "name");
  const createdAt = requireTimestamp(record, "TOURNAMENT", "createdAt");
  const updatedAt = requireTimestamp(record, "TOURNAMENT", "updatedAt");
  if (record.game !== "BGMI") {
    fail("TOURNAMENT", record, "game must be BGMI.");
  }
  if (record.organizerName !== null && !isNonEmptyString(record.organizerName)) {
    fail("TOURNAMENT", record, "organizerName must be null or a non-empty string.");
  }
  if (!isPlainRecord(record.scoringConfig)) {
    fail("TOURNAMENT", record, "scoringConfig must be an object.");
  }

  return {
    id,
    name,
    game: record.game,
    tournamentLogo: parseImage(
      record.tournamentLogo,
      "TOURNAMENT",
      record,
      "tournamentLogo",
    ),
    organizerName: record.organizerName,
    organizerLogo: parseImage(
      record.organizerLogo,
      "TOURNAMENT",
      record,
      "organizerLogo",
    ),
    scoringConfig: record.scoringConfig,
    createdAt,
    updatedAt,
  };
}

export function tournamentRecordToTournament(
  record: TournamentRecord,
): Tournament<PersistedImage> {
  assertValidScoringConfig(record.scoringConfig);
  return {
    ...record,
    scoringConfig: copyScoringConfig(record.scoringConfig),
  };
}

export function tournamentToRecord(
  tournament: Tournament<PersistedImage>,
): WritableTournamentRecord {
  assertValidScoringConfig(tournament.scoringConfig);
  return {
    ...tournament,
    scoringConfig: copyScoringConfig(tournament.scoringConfig),
  };
}

export function parseTeamRecord(value: unknown): TeamRecord {
  const record = requireRecord(value, "TEAM");
  const id = requireNonEmptyString(record, "TEAM", "id");
  const tournamentId = requireNonEmptyString(record, "TEAM", "tournamentId");
  const name = requireNonEmptyString(record, "TEAM", "name");
  const createdAt = requireTimestamp(record, "TEAM", "createdAt");
  const updatedAt = requireTimestamp(record, "TEAM", "updatedAt");
  if (record.shortName !== null && !isNonEmptyString(record.shortName)) {
    fail("TEAM", record, "shortName must be null or a non-empty string.");
  }
  if (
    record.slotNumber !== null &&
    (!Number.isInteger(record.slotNumber) ||
      typeof record.slotNumber !== "number" ||
      record.slotNumber < 1 ||
      record.slotNumber > MAX_TEAM_SLOT_NUMBER)
  ) {
    fail("TEAM", record, `slotNumber must be null or an integer from 1 to ${MAX_TEAM_SLOT_NUMBER}.`);
  }

  return {
    id,
    tournamentId,
    name,
    shortName: record.shortName,
    slotNumber: record.slotNumber,
    logo: parseImage(record.logo, "TEAM", record, "logo"),
    createdAt,
    updatedAt,
  };
}

export function parseMatchRecord(value: unknown): MatchRecord {
  const record = requireRecord(value, "MATCH");
  const id = requireNonEmptyString(record, "MATCH", "id");
  const tournamentId = requireNonEmptyString(record, "MATCH", "tournamentId");
  const createdAt = requireTimestamp(record, "MATCH", "createdAt");
  const updatedAt = requireTimestamp(record, "MATCH", "updatedAt");
  if (
    typeof record.matchNumber !== "number" ||
    !Number.isInteger(record.matchNumber) ||
    record.matchNumber < 1
  ) {
    fail("MATCH", record, "matchNumber must be a positive integer.");
  }
  if (!isMatchStatus(record.status)) {
    fail("MATCH", record, "status is not supported.");
  }
  const name = record.name;
  let parsedName: string | undefined;
  if (name !== undefined) {
    if (!isNonEmptyString(name)) {
      fail("MATCH", record, "name must be absent or a non-empty string.");
    }
    parsedName = name;
  }

  const match: MatchRecord = {
    id,
    tournamentId,
    matchNumber: record.matchNumber,
    ...(parsedName === undefined ? {} : { name: parsedName }),
    status: record.status,
    createdAt,
    updatedAt,
  };
  return match;
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

export function parseMatchResultRecord(value: unknown): MatchResultRecord {
  const record = requireRecord(value, "MATCH_RESULT");
  const id = requireNonEmptyString(record, "MATCH_RESULT", "id");
  const tournamentId = requireNonEmptyString(
    record,
    "MATCH_RESULT",
    "tournamentId",
  );
  const matchId = requireNonEmptyString(record, "MATCH_RESULT", "matchId");
  const teamId = requireNonEmptyString(record, "MATCH_RESULT", "teamId");
  const createdAt = requireTimestamp(record, "MATCH_RESULT", "createdAt");
  const updatedAt = requireTimestamp(record, "MATCH_RESULT", "updatedAt");
  if (!isParticipationStatus(record.participationStatus)) {
    fail("MATCH_RESULT", record, "participationStatus is not supported.");
  }
  if (record.source !== "MANUAL") {
    fail("MATCH_RESULT", record, "source must be MANUAL.");
  }
  if (!isNullableFiniteNumber(record.placement)) {
    fail("MATCH_RESULT", record, "placement must be null or a finite number.");
  }
  if (!isNullableFiniteNumber(record.kills)) {
    fail("MATCH_RESULT", record, "kills must be null or a finite number.");
  }
  if (
    record.participationStatus === "DNP" &&
    (record.placement !== null || record.kills !== null)
  ) {
    fail("MATCH_RESULT", record, "DNP rows must have null placement and kills.");
  }

  return {
    id,
    tournamentId,
    matchId,
    teamId,
    placement: record.placement,
    kills: record.kills,
    participationStatus: record.participationStatus,
    source: record.source,
    createdAt,
    updatedAt,
  };
}
