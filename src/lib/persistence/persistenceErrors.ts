export type PersistedEntityType =
  | "TOURNAMENT"
  | "TEAM"
  | "MATCH"
  | "MATCH_RESULT";

export type PersistenceErrorCode =
  | "CORRUPT_STORED_RECORD"
  | "DATABASE_OPEN_BLOCKED"
  | "DATABASE_OPEN_FAILED"
  | "REQUEST_FAILED"
  | "TRANSACTION_FAILED"
  | "STORAGE_QUOTA_EXCEEDED"
  | "CONSTRAINT_FAILURE";

export interface PersistenceErrorDetails {
  readonly entityType?: PersistedEntityType;
  readonly recordId?: string;
  readonly reason?: string;
  readonly cause?: unknown;
}

export class PersistenceError extends Error {
  readonly code: PersistenceErrorCode;
  readonly entityType?: PersistedEntityType;
  readonly recordId?: string;
  readonly reason?: string;
  override readonly cause?: unknown;

  constructor(
    code: PersistenceErrorCode,
    message: string,
    details: PersistenceErrorDetails = {},
  ) {
    super(message);
    this.name = "PersistenceError";
    this.code = code;
    this.entityType = details.entityType;
    this.recordId = details.recordId;
    this.reason = details.reason;
    this.cause = details.cause;
  }
}

export function corruptStoredRecord(
  entityType: PersistedEntityType,
  recordId: string | undefined,
  reason: string,
): PersistenceError {
  const identity = recordId ? ` \"${recordId}\"` : "";
  return new PersistenceError(
    "CORRUPT_STORED_RECORD",
    `The saved ${entityType.toLowerCase().replace("_", "-")} record${identity} is corrupt.`,
    { entityType, recordId, reason },
  );
}

function errorName(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("name" in error)) {
    return undefined;
  }
  return typeof error.name === "string" ? error.name : undefined;
}

export function classifyPersistenceFailure(
  error: unknown,
  fallbackCode: "DATABASE_OPEN_FAILED" | "REQUEST_FAILED" | "TRANSACTION_FAILED",
): PersistenceError {
  if (error instanceof PersistenceError) return error;

  const name = errorName(error);
  if (name === "QuotaExceededError") {
    return new PersistenceError(
      "STORAGE_QUOTA_EXCEEDED",
      "This device does not have enough browser storage to save the change.",
      { cause: error },
    );
  }
  if (name === "ConstraintError") {
    return new PersistenceError(
      "CONSTRAINT_FAILURE",
      "The saved data conflicts with an existing record.",
      { cause: error },
    );
  }

  const message =
    fallbackCode === "DATABASE_OPEN_FAILED"
      ? "Unable to open guest storage on this device."
      : fallbackCode === "REQUEST_FAILED"
        ? "The browser storage request failed."
        : "The browser storage transaction failed.";
  return new PersistenceError(fallbackCode, message, { cause: error });
}
