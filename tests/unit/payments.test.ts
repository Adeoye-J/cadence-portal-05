import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { demoProjects, demoViewerId } from "@/db/fixtures/cadence-demo";
import { verifyPaystackSignature } from "@/lib/services/paystack-signature";
import { getPaymentForViewer, settlePayment, startMilestonePayment } from "@/server/payments";
import { signProposal } from "@/server/proposals";
import { FakePaymentProvider } from "@/tests/support/fake-payments";

const APP_URL = "https://portal.example.com";

describe("verifyPaystackSignature", () => {
  const secret = "sk_test_example";
  const body = '{"event":"charge.success","data":{"reference":"X"}}';
  const good = createHmac("sha512", secret).update(body).digest("hex");

  it("accepts the HMAC-SHA512 of the raw body", () => {
    expect(verifyPaystackSignature(body, good, secret)).toBe(true);
  });

  it("rejects a changed body, a missing header, a wrong secret or an unset secret", () => {
    expect(verifyPaystackSignature(body + " ", good, secret)).toBe(false);
    expect(verifyPaystackSignature(body, null, secret)).toBe(false);
    expect(verifyPaystackSignature(body, good, "sk_test_other")).toBe(false);
    expect(verifyPaystackSignature(body, good, "")).toBe(false);
  });
});

describe("payment flow for the proposal project (CAD-2026-090)", () => {
  const provider = new FakePaymentProvider();
  let reference = "";

  it("refuses to start a payment for a viewer who is not a contact", async () => {
    const r = await startMilestonePayment({
      viewerUserId: "usr_stranger",
      viewerEmail: "x@example.com",
      projectId: "prj_cad_2026_090",
      position: 1,
      provider,
      appUrl: APP_URL,
    });
    expect(r.ok).toBe(false);
  });

  it("refuses milestone 1 before the proposal is signed", async () => {
    const r = await startMilestonePayment({
      viewerUserId: demoViewerId,
      viewerEmail: "x@example.com",
      projectId: "prj_cad_2026_090",
      position: 1,
      provider,
      appUrl: APP_URL,
    });
    expect(r.ok).toBe(false);
  });

  it("starts milestone 1 after signing, with the amount and a callback that carries the reference", async () => {
    await signProposal(demoViewerId, "prp_cad_2026_090_v4", "Sofia Marin");
    const r = await startMilestonePayment({
      viewerUserId: demoViewerId,
      viewerEmail: "sofia.marin@example.com",
      projectId: "prj_cad_2026_090",
      position: 1,
      provider,
      appUrl: APP_URL,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    reference = r.reference;
    const sent = provider.initiated[0];
    expect(sent?.amountMinor).toBe(180000);
    expect(sent?.currency).toBe("USD");
    expect(sent?.callbackUrl).toBe(`${APP_URL}/projects/prj_cad_2026_090/payments/${reference}`);
    expect(await getPaymentForViewer(demoViewerId, "prj_cad_2026_090", reference)).toMatchObject({ status: "pending" });
  });

  it("throws when the provider cannot confirm a charge, so the webhook asks for a retry", async () => {
    await expect(settlePayment(reference, provider)).rejects.toThrow();
  });

  it("settles on a confirmed charge, moves the project on, and does nothing on a repeat event", async () => {
    provider.setCharge({ reference, status: "success", amountMinor: 180000, currency: "USD" });
    expect(await settlePayment(reference, provider)).toBe("settled");
    expect(await settlePayment(reference, provider)).toBe("already_settled");

    const project = demoProjects.find((p) => p.id === "prj_cad_2026_090");
    expect(project?.stage).toBe("in_progress");
    expect(project?.milestones[0]?.status).toBe("in_progress");
    expect(await getPaymentForViewer(demoViewerId, "prj_cad_2026_090", reference)).toMatchObject({ status: "paid" });
  });
});

describe("settlement guards", () => {
  it("does not mark a payment paid when the amount differs from what we stored", async () => {
    const provider = new FakePaymentProvider();
    const started = await startMilestonePayment({
      viewerUserId: demoViewerId,
      viewerEmail: "x@example.com",
      projectId: "prj_cad_2026_089",
      position: 2,
      provider,
      appUrl: APP_URL,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    provider.setCharge({ reference: started.reference, status: "success", amountMinor: 1, currency: "USD" });
    expect(await settlePayment(started.reference, provider)).toBe("amount_mismatch");
    expect(await getPaymentForViewer(demoViewerId, "prj_cad_2026_089", started.reference)).toMatchObject({ status: "pending" });
  });

  it("reports an unknown reference without touching any project", async () => {
    expect(await settlePayment("NOPE", new FakePaymentProvider())).toBe("unknown_reference");
  });
});
