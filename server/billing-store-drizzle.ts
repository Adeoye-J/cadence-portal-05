import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { billingInvoices, studioSubscriptions } from "@/db/schema";
import type { SubscriptionRecord } from "@/lib/billing/subscription";
import type { BillingInvoice, BillingStore, SettleStoreOutcome } from "@/server/billing-store";

type InvoiceRow = typeof billingInvoices.$inferSelect;
type SubscriptionRow = typeof studioSubscriptions.$inferSelect;

function toInvoice(row: InvoiceRow): BillingInvoice {
  return {
    reference: row.reference,
    studioId: row.studioId,
    planKey: row.planKey,
    cycle: row.cycle,
    amountMinor: row.amountMinor,
    currency: row.currency,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
  };
}

function toSubscription(row: SubscriptionRow): SubscriptionRecord {
  return {
    studioId: row.studioId,
    planKey: row.planKey,
    cycle: row.cycle,
    periodEnd: row.periodEnd.toISOString(),
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Billing records in Postgres. Settlement runs in one transaction. The invoice update is conditional on its status, so
 * a second settlement of the same invoice matches no row and changes nothing. The subscription row is locked while it
 * is read and written, so two different invoices for one studio cannot overwrite each other.
 */
export function createDrizzleBillingStore(database: typeof db = db): BillingStore {
  return {
    async getSubscription(studioId) {
      const [row] = await database.select().from(studioSubscriptions).where(eq(studioSubscriptions.studioId, studioId)).limit(1);
      return row ? toSubscription(row) : null;
    },
    async saveSubscription(r) {
      const values = {
        studioId: r.studioId,
        planKey: r.planKey,
        cycle: r.cycle,
        periodEnd: new Date(r.periodEnd),
        cancelAtPeriodEnd: r.cancelAtPeriodEnd,
        updatedAt: new Date(r.updatedAt),
      };
      await database.insert(studioSubscriptions).values(values).onConflictDoUpdate({ target: studioSubscriptions.studioId, set: values });
    },
    async createInvoice(i) {
      await database.insert(billingInvoices).values({
        reference: i.reference,
        studioId: i.studioId,
        planKey: i.planKey,
        cycle: i.cycle,
        amountMinor: i.amountMinor,
        currency: i.currency,
        status: i.status,
        createdAt: new Date(i.createdAt),
        paidAt: i.paidAt ? new Date(i.paidAt) : null,
      });
    },
    async getInvoice(reference) {
      const [row] = await database.select().from(billingInvoices).where(eq(billingInvoices.reference, reference)).limit(1);
      return row ? toInvoice(row) : null;
    },
    async markFailed(reference) {
      await database
        .update(billingInvoices)
        .set({ status: "failed" })
        .where(and(eq(billingInvoices.reference, reference), eq(billingInvoices.status, "pending")));
    },
    async settleInvoice(reference, paidAt, activate): Promise<SettleStoreOutcome> {
      return database.transaction(async (tx) => {
        const [paid] = await tx
          .update(billingInvoices)
          .set({ status: "paid", paidAt: new Date(paidAt) })
          .where(and(eq(billingInvoices.reference, reference), ne(billingInvoices.status, "paid")))
          .returning();
        if (!paid) {
          const [exists] = await tx.select({ reference: billingInvoices.reference }).from(billingInvoices).where(eq(billingInvoices.reference, reference)).limit(1);
          return exists ? "already_settled" : "unknown_reference";
        }

        const invoice = toInvoice(paid);
        const [existing] = await tx
          .select()
          .from(studioSubscriptions)
          .where(eq(studioSubscriptions.studioId, invoice.studioId))
          .limit(1)
          .for("update");
        const next = activate(invoice, existing ? toSubscription(existing) : null);
        const values = {
          studioId: next.studioId,
          planKey: next.planKey,
          cycle: next.cycle,
          periodEnd: new Date(next.periodEnd),
          cancelAtPeriodEnd: next.cancelAtPeriodEnd,
          updatedAt: new Date(next.updatedAt),
        };
        await tx.insert(studioSubscriptions).values(values).onConflictDoUpdate({ target: studioSubscriptions.studioId, set: values });
        return "settled";
      });
    },
    async listInvoices(studioId) {
      const rows = await database.select().from(billingInvoices).where(eq(billingInvoices.studioId, studioId)).orderBy(desc(billingInvoices.createdAt));
      return rows.map(toInvoice);
    },
  };
}
