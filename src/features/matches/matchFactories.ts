export function createMatchId(): string {
  return globalThis.crypto.randomUUID();
}

export function currentMatchTimestamp(): string {
  return new Date().toISOString();
}
