import { describe, expect, it } from "vitest";

import { createMatchWriteCoordinator } from "../../src/features/matches/matchWriteCoordinator";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("match write coordinator", () => {
  it("serializes an active Draft autosave before Finalize so stale Draft cannot win", async () => {
    const coordinator = createMatchWriteCoordinator();
    const draftGate = deferred();
    const draftStarted = deferred();
    const order: string[] = [];
    let activeWrites = 0;
    let highestConcurrency = 0;
    let persistedStatus: "DRAFT" | "FINALIZED" = "DRAFT";

    const autosave = coordinator.enqueue(async () => {
      activeWrites += 1;
      highestConcurrency = Math.max(highestConcurrency, activeWrites);
      order.push("draft:start");
      draftStarted.resolve();
      await draftGate.promise;
      persistedStatus = "DRAFT";
      order.push("draft:end");
      activeWrites -= 1;
    });
    await draftStarted.promise;

    const finalize = coordinator.runExplicit("finalize", async () => {
      activeWrites += 1;
      highestConcurrency = Math.max(highestConcurrency, activeWrites);
      order.push("finalize");
      persistedStatus = "FINALIZED";
      activeWrites -= 1;
    });
    draftGate.resolve();
    await Promise.all([autosave, finalize]);

    expect(order).toEqual(["draft:start", "draft:end", "finalize"]);
    expect(highestConcurrency).toBe(1);
    expect(persistedStatus).toBe("FINALIZED");
  });

  it("rejects double Finalize and Close while a finalization is unresolved", async () => {
    const coordinator = createMatchWriteCoordinator();
    const finalizeGate = deferred();
    const finalizeStarted = deferred();
    let finalizeWrites = 0;

    const first = coordinator.runExplicit("finalize", async () => {
      finalizeWrites += 1;
      finalizeStarted.resolve();
      await finalizeGate.promise;
    });
    await finalizeStarted.promise;

    await expect(
      coordinator.runExplicit("finalize", async () => {
        finalizeWrites += 1;
      }),
    ).resolves.toEqual({ started: false });
    await expect(
      coordinator.runExplicit("close", async () => undefined),
    ).resolves.toEqual({ started: false });
    finalizeGate.resolve();
    await first;

    expect(finalizeWrites).toBe(1);
  });

  it("does not start Finalize while an explicit Save Draft is active", async () => {
    const coordinator = createMatchWriteCoordinator();
    const saveGate = deferred();
    const saveStarted = deferred();
    const writes: string[] = [];

    const save = coordinator.runExplicit("save", async () => {
      writes.push("save");
      saveStarted.resolve();
      await saveGate.promise;
    });
    await saveStarted.promise;
    const finalize = await coordinator.runExplicit("finalize", async () => {
      writes.push("finalize");
    });
    saveGate.resolve();
    await save;

    expect(finalize).toEqual({ started: false });
    expect(writes).toEqual(["save"]);
  });
});
