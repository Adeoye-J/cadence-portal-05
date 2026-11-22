import { describe, expect, it } from "vitest";
import { demoProjects } from "@/db/fixtures/cadence-demo";
import { isPaid, retainerTotals, stageIndex, stageLabel } from "@/lib/milestones";

describe("retainerTotals", () => {
  it("matches the Stitch retainer: $6,000 total, $1,800 paid, $4,200 remaining", () => {
    const project = demoProjects[0];
    if (!project) throw new Error("fixture missing");
    expect(retainerTotals(project.milestones)).toEqual({
      totalMinor: 600000,
      paidMinor: 180000,
      remainingMinor: 420000,
    });
  });

  it("does not count a payment-due milestone as paid", () => {
    expect(isPaid("payment_due")).toBe(false);
    expect(isPaid("upcoming")).toBe(false);
    expect(isPaid("in_progress")).toBe(true);
  });
});

describe("stageIndex", () => {
  it("maps the six stages in order", () => {
    expect(stageIndex("proposal")).toBe(0);
    expect(stageIndex("in_progress")).toBe(2);
    expect(stageIndex("closed")).toBe(5);
    expect(stageLabel("in_progress")).toBe("In progress");
  });
});
