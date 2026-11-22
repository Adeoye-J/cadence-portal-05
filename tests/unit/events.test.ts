import { describe, expect, it } from "vitest";
import { demoStudioOwnerEmail } from "@/db/fixtures/cadence-demo";
import { buildEffects } from "@/server/effects";
import { listEvents } from "@/server/events";
import { MemoryOutbox } from "@/server/outbox";
import { createMemoryStore } from "@/server/store/memory";
import { setStore } from "@/server/store/registry";

const PROJECT = "prj_cad_2026_090";

function freshStore() {
  const outbox = new MemoryOutbox();
  const store = createMemoryStore({ outbox });
  setStore(store);
  return { store, outbox };
}

describe("activity log", () => {
  it("shows the client only the events meant for them, and the studio all of them", async () => {
    const { store } = freshStore();
    await store.appendEffects(await buildEffects(
      { projectId: PROJECT, kind: "invitation_sent", actor: "studio", summary: "Invite" },
      { projectId: PROJECT, kind: "payment_settled", actor: "system", summary: "Settled" },
    ));
    expect((await listEvents(PROJECT, "client")).map((e) => e.kind)).toEqual(["payment_settled"]);
    expect((await listEvents(PROJECT, "studio")).map((e) => e.kind)).toEqual(["payment_settled", "invitation_sent"]);
  });

  it("lists the newest event first, in the order they were written", async () => {
    const { store } = freshStore();
    await store.appendEffects(await buildEffects({ projectId: "prj_order", kind: "milestone_delivered", actor: "studio", summary: "first" }));
    await store.appendEffects(await buildEffects({ projectId: "prj_order", kind: "milestone_approved", actor: "client", summary: "second" }));
    expect((await listEvents("prj_order", "studio")).map((e) => e.summary)).toEqual(["second", "first"]);
  });

  it("keeps each project's events apart", async () => {
    const { store } = freshStore();
    await store.appendEffects(await buildEffects({ projectId: "prj_a", kind: "proposal_sent", actor: "studio", summary: "A" }));
    expect(await listEvents("prj_b", "studio")).toEqual([]);
  });
});

describe("effects", () => {
  it("queues the notification emails together with the event", async () => {
    const { store, outbox } = freshStore();
    const effects = await buildEffects({ projectId: PROJECT, kind: "proposal_signed", actor: "client", summary: "Proposal signed" });
    expect(effects.events).toHaveLength(1);
    expect(effects.outbox.length).toBeGreaterThan(0);
    await store.appendEffects(effects);
    expect(outbox.snapshot().map((m) => m.to)).toContain(demoStudioOwnerEmail);
  });

  it("writes the event and its emails when a command applies, and neither when it does not", async () => {
    const { store, outbox } = freshStore();
    const created = await store.createDraftProject({
      studioId: "stu_lumen", clientName: "Effects Co.", title: "Effects", currency: "USD", revisionTerms: "x",
      milestones: [{ title: "M", amountMinor: 100 }],
    });
    const effects = await buildEffects({ projectId: created.projectId, kind: "milestone_approved", actor: "client", summary: "Approved" });
    // The milestone is upcoming, not delivered, so this change does not apply.
    const result = await store.applyMilestoneTransition({ projectId: created.projectId, position: 1, from: "delivered", to: "approved", effects });
    expect(result.applied).toBe(false);
    expect(await listEvents(created.projectId, "studio")).toEqual([]);
    expect(outbox.snapshot()).toEqual([]);
  });

  it("queues each email once, even if the same effects are written twice", async () => {
    const { store, outbox } = freshStore();
    const effects = await buildEffects({ projectId: PROJECT, kind: "proposal_signed", actor: "client", summary: "Proposal signed" });
    await store.appendEffects(effects);
    const queued = outbox.snapshot().length;
    await store.appendEffects(effects);
    expect(outbox.snapshot()).toHaveLength(queued);
  });
});
