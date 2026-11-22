import { describe, expect, it } from "vitest";
import { PLANS, PLAN_KEYS, priceMinor } from "@/lib/billing/plans";
import { annualSavingLabel, buildMatrix, buildPricingPlans, usd } from "@/lib/billing/pricing-view";
import { projectLimitFor } from "@/lib/billing/subscription";

describe("pricing page data", () => {
  it("lists the plans in order with the prices that checkout will charge", () => {
    const plans = buildPricingPlans();
    expect(plans.map((p) => p.key)).toEqual(["free", "pro", "studio"]);
    for (const p of plans) {
      expect(p.monthlyMinor).toBe(priceMinor(PLANS[p.key], "monthly"));
      expect(p.annualMinor).toBe(priceMinor(PLANS[p.key], "annual"));
    }
    expect(plans.filter((p) => p.featured).map((p) => p.key)).toEqual(["pro"]);
  });

  it("shows dollars without cents when whole, and with cents when not", () => {
    expect(usd(0)).toBe("$0");
    expect(usd(2900)).toBe("$29");
    expect(usd(Math.round(27840 / 12))).toBe("$23.20");
    expect(annualSavingLabel()).toBe("Save 20%");
  });

  it("states each plan's project limit from the limit the product enforces", () => {
    const row = buildMatrix()[0]?.rows[0];
    expect(row?.label).toBe("Active projects at a time");
    const texts = row?.cells.map((c) => (c.kind === "text" ? c.text : "")) ?? [];
    expect(texts).toEqual(["1 project", "5 projects", "Unlimited"]);
    expect(PLAN_KEYS.map((k) => projectLimitFor(k))).toEqual([1, 5, null]);
    expect(PLANS.free.features[0]).toBe("1 active project at a time");
    expect(PLANS.pro.features[0]).toBe("Up to 5 active projects at a time");
    expect(PLANS.studio.features[0]).toBe("Unlimited active projects");
  });

  it("gives every comparison row a cell for each plan, and sells nothing the product does not do", () => {
    const rows = buildMatrix().flatMap((g) => g.rows);
    expect(rows.length).toBeGreaterThan(8);
    for (const r of rows) expect(r.cells).toHaveLength(3);
    const text = JSON.stringify([buildMatrix(), buildPricingPlans()]).toLowerCase();
    for (const claim of ["escrow", "sla", "custom domain", "seats", "concierge", "sso", "reminder", "storage"]) {
      expect(text).not.toContain(claim);
    }
  });
});
