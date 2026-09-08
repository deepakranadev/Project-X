import { assertValidScoringConfig } from "@/domain/scoring/validateScoringConfig";
import { copyScoringConfig } from "@/domain/tournaments/scoringPresets";
import type { Tournament } from "@/domain/tournaments/types";
import type { PersistedImage } from "@/infrastructure/browser/persistedImage";

import type { TournamentRecord, WritableTournamentRecord } from "./indexedDbRecords";
import {
  failStoredRecord,
  isNonEmptyString,
  isPlainRecord,
  parseStoredImage,
  requireNonEmptyString,
  requireRecord,
  requireTimestamp,
} from "./storedRecordParsing";

export function parseTournamentRecord(value: unknown): TournamentRecord {
  const record = requireRecord(value, "TOURNAMENT");
  const id = requireNonEmptyString(record, "TOURNAMENT", "id");
  const name = requireNonEmptyString(record, "TOURNAMENT", "name");
  const createdAt = requireTimestamp(record, "TOURNAMENT", "createdAt");
  const updatedAt = requireTimestamp(record, "TOURNAMENT", "updatedAt");
  if (record.game !== "BGMI") failStoredRecord("TOURNAMENT", record, "game must be BGMI.");
  if (record.organizerName !== null && !isNonEmptyString(record.organizerName)) {
    failStoredRecord("TOURNAMENT", record, "organizerName must be null or a non-empty string.");
  }
  if (!isPlainRecord(record.scoringConfig)) {
    failStoredRecord("TOURNAMENT", record, "scoringConfig must be an object.");
  }
  return {
    id,
    name,
    game: record.game,
    tournamentLogo: parseStoredImage(record.tournamentLogo, "TOURNAMENT", record, "tournamentLogo"),
    organizerName: record.organizerName,
    organizerLogo: parseStoredImage(record.organizerLogo, "TOURNAMENT", record, "organizerLogo"),
    scoringConfig: record.scoringConfig,
    createdAt,
    updatedAt,
  };
}

export function tournamentRecordToTournament(record: TournamentRecord): Tournament<PersistedImage> {
  assertValidScoringConfig(record.scoringConfig);
  return { ...record, scoringConfig: copyScoringConfig(record.scoringConfig) };
}

export function tournamentToRecord(
  tournament: Tournament<PersistedImage>,
): WritableTournamentRecord {
  assertValidScoringConfig(tournament.scoringConfig);
  return { ...tournament, scoringConfig: copyScoringConfig(tournament.scoringConfig) };
}
