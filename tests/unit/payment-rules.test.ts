import { describe, expect, it } from "vitest";
import { demoViewerId } from "@/db/fixtures/cadence-demo";
import { PaymentProviderError, type PaymentProvider } from "@/lib/services/payments";
import { buildEffects } from "@/server/effects";
import { listEvents } from "@/server/events";
import { getPaymentForViewer, settlePayment, startMilestonePayment } from "@/server/payments";
import { createMemoryStore } from "@/server/store/memory";
import { getStore, setStore } from "@/server/store/registry";
import { FakePaymentProvider } from "@/tests/support/fake-payments";

const APP_URL = "https://portal.example.com";

/** A project the demo client can pay on: sent, signed, with milestone 1 payment due. */
async function payableProject(title: string) {
  setStore(createMemoryStore());
  const store = getStore();
  const created = await store.createDraftProject({
    studioId: "stu_lumen",
    clientName: "Rules Co.",
    title,
    currency: "USD",
    revisionTerms: "x",
    milestones: [{ title: "First", amountMinor: 50000 }, { title: "Second", amountMinor: 70000 }],
  });
  await store.sendDraftProposal(created.projectId, "2026-11-19", 1);
  await store.addProjectContact(created.projectId, demoViewerId);
  await store.commitSignature({ proposalId: created.proposalId, signerUserId: demoViewerId, typedName: "T", documentSha256: "x", signedAt: "2026-11-19T09:00:00.000Z" });
  return created.projectId;
}

const start = (projectId: string, provider: PaymentProvider) =>
  startMilestonePayment({ viewerUserId: demoViewerId, viewerEmail: "sofia.marin@example.com", projectId, position: 1, provider, appUrl: APP_URL });

describe("payment rules", () => {
  it("gives a second click the first payment page instead of starting another charge", async () => {
    const projectId = await payableProject("Second click");
    const provider = new FakePaymentProvider();
    const first = await start(projectId, provider);
    const second = await start(projectId, provider);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.reference).toBe(first.reference);
    expect(second.authorizationUrl).toBe(first.authorizationUrl);
    expect(provider.initiated).toHaveLength(1);
  });

  it("frees the milestone when the provider refuses, so the client can try again", async () => {
    const projectId = await payableProject("Refused");
    const refusing: PaymentProvider = {
      name: "refusing",
      async initiate() {
        throw new PaymentProviderError("Currency not supported", false);
      },
      async verify(reference) {
        return { reference, status: "failed", amountMinor: 0, currency: "USD" };
      },
    };
    expect(await start(projectId, refusing)).toEqual({ ok: false, message: "Currency not supported" });
    expect(await getStore().findOpenPayment(projectId, 1)).toBeNull();
    const retry = await start(projectId, new FakePaymentProvider());
    expect(retry.ok).toBe(true);
  });

  it("settles with the milestone and its event in one step, and a repeat adds nothing", async () => {
    const projectId = await payableProject("Settles once");
    const provider = new FakePaymentProvider();
    const started = await start(projectId, provider);
    if (!started.ok) throw new Error("payment did not start");
    provider.setCharge({ reference: started.reference, status: "success", amountMinor: 50000, currency: "USD" });

    expect(await settlePayment(started.reference, provider)).toBe("settled");
    expect(await settlePayment(started.reference, provider)).toBe("already_settled");

    const project = await getStore().getProject(projectId);
    expect(project?.stage).toBe("in_progress");
    expect(project?.milestones[0]?.status).toBe("in_progress");
    const settled = (await listEvents(projectId, "studio")).filter((e) => e.kind === "payment_settled");
    expect(settled).toHaveLength(1);
    expect((await getPaymentForViewer(demoViewerId, projectId, started.reference))?.status).toBe("paid");
  });

  it("marks a payment failed when the provider says the customer abandoned it", async () => {
    const projectId = await payableProject("Abandoned");
    const provider = new FakePaymentProvider();
    const started = await start(projectId, provider);
    if (!started.ok) throw new Error("payment did not start");
    provider.setCharge({ reference: started.reference, status: "abandoned", amountMinor: 50000, currency: "USD" });
    expect(await settlePayment(started.reference, provider)).toBe("not_successful");
    expect((await getPaymentForViewer(demoViewerId, projectId, started.reference))?.status).toBe("failed");
    expect(await getStore().findOpenPayment(projectId, 1)).toBeNull();
  });
});

describe("events written with the change", () => {
  it("records a payment start in the studio's log only", async () => {
    const projectId = await payableProject("Start event");
    await start(projectId, new FakePaymentProvider());
    expect((await listEvents(projectId, "studio")).map((e) => e.kind)).toContain("payment_started");
    expect((await listEvents(projectId, "client")).map((e) => e.kind)).not.toContain("payment_started");
    expect((await buildEffects({ projectId, kind: "payment_started", actor: "client", summary: "x" })).events[0]?.clientVisible).toBe(false);
  });
});
