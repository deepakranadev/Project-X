import { classifyPersistenceFailure } from "./persistenceErrors";

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(classifyPersistenceFailure(request.error, "REQUEST_FAILED"));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener(
      "error",
      () =>
        reject(classifyPersistenceFailure(transaction.error, "TRANSACTION_FAILED")),
      { once: true },
    );
    transaction.addEventListener(
      "abort",
      () =>
        reject(classifyPersistenceFailure(transaction.error, "TRANSACTION_FAILED")),
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
  try {
    transaction.abort();
  } catch {
    // A failed request may already have moved the transaction to done.
    return;
  }
  try {
    await transactionToPromise(transaction);
  } catch {
    // The abort is deliberate; the caller throws the actionable domain error.
  }
}
