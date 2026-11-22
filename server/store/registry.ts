import { createMemoryStore } from "./memory";
import type { Store } from "./types";

/**
 * The store the application uses. instrumentation.ts sets the Postgres store when the server starts.
 *
 * It is kept on globalThis, not in a module variable. Next can bundle instrumentation separately from the pages and route
 * handlers, and then each bundle would have its own copy of a module variable: the store set at start-up would not be
 * the one a request sees. globalThis is shared by every bundle in the process.
 *
 * Outside production, if nothing was set, the in-memory store is used so tests and local work run without a database.
 * In production, a missing store is an error, never a silent fallback to memory.
 */
const KEY = Symbol.for("cadence.store");
type Holder = { [KEY]?: Store };

export function setStore(store: Store): void {
  (globalThis as Holder)[KEY] = store;
}

export function getStore(): Store {
  const holder = globalThis as Holder;
  let current = holder[KEY];
  if (!current) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The data store is not set. instrumentation.ts must call setStore before requests.");
    }
    current = createMemoryStore();
    holder[KEY] = current;
  }
  return current;
}
