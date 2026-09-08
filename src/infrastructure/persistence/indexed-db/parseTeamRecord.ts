import { MAX_TEAM_SLOT_NUMBER } from "@/domain/teams/validation";

import type { TeamRecord } from "./indexedDbRecords";
import {
  failStoredRecord,
  isNonEmptyString,
  parseStoredImage,
  requireNonEmptyString,
  requireRecord,
  requireTimestamp,
} from "./storedRecordParsing";

export function parseTeamRecord(value: unknown): TeamRecord {
  const record = requireRecord(value, "TEAM");
  const id = requireNonEmptyString(record, "TEAM", "id");
  const tournamentId = requireNonEmptyString(record, "TEAM", "tournamentId");
  const name = requireNonEmptyString(record, "TEAM", "name");
  const createdAt = requireTimestamp(record, "TEAM", "createdAt");
  const updatedAt = requireTimestamp(record, "TEAM", "updatedAt");
  if (record.shortName !== null && !isNonEmptyString(record.shortName)) {
    failStoredRecord("TEAM", record, "shortName must be null or a non-empty string.");
  }
  if (
    record.slotNumber !== null &&
    (!Number.isInteger(record.slotNumber) ||
      typeof record.slotNumber !== "number" ||
      record.slotNumber < 1 ||
      record.slotNumber > MAX_TEAM_SLOT_NUMBER)
  ) {
    failStoredRecord("TEAM", record, `slotNumber must be null or an integer from 1 to ${MAX_TEAM_SLOT_NUMBER}.`);
  }
  return {
    id,
    tournamentId,
    name,
    shortName: record.shortName,
    slotNumber: record.slotNumber,
    logo: parseStoredImage(record.logo, "TEAM", record, "logo"),
    createdAt,
    updatedAt,
  };
}
