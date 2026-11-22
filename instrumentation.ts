/**
 * Runs once when the server starts. Importing lib/env validates every environment variable, so a bad
 * configuration fails at boot, not on a request. Notifications are then connected to the event log.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
    const { db } = await import("./db/client");
    const { createDrizzleStore } = await import("./server/store/drizzle");
    const { setStore } = await import("./server/store/registry");
    setStore(createDrizzleStore(db));
    const { env } = await import("./lib/env");
    const { setEffectsAppUrl } = await import("./server/effects");
    setEffectsAppUrl(env.APP_URL);
  }
}
