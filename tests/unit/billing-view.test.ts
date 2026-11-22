import { describe, expect, it } from "vitest";
import { demoStudioOwnerId } from "@/db/fixtures/cadence-demo";
import { buildBillingView } from "@/lib/billing/billing-view";
import type { PaymentProvider } from "@/lib/services/payments";
import { settleReturnedCheckout, startSubscriptionCheckout } from "@/server/billing";
import { createMemoryBillingStore, type BillingInvoice } from "@/server/billing-store";

const NOW = new Date("2026-11-19T09:00:00Z");
const sub = (overrides = {}) => ({
  studioId: "stu_lumen", planKey: "pro" as const, cycle: "monthly" as const, periodEnd: "2026-12-19T09:00:00.000Z",
  cancelAtPeriodEnd: false, updatedAt: NOW.toISOString(), ...overrides,
});
const invoice = (reference: string, status: BillingInvoice["status"], createdAt: string): BillingInvoice => ({
  reference, studioId: "stu_lumen", planKey: "pro", cycle: "monthly", amountMinor: 2900, currency: "USD", status, createdAt, paidAt: null,
});

describe("billing view", () => {
  it("is on Free with no subscription, and shows usage against the one-project limit", () => {
    const v = buildBillingView({ subscription: null, invoices: [], activeProjects: 1, now: NOW });
    expect(v.current).toMatchObject({ key: "free", name: "Free", priceText: "$0 / month", cycleLabel: null });
    expect(v.periodEndsOn).toBeNull();
    expect(v.usage).toEqual({ active: 1, limit: 1, percent: 100 });
    expect(v.tiers.filter((t) => t.isCurrent).map((t) => t.key)).toEqual(["free"]);
  });

  it("shows a running paid plan with its period end and usage", () => {
    const v = buildBillingView({ subscription: sub(), invoices: [], activeProjects: 2, now: NOW });
    expect(v.current).toMatchObject({ key: "pro", priceText: "$29 / month", cycleLabel: "Monthly" });
    expect(v.periodEndsOn).toBe("2026-12-19T09:00:00.000Z");
    expect(v.usage).toEqual({ active: 2, limit: 5, percent: 40 });
    expect(v.cancelScheduled).toBe(false);
  });

  it("shows the yearly price, the scheduled cancellation, and no limit on Studio", () => {
    const yearly = buildBillingView({ subscription: sub({ cycle: "annual", cancelAtPeriodEnd: true }), invoices: [], activeProjects: 0, now: NOW });
    expect(yearly.current.priceText).toBe("$278.40 / year");
    expect(yearly.cancelScheduled).toBe(true);
    const studio = buildBillingView({ subscription: sub({ planKey: "studio" }), invoices: [], activeProjects: 9, now: NOW });
    expect(studio.usage).toEqual({ active: 9, limit: null, percent: 0 });
  });

  it("returns to Free once the paid period has ended", () => {
    const v = buildBillingView({ subscription: sub({ periodEnd: "2026-11-01T00:00:00.000Z" }), invoices: [], activeProjects: 0, now: NOW });
    expect(v.current.key).toBe("free");
    expect(v.periodEndsOn).toBeNull();
  });

  it("lists invoices with readable dates, amounts and statuses", () => {
    const v = buildBillingView({ subscription: null, invoices: [invoice("sub_a", "paid", "2026-11-01T00:00:00.000Z"), invoice("sub_b", "pending", "2026-11-18T00:00:00.000Z")], activeProjects: 0, now: NOW });
    expect(v.invoices.map((i) => [i.reference, i.amountText, i.statusLabel])).toEqual([
      ["sub_a", "$29.00", "Paid"],
      ["sub_b", "$29.00", "Waiting for payment"],
    ]);
  });
});

describe("coming back from checkout", () => {
  function setup() {
    const store = createMemoryBillingStore();
    let amount = 0;
    const provider: PaymentProvider = {
      name: "fake",
      async initiate(i) { amount = i.amountMinor; return { authorizationUrl: `https://pay.example/${i.reference}` }; },
      async verify(reference) { return { reference, status: "success", amountMinor: amount, currency: "USD" }; },
    };
    return { store, deps: { store, provider } };
  }

  it("confirms the payment for the owner's own invoice, once", async () => {
    const { store, deps } = setup();
    const started = await startSubscriptionCheckout(deps, { userId: demoStudioOwnerId, email: "o@example.com", planKey: "pro", cycle: "monthly", callbackUrl: "https://app.example/x" });
    if (!started.ok) throw new Error(started.message);
    const [inv] = await store.listInvoices("stu_lumen");
    if (!inv) throw new Error("no invoice");
    expect(await settleReturnedCheckout(deps, "stu_lumen", inv.reference, NOW)).toBe("settled");
    expect(await settleReturnedCheckout(deps, "stu_lumen", inv.reference, NOW)).toBe("already_settled");
    expect((await store.getSubscription("stu_lumen"))?.planKey).toBe("pro");
  });

  it("ignores a reference that belongs to another studio or does not exist", async () => {
    const { store, deps } = setup();
    await store.createInvoice({ ...invoice("sub_other", "pending", NOW.toISOString()), studioId: "stu_someone_else" });
    expect(await settleReturnedCheckout(deps, "stu_lumen", "sub_other", NOW)).toBe("not_this_studio");
    expect(await settleReturnedCheckout(deps, "stu_lumen", "sub_missing", NOW)).toBe("not_this_studio");
    expect(await store.getSubscription("stu_someone_else")).toBeNull();
  });
});
