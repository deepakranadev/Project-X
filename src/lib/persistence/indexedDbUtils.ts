export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener(
      "error",
      () =>
        reject(
          transaction.error ?? new Error("IndexedDB transaction failed."),
        ),
      { once: true },
    );
    transaction.addEventListener(
      "abort",
      () =>
        reject(
          transaction.error ?? new Error("IndexedDB transaction aborted."),
        ),
      { once: true },
    );
  });
}

export function observeTransaction(
  transaction: IDBTransaction,
): Promise<void> {
  const completion = transactionToPromise(transaction);
  void completion.catch(() => undefined);
  return completion;
}

export async function abortTransaction(transaction: IDBTransaction): Promise<void> {
  transaction.abort();
  try {
    await transactionToPromise(transaction);
  } catch {
    // The abort is deliberate; the caller throws the actionable domain error.
  }
}
