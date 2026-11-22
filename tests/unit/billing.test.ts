import { describe, expect, it } from "vitest";
import { demoStudioOwnerId } from "@/db/fixtures/cadence-demo";
import { PLANS, priceMinor } from "@/lib/billing/plans";
import { effectivePlan, nextPeriodEnd } from "@/lib/billing/subscription";
import { PaymentProviderError, type PaymentProvider, type VerifiedCharge } from "@/lib/services/payments";
import { cancelSubscription, checkNewActiveProject, settleSubscription, startSubscriptionCheckout } from "@/server/billing";
import { createMemoryBillingStore } from "@/server/billing-store";

const NOW = new Date("2026-11-19T09:00:00Z");
const STUDIO = "stu_lumen";

/** A provider whose charge result the test controls. */
function fakeProvider() {
  let charge: Partial<VerifiedCharge> = {};
  const provider: PaymentProvider = {
    name: "fake",
    async initiate(input) {
      return { authorizationUrl: `https://pay.example/${input.reference}` };
    },
    async verify(reference) {
      return { reference, status: "success", amountMinor: 0, currency: "USD", ...charge };
    },
  };
  return {
    provider,
    setCharge(next: Partial<VerifiedCharge>) {
      charge = next;
    },
  };
}

function setup() {
  const store = createMemoryBillingStore();
  const fake = fakeProvider();
  return { store, fake, deps: { store, provider: fake.provider } };
}

async function startAndLastInvoice(deps: ReturnType<typeof setup>["deps"], planKey: "pro" | "studio", cycle: "monthly" | "annual") {
  const result = await startSubscriptionCheckout(deps, {
    userId: demoStudioOwnerId,
    email: "owner@example.com",
    planKey,
    cycle,
    callbackUrl: "https://app.example/studio/projects",
  });
  if (!result.ok) throw new Error(result.message);
  const [invoice] = await deps.store.listInvoices(STUDIO);
  if (!invoice) throw new Error("no invoice");
  return { url: result.authorizationUrl, invoice };
}

describe("prices", () => {
  it("prices monthly plans as designed and annual at 20% off twelve months", () => {
    expect(priceMinor(PLANS.pro, "monthly")).toBe(2900);
    expect(priceMinor(PLANS.pro, "annual")).toBe(27840);
    expect(priceMinor(PLANS.studio, "annual")).toBe(75840);
    expect(priceMinor(PLANS.free, "monthly")).toBe(0);
  });
});

describe("checkout", () => {
  it("creates a pending invoice for the chosen plan and cycle, then returns the provider's page", async () => {
    const { deps } = setup();
    const { url, invoice } = await startAndLastInvoice(deps, "pro", "annual");
    expect(url).toBe(`https://pay.example/${invoice.reference}`);
    expect(invoice).toMatchObject({ studioId: STUDIO, planKey: "pro", cycle: "annual", amountMinor: 27840, status: "pending", currency: "USD" });
    expect(invoice.reference.startsWith("sub_")).toBe(true);
  });

  it("refuses anyone who is not signed in to a studio", async () => {
    const { deps } = setup();
    const result = await startSubscriptionCheckout(deps, {
      userId: "usr_not_a_member",
      email: "x@example.com",
      planKey: "pro",
      cycle: "monthly",
      callbackUrl: "https://app.example/x",
    });
    expect(result).toEqual({ ok: false, message: "Studio not found." });
  });
});

describe("checkout failure", () => {
  it("marks the invoice failed and says why when the provider refuses to start the payment", async () => {
    const store = createMemoryBillingStore();
    const provider: PaymentProvider = {
      name: "refusing",
      async initiate() {
        throw new PaymentProviderError("Currency not supported", false);
      },
      async verify(reference) {
        return { reference, status: "failed", amountMinor: 0, currency: "USD" };
      },
    };
    const result = await startSubscriptionCheckout({ store, provider }, {
      userId: demoStudioOwnerId,
      email: "owner@example.com",
      planKey: "pro",
      cycle: "monthly",
      callbackUrl: "https://app.example/studio/projects",
    });
    expect(result).toEqual({ ok: false, message: "Currency not supported" });
    const [invoice] = await store.listInvoices(STUDIO);
    expect(invoice?.status).toBe("failed");
  });
});

