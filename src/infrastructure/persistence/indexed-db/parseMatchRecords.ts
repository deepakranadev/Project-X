import {
  MATCH_STATUSES,
  PARTICIPATION_STATUSES,
  type MatchStatus,
  type ParticipationStatus,
} from "@/domain/matches/types";

import type { MatchRecord, MatchResultRecord } from "./indexedDbRecords";
import {
  failStoredRecord,
  isNonEmptyString,
  requireNonEmptyString,
  requireRecord,
  requireTimestamp,
} from "./storedRecordParsing";

function isMatchStatus(value: unknown): value is MatchStatus {
  return MATCH_STATUSES.some((status) => status === value);
}

function isParticipationStatus(value: unknown): value is ParticipationStatus {
  return PARTICIPATION_STATUSES.some((status) => status === value);
}

export function parseMatchRecord(value: unknown): MatchRecord {
  const record = requireRecord(value, "MATCH");
  const id = requireNonEmptyString(record, "MATCH", "id");
  const tournamentId = requireNonEmptyString(record, "MATCH", "tournamentId");
  const createdAt = requireTimestamp(record, "MATCH", "createdAt");
  const updatedAt = requireTimestamp(record, "MATCH", "updatedAt");
  if (typeof record.matchNumber !== "number" || !Number.isInteger(record.matchNumber) || record.matchNumber < 1) {
    failStoredRecord("MATCH", record, "matchNumber must be a positive integer.");
  }
  if (!isMatchStatus(record.status)) failStoredRecord("MATCH", record, "status is not supported.");
  let parsedName: string | undefined;
  if (record.name !== undefined) {
    if (!isNonEmptyString(record.name)) {
      failStoredRecord("MATCH", record, "name must be absent or a non-empty string.");
    }
    parsedName = record.name;
  }
  return {
    id,
    tournamentId,
    matchNumber: record.matchNumber,
    ...(parsedName === undefined ? {} : { name: parsedName }),
    status: record.status,
    createdAt,
    updatedAt,
  };
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

export function parseMatchResultRecord(value: unknown): MatchResultRecord {
  const record = requireRecord(value, "MATCH_RESULT");
  const id = requireNonEmptyString(record, "MATCH_RESULT", "id");
  const tournamentId = requireNonEmptyString(record, "MATCH_RESULT", "tournamentId");
  const matchId = requireNonEmptyString(record, "MATCH_RESULT", "matchId");
  const teamId = requireNonEmptyString(record, "MATCH_RESULT", "teamId");
  const createdAt = requireTimestamp(record, "MATCH_RESULT", "createdAt");
  const updatedAt = requireTimestamp(record, "MATCH_RESULT", "updatedAt");
  if (!isParticipationStatus(record.participationStatus)) {
    failStoredRecord("MATCH_RESULT", record, "participationStatus is not supported.");
  }
  if (record.source !== "MANUAL") failStoredRecord("MATCH_RESULT", record, "source must be MANUAL.");
  if (!isNullableFiniteNumber(record.placement)) {
    failStoredRecord("MATCH_RESULT", record, "placement must be null or a finite number.");
  }
  if (!isNullableFiniteNumber(record.kills)) {
    failStoredRecord("MATCH_RESULT", record, "kills must be null or a finite number.");
  }
  if (record.participationStatus === "DNP" && (record.placement !== null || record.kills !== null)) {
    failStoredRecord("MATCH_RESULT", record, "DNP rows must have null placement and kills.");
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
