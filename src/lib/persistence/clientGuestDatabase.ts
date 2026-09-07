import { GuestDatabase } from "./guestDatabase";

let database: GuestDatabase | null = null;

export function getClientGuestDatabase(): GuestDatabase {
  if (typeof window === "undefined") {
    throw new Error("Guest storage is only available in the browser.");
  }

  database ??= new GuestDatabase();
  return database;
}
