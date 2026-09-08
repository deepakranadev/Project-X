import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it, vi } from "vitest";

import {
  GUEST_DATABASE_VERSION,
  GuestDatabase,
  TOURNAMENT_STORE,
} from "../../src/lib/persistence/guestDatabase";
import type { PersistenceError } from "../../src/lib/persistence/persistenceErrors";

function openDatabase(
  factory: IDBFactory,
  databaseName: string,
  version: number,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(databaseName, version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

describe("GuestDatabase connection lifecycle", () => {
  it("closes a late successful connection after a blocked open was rejected", async () => {
    const factory = new IDBFactory();
    const databaseName = "blocked-late-success-connection-test";
    const blockingConnection = await openDatabase(factory, databaseName, 1);
    const originalOpen = factory.open.bind(factory);
    let capturedRequest: IDBOpenDBRequest | undefined;
    vi.spyOn(factory, "open").mockImplementation(
      (name: string, version?: number) => {
        const request =
          version === undefined
            ? originalOpen(name)
            : originalOpen(name, version);
        capturedRequest = request;
        return request;
      },
    );
    const database = new GuestDatabase({
      databaseName,
      indexedDbFactory: factory,
    });

    const opening = database.getConnection();
    await expect(opening).rejects.toMatchObject<Partial<PersistenceError>>({
      code: "DATABASE_OPEN_BLOCKED",
    });

    const lateRequest = capturedRequest;
    if (!lateRequest) throw new Error("The guest open request was not captured.");
    const lateConnection = new Promise<IDBDatabase>((resolve, reject) => {
      lateRequest.addEventListener("success", () => resolve(lateRequest.result));
      lateRequest.addEventListener("error", () => reject(lateRequest.error));
    });
    blockingConnection.close();

    const lateDatabase = await lateConnection;
    expect(() =>
      lateDatabase.transaction(TOURNAMENT_STORE, "readonly"),
    ).toThrow();
  });

  it("closes an active connection when another opener requests a new version", async () => {
    const factory = new IDBFactory();
    const databaseName = "version-change-closes-connection-test";
    const database = new GuestDatabase({
      databaseName,
      indexedDbFactory: factory,
    });
    const active = await database.getConnection();

    const upgraded = await openDatabase(
      factory,
      databaseName,
      GUEST_DATABASE_VERSION + 1,
    );

    expect(() => active.transaction(TOURNAMENT_STORE, "readonly")).toThrow();
    upgraded.close();
  });
});