describe("settling a payment", () => {
  it("activates the plan for one period, and a repeat of the same charge changes nothing", async () => {
    const { deps, fake } = setup();
    const { invoice } = await startAndLastInvoice(deps, "pro", "monthly");
    fake.setCharge({ amountMinor: invoice.amountMinor, currency: "USD" });

    expect(await settleSubscription(deps, invoice.reference, NOW)).toBe("settled");
    const sub = await deps.store.getSubscription(STUDIO);
    expect(sub?.planKey).toBe("pro");
    expect(effectivePlan(sub, NOW)).toBe("pro");
    expect(await settleSubscription(deps, invoice.reference, NOW)).toBe("already_settled");
  });

  it("does not activate anything when the charged amount is different", async () => {
    const { deps, fake } = setup();
    const { invoice } = await startAndLastInvoice(deps, "studio", "monthly");
    fake.setCharge({ amountMinor: 100, currency: "USD" });
    expect(await settleSubscription(deps, invoice.reference, NOW)).toBe("amount_mismatch");
    expect(await deps.store.getSubscription(STUDIO)).toBeNull();
  });

  it("does not settle a charge the provider has not confirmed", async () => {
    const { deps, fake } = setup();
    const { invoice } = await startAndLastInvoice(deps, "pro", "monthly");
    fake.setCharge({ status: "pending", amountMinor: invoice.amountMinor, currency: "USD" });
    expect(await settleSubscription(deps, invoice.reference, NOW)).toBe("not_successful");
    expect((await deps.store.getInvoice(invoice.reference))?.status).toBe("pending");
  });

  it("refuses an unknown reference", async () => {
    const { deps } = setup();
    expect(await settleSubscription(deps, "sub_unknown", NOW)).toBe("unknown_reference");
  });
});

describe("plan in force", () => {
  it("returns a studio to Free once its paid period has ended", async () => {
    const { deps, fake } = setup();
    const { invoice } = await startAndLastInvoice(deps, "pro", "monthly");
    fake.setCharge({ amountMinor: invoice.amountMinor, currency: "USD" });
    await settleSubscription(deps, invoice.reference, NOW);
    const sub = await deps.store.getSubscription(STUDIO);
    const later = new Date(NOW.getTime() + 31 * 86_400_000);
    expect(effectivePlan(sub, later)).toBe("free");
  });

  it("keeps the plan until the end of the period after the owner cancels", async () => {
    const { deps, fake } = setup();
    const { invoice } = await startAndLastInvoice(deps, "pro", "monthly");
    fake.setCharge({ amountMinor: invoice.amountMinor, currency: "USD" });
    await settleSubscription(deps, invoice.reference, NOW);
    await cancelSubscription(deps.store, STUDIO, NOW);
    const sub = await deps.store.getSubscription(STUDIO);
    expect(sub?.cancelAtPeriodEnd).toBe(true);
    expect(effectivePlan(sub, NOW)).toBe("pro");
  });

  it("adds a period to what remains when the same plan is paid again early", () => {
    const current = { studioId: STUDIO, planKey: "pro" as const, cycle: "monthly" as const, periodEnd: "2026-12-09T09:00:00.000Z", cancelAtPeriodEnd: false, updatedAt: NOW.toISOString() };
    const next = nextPeriodEnd({ current, planKey: "pro", cycle: "monthly", now: NOW });
    expect(next).toBe("2027-01-08T09:00:00.000Z");
  });
});

describe("active project limit", () => {
  it("stops a studio on Free at its one active project", async () => {
    const { store } = setup();
    const result = await checkNewActiveProject(store, STUDIO, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("includes 1 active project");
  });

  it("lifts the limit on a paid plan that allows unlimited projects", async () => {
    const { deps, fake } = setup();
    const { invoice } = await startAndLastInvoice(deps, "studio", "monthly");
    fake.setCharge({ amountMinor: invoice.amountMinor, currency: "USD" });
    await settleSubscription(deps, invoice.reference, NOW);
    expect(await checkNewActiveProject(deps.store, STUDIO, NOW)).toEqual({ ok: true });
  });
});
