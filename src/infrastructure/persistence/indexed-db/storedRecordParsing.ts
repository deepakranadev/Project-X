import {
  validatePersistedImage,
  type PersistedImage,
} from "@/infrastructure/browser/persistedImage";

import { corruptStoredRecord, type PersistedEntityType } from "./persistenceErrors";

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function availableRecordId(value: unknown): string | undefined {
  if (!isPlainRecord(value) || typeof value.id !== "string") return undefined;
  return value.id.trim() ? value.id : undefined;
}

export function failStoredRecord(
  entityType: PersistedEntityType,
  value: unknown,
  reason: string,
): never {
  throw corruptStoredRecord(entityType, availableRecordId(value), reason);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function requireRecord(
  value: unknown,
  entityType: PersistedEntityType,
): Record<string, unknown> {
  if (!isPlainRecord(value)) failStoredRecord(entityType, value, "The stored value is not an object.");
  return value;
}

export function requireNonEmptyString(
  record: Record<string, unknown>,
  entityType: PersistedEntityType,
  field: string,
): string {
  const value = record[field];
  if (!isNonEmptyString(value)) {
    failStoredRecord(entityType, record, `${field} must be a non-empty string.`);
  }
  return value;
}

export function requireTimestamp(
  record: Record<string, unknown>,
  entityType: PersistedEntityType,
  field: "createdAt" | "updatedAt",
): string {
  const value = record[field];
  if (typeof value !== "string") {
    failStoredRecord(entityType, record, `${field} must be a canonical ISO timestamp.`);
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) {
    failStoredRecord(entityType, record, `${field} must be a canonical ISO timestamp.`);
  }
  return value;
}

export function parseStoredImage(
  value: unknown,
  entityType: PersistedEntityType,
  record: unknown,
  field: string,
): PersistedImage | null {
  if (value === null) return null;
  if (!isPlainRecord(value) || !(value.blob instanceof Blob) || !isNonEmptyString(value.fileName)) {
    failStoredRecord(entityType, record, `${field} is not a valid persisted image object.`);
  }
  const image: PersistedImage = { blob: value.blob, fileName: value.fileName };
  const issues = validatePersistedImage(image);
  if (issues.length > 0) {
    failStoredRecord(entityType, record, `${field}: ${issues.map(({ code }) => code).join(", ")}.`);
  }
  return image;
}
