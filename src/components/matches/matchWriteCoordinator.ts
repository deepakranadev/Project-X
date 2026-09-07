export type ExplicitMatchAction = "save" | "finalize" | "close";

export type ExplicitActionResult<T> =
  | { readonly started: false }
  | { readonly started: true; readonly value: T };

export interface MatchWriteCoordinator {
  enqueue<T>(write: () => Promise<T>): Promise<T>;
  runExplicit<T>(
    action: ExplicitMatchAction,
    write: () => Promise<T>,
  ): Promise<ExplicitActionResult<T>>;
  hasExplicitAction(): boolean;
}

export function createMatchWriteCoordinator(): MatchWriteCoordinator {
  let tail: Promise<void> = Promise.resolve();
  let explicitAction: ExplicitMatchAction | null = null;

  function enqueue<T>(write: () => Promise<T>): Promise<T> {
    const result = tail.then(write, write);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async function runExplicit<T>(
    action: ExplicitMatchAction,
    write: () => Promise<T>,
  ): Promise<ExplicitActionResult<T>> {
    if (explicitAction) return { started: false };
    explicitAction = action;
    try {
      return { started: true, value: await enqueue(write) };
    } finally {
      explicitAction = null;
    }
  }

  return {
    enqueue,
    runExplicit,
    hasExplicitAction: () => explicitAction !== null,
  };
}
