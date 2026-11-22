import type { BillingCycle, PlanKey } from "@/lib/billing/plans";
import type { SubscriptionRecord } from "@/lib/billing/subscription";

/**
 * Where subscriptions and invoices are kept. Settling an invoice is one unit of work: the invoice is marked paid and
 * the plan is activated together, or neither happens. A second settlement of the same invoice cannot succeed.
 */

export type InvoiceStatus = "pending" | "paid" | "failed";

export type BillingInvoice = {
  reference: string;
  studioId: string;
  planKey: PlanKey;
  cycle: BillingCycle;
  amountMinor: number;
  currency: string;
  status: InvoiceStatus;
  createdAt: string;
  paidAt: string | null;
};

export type SettleStoreOutcome = "settled" | "already_settled" | "unknown_reference";

export interface BillingStore {
  getSubscription(studioId: string): Promise<SubscriptionRecord | null>;
  saveSubscription(record: SubscriptionRecord): Promise<void>;
  createInvoice(invoice: BillingInvoice): Promise<void>;
  getInvoice(reference: string): Promise<BillingInvoice | null>;
  /** Marks a pending invoice failed. Never changes a paid invoice. */
  markFailed(reference: string): Promise<void>;
  /**
   * Marks the invoice paid and writes the subscription it activates. Only one call can mark a given invoice paid:
   * the others get already_settled.
   */
  settleInvoice(
    reference: string,
    paidAt: string,
    activate: (invoice: BillingInvoice, current: SubscriptionRecord | null) => SubscriptionRecord,
  ): Promise<SettleStoreOutcome>;
  listInvoices(studioId: string): Promise<BillingInvoice[]>;
}

export function createMemoryBillingStore(): BillingStore {
  const subscriptions = new Map<string, SubscriptionRecord>();
  const invoices = new Map<string, BillingInvoice>();
  return {
    async getSubscription(studioId) {
      const found = subscriptions.get(studioId);
      return found ? { ...found } : null;
    },
    async saveSubscription(record) {
      subscriptions.set(record.studioId, { ...record });
    },
    async createInvoice(invoice) {
      invoices.set(invoice.reference, { ...invoice });
    },
    async getInvoice(reference) {
      const found = invoices.get(reference);
      return found ? { ...found } : null;
    },
    async markFailed(reference) {
      const found = invoices.get(reference);
      if (found && found.status === "pending") invoices.set(reference, { ...found, status: "failed" });
    },
    async settleInvoice(reference, paidAt, activate) {
      // No await between the check and the writes, so no other caller can run in between.
      const invoice = invoices.get(reference);
      if (!invoice) return "unknown_reference";
      if (invoice.status === "paid") return "already_settled";
      const paid: BillingInvoice = { ...invoice, status: "paid", paidAt };
      const current = subscriptions.get(invoice.studioId) ?? null;
      invoices.set(reference, paid);
      subscriptions.set(invoice.studioId, activate(paid, current ? { ...current } : null));
      return "settled";
    },
    async listInvoices(studioId) {
      return [...invoices.values()]
        .filter((i) => i.studioId === studioId)
        .map((i) => ({ ...i }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}
