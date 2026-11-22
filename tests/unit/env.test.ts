import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/env-schema";

const REQUIRED = {
  DATABASE_URL: "postgres://u:p@localhost:5432/cadence",
  AUTH_SECRET: "x".repeat(40),
  APP_URL: "http://localhost:3000",
};

describe("environment validation", () => {
  it("accepts the required variables alone", () => {
    expect(parseServerEnv(REQUIRED).APP_URL).toBe("http://localhost:3000");
  });

  it("treats blank optional values as unset, as a copied .env.example has them", () => {
    const env = parseServerEnv({
      ...REQUIRED,
      CRON_SECRET: "",
      STORAGE_ENDPOINT_URL: "",
      RESEND_API_KEY: "   ",
      DEV_DEMO_VIEWER: "",
    });
    expect(env.CRON_SECRET).toBeUndefined();
    expect(env.STORAGE_ENDPOINT_URL).toBeUndefined();
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it("still rejects a short secret that was actually set, and names it", () => {
    expect(() => parseServerEnv({ ...REQUIRED, CRON_SECRET: "short" })).toThrow(/CRON_SECRET/);
  });

  it("names every missing required variable in one message", () => {
    let message = "";
    try {
      parseServerEnv({});
    } catch (err) {
      message = err instanceof Error ? err.message : "";
    }
    expect(message).toContain("DATABASE_URL");
    expect(message).toContain("AUTH_SECRET");
    expect(message).toContain("APP_URL");
  });

  it("rejects an auth secret under 32 characters", () => {
    expect(() => parseServerEnv({ ...REQUIRED, AUTH_SECRET: "x".repeat(31) })).toThrow(/AUTH_SECRET/);
  });

  it("accepts a support address, and rejects one that is not an address", () => {
    expect(parseServerEnv({ ...REQUIRED, SUPPORT_EMAIL: "help@example.com" }).SUPPORT_EMAIL).toBe("help@example.com");
    expect(() => parseServerEnv({ ...REQUIRED, SUPPORT_EMAIL: "not-an-address" })).toThrow(/SUPPORT_EMAIL/);
  });
});
