import { describe, expect, it } from "vitest";
import { demoStudioOwnerId } from "@/db/fixtures/cadence-demo";
import { signUpSchema } from "@/lib/validation/signup";
import { createStudioFor, hasPendingSignup, recordPendingSignup, takePendingSignup } from "@/server/onboarding";
import { getStudioMembership } from "@/server/studio";
import { createMemoryStore } from "@/server/store/memory";
import { setStore } from "@/server/store/registry";

const DETAILS = { fullName: "Alex Morgan", studioName: "Forma Design Co.", country: "NG", currency: "NGN" as const };
const NOW = new Date("2026-11-18T09:00:00Z");

describe("sign-up validation", () => {
  const valid = { fullName: "Alex Morgan", workEmail: "alex@studio.com", studioName: "Forma Design Co.", country: "NG", currency: "USD", terms: "on" };

  it("accepts a complete form", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("refuses an unknown country, an unknown currency, and unticked terms", () => {
    expect(signUpSchema.safeParse({ ...valid, country: "XX" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, currency: "EUR" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, terms: undefined }).success).toBe(false);
  });
});

describe("pending sign-up", () => {
  it("holds the details for the address, and gives them once", async () => {
    setStore(createMemoryStore());
    await recordPendingSignup(DETAILS, "Alex@Studio.com ", NOW);
    expect((await hasPendingSignup("alex@studio.com", NOW))?.studioName).toBe("Forma Design Co.");
    expect((await takePendingSignup("alex@studio.com", NOW))?.fullName).toBe("Alex Morgan");
    expect(await takePendingSignup("alex@studio.com", NOW)).toBeNull();
  });

  it("expires after 30 minutes", async () => {
    setStore(createMemoryStore());
    await recordPendingSignup(DETAILS, "late@studio.com", NOW);
    const later = new Date(NOW.getTime() + 31 * 60 * 1000);
    expect(await takePendingSignup("late@studio.com", later)).toBeNull();
  });
});

describe("studio creation", () => {
  it("makes the signed-in user the owner of the new studio", async () => {
    const created = await createStudioFor("usr_new_owner", "Forma Design Co.");
    const membership = await getStudioMembership("usr_new_owner");
    expect(membership).toMatchObject({ studioId: created.studioId, studioName: "Forma Design Co.", role: "owner" });
    expect(await getStudioMembership(demoStudioOwnerId)).not.toBeNull();
  });
});
