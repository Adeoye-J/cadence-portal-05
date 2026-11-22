import { describe, expect, it } from "vitest";
import { demoStudioOwnerEmail, demoStudioOwnerId } from "@/db/fixtures/cadence-demo";
import { createMemoryStore } from "@/server/store/memory";
import type { Store } from "@/server/store/types";

const STUDIO = "stu_lumen";

async function sentProposal(store: Store, title: string) {
  const created = await store.createDraftProject({
    studioId: STUDIO,
    clientName: "Core Test Co.",
    title,
    currency: "USD",
    revisionTerms: "Two rounds",
    milestones: [
      { title: "One", amountMinor: 1000 },
      { title: "Two", amountMinor: 2000 },
    ],
  });
  const sent = await store.sendDraftProposal(created.projectId, "2026-11-19", 1);
  if (!sent) throw new Error("draft was not sent");
  return created;
}

/** Starts and settles a payment for a milestone, as the payment flow does. */
async function pay(store: Store, projectId: string, position: number, reference = `REF-${projectId}-${position}-${Math.random()}`) {
  const created = await store.createPayment({
    reference, projectId, milestonePosition: position, provider: "paystack", amountMinor: 1000, currency: "USD",
    status: "pending", createdAt: new Date().toISOString(),
  });
  const settled = await store.settlePayment({ reference, settledAt: new Date().toISOString() });
  return { created, settled };
}

function signature(proposalId: string, signerUserId: string) {
  return { proposalId, signerUserId, typedName: "Test Signer", documentSha256: "deadbeef", signedAt: "2026-11-19T10:00:00.000Z" };
}

describe("core store: reads", () => {
  it("gives out copies, so a change that is not saved changes nothing", async () => {
    const store = createMemoryStore();
    const { projectId } = await sentProposal(store, "Copies");
    const project = await store.getProject(projectId);
    if (!project) throw new Error("missing");
    project.stage = "completed";
    project.milestones[0]!.status = "approved";
    const again = await store.getProject(projectId);
    expect(again?.stage).toBe("proposal");
    expect(again?.milestones[0]?.status).toBe("upcoming");
  });

  it("finds a user's studio and role, and the members' addresses", async () => {
    const store = createMemoryStore();
    expect(await store.getMembership(demoStudioOwnerId)).toMatchObject({ studioId: STUDIO, role: "owner" });
    expect(await store.getMembership("usr_nobody")).toBeNull();
    const members = await store.listMembers(STUDIO);
    expect(members.find((m) => m.userId === demoStudioOwnerId)?.email).toBe(demoStudioOwnerEmail);
    expect(await store.getEmails([demoStudioOwnerId, "usr_nobody"])).toEqual({ [demoStudioOwnerId]: demoStudioOwnerEmail });
  });
});

describe("core store: drafts and sending", () => {
  it("gives each new project the next reference and a draft proposal", async () => {
    const store = createMemoryStore();
    const a = await store.createDraftProject({ studioId: STUDIO, clientName: "Ref Co.", title: "A", currency: "USD", revisionTerms: "x", milestones: [{ title: "M", amountMinor: 100 }] });
    const b = await store.createDraftProject({ studioId: STUDIO, clientName: "Ref Co.", title: "B", currency: "USD", revisionTerms: "x", milestones: [{ title: "M", amountMinor: 100 }] });
    expect(Number(b.reference.slice(-3))).toBe(Number(a.reference.slice(-3)) + 1);
    expect((await store.listProposals(a.projectId)).map((p) => p.status)).toEqual(["draft"]);
  });

  it("sends a draft as the next version, and only once", async () => {
    const store = createMemoryStore();
    const created = await store.createDraftProject({ studioId: STUDIO, clientName: "Send Co.", title: "Send", currency: "USD", revisionTerms: "x", milestones: [{ title: "M", amountMinor: 100 }] });
    expect(await store.sendDraftProposal(created.projectId, "2026-11-19", 1)).toEqual({ version: 1 });
    expect(await store.sendDraftProposal(created.projectId, "2026-11-19", 2)).toBeNull();
    expect((await store.getProposal(created.proposalId))?.status).toBe("sent");
  });
});

describe("core store: signing", () => {
  it("signs a sent proposal, moves the project to Signed, and makes milestone 1 payment due", async () => {
    const store = createMemoryStore();
    const { projectId, proposalId } = await sentProposal(store, "Sign");
    expect(await store.commitSignature(signature(proposalId, "usr_a"))).toBe("signed");
    const project = await store.getProject(projectId);
    expect(project?.stage).toBe("signed");
    expect(project?.milestones.map((m) => m.status)).toEqual(["payment_due", "upcoming"]);
    expect((await store.getProposal(proposalId))?.status).toBe("signed");
    expect((await store.getSignature(proposalId))?.signerUserId).toBe("usr_a");
  });

  it("records one signature when two signings race", async () => {
    const store = createMemoryStore();
    const { proposalId } = await sentProposal(store, "Race");
    const results = await Promise.all([store.commitSignature(signature(proposalId, "usr_a")), store.commitSignature(signature(proposalId, "usr_b"))]);
    expect(results.filter((r) => r === "signed")).toHaveLength(1);
    expect(results.filter((r) => r === "not_open")).toHaveLength(1);
  });

  it("does not sign a draft", async () => {
    const store = createMemoryStore();
    const created = await store.createDraftProject({ studioId: STUDIO, clientName: "Draft Co.", title: "Draft", currency: "USD", revisionTerms: "x", milestones: [{ title: "M", amountMinor: 100 }] });
    expect(await store.commitSignature(signature(created.proposalId, "usr_a"))).toBe("not_open");
    expect(await store.getSignature(created.proposalId)).toBeNull();
  });
});

describe("core store: milestones", () => {
  it("moves a milestone only from the state it expects", async () => {
    const store = createMemoryStore();
    const { projectId, proposalId } = await sentProposal(store, "Moves");
    await store.commitSignature(signature(proposalId, "usr_a"));

    expect((await pay(store, projectId, 1)).settled.milestoneActivated).toBe(true);
    expect((await pay(store, projectId, 1)).settled.milestoneActivated).toBe(false);
    expect((await store.getProject(projectId))?.stage).toBe("in_progress");

    const wrong = await store.applyMilestoneTransition({ projectId, position: 1, from: "payment_due", to: "delivered" });
    expect(wrong).toEqual({ applied: false, projectCompleted: false });
    const right = await store.applyMilestoneTransition({ projectId, position: 1, from: "in_progress", to: "delivered" });
    expect(right.applied).toBe(true);
  });

  it("makes the next milestone payment due on approval, and completes the project exactly once", async () => {
    const store = createMemoryStore();
    const { projectId, proposalId } = await sentProposal(store, "Completes");
    await store.commitSignature(signature(proposalId, "usr_a"));
    const approve = (position: number) =>
      store.applyMilestoneTransition({ projectId, position, from: "delivered", to: "approved", activateNext: true, completeIfAllApproved: true });

    await pay(store, projectId, 1);
    await store.applyMilestoneTransition({ projectId, position: 1, from: "in_progress", to: "delivered" });
    expect(await approve(1)).toEqual({ applied: true, projectCompleted: false });
    expect((await store.getProject(projectId))?.milestones.map((m) => m.status)).toEqual(["approved", "payment_due"]);

    await pay(store, projectId, 2);
    await store.applyMilestoneTransition({ projectId, position: 2, from: "in_progress", to: "delivered" });
    expect(await approve(2)).toEqual({ applied: true, projectCompleted: true });
    expect((await store.getProject(projectId))?.stage).toBe("completed");
    expect(await approve(2)).toEqual({ applied: false, projectCompleted: false });
  });
});

describe("core store: contacts and studios", () => {
  it("adds a project contact once", async () => {
    const store = createMemoryStore();
    const { projectId } = await sentProposal(store, "Contacts");
    await store.addProjectContact(projectId, "usr_contact");
    await store.addProjectContact(projectId, "usr_contact");
    expect((await store.getProject(projectId))?.contactUserIds).toEqual(["usr_contact"]);
    expect((await store.listProjectsForContact("usr_contact")).map((p) => p.id)).toEqual([projectId]);
  });

  it("creates a studio with its owner", async () => {
    const store = createMemoryStore();
    const { studioId } = await store.createStudioWithOwner("usr_new_owner_2", "Core Studio");
    expect(await store.getMembership("usr_new_owner_2")).toMatchObject({ studioId, studioName: "Core Studio", role: "owner" });
  });
});

describe("core store: payments", () => {
  const record = (projectId: string, reference: string, createdAt = new Date().toISOString()) => ({
    reference, projectId, milestonePosition: 1, provider: "paystack", amountMinor: 1000, currency: "USD" as const, status: "pending" as const, createdAt,
  });

  async function signedProject(store: Store, title: string) {
    const { projectId, proposalId } = await sentProposal(store, title);
    await store.commitSignature(signature(proposalId, "usr_a"));
    return projectId;
  }

  it("allows one open payment per milestone, and shows the first one to a second attempt", async () => {
    const store = createMemoryStore();
    const projectId = await signedProject(store, "One open");
    expect(await store.createPayment(record(projectId, "REF-1"))).toBe("created");
    await store.setPaymentAuthorization("REF-1", "https://pay.example/1");
    expect(await store.createPayment(record(projectId, "REF-2"))).toBe("open_exists");
    expect(await store.getPayment("REF-2")).toBeNull();
    expect((await store.findOpenPayment(projectId, 1))?.authorizationUrl).toBe("https://pay.example/1");
  });

  it("frees the milestone when a payment fails, and when an open payment is abandoned", async () => {
    const store = createMemoryStore();
    const projectId = await signedProject(store, "Freed");
    await store.createPayment(record(projectId, "REF-A"));
    await store.failPayment("REF-A");
    expect(await store.createPayment(record(projectId, "REF-B"))).toBe("created");

    const old = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    const other = await signedProject(store, "Abandoned");
    await store.createPayment(record(other, "REF-OLD", old));
    expect(await store.findOpenPayment(other, 1)).toBeNull();
    expect(await store.createPayment(record(other, "REF-NEW"))).toBe("created");
    expect((await store.getPayment("REF-OLD"))?.status).toBe("failed");
  });

  it("settles a payment once, moving its milestone in the same step", async () => {
    const store = createMemoryStore();
    const projectId = await signedProject(store, "Settles");
    await store.createPayment(record(projectId, "REF-S"));
    expect(await store.settlePayment({ reference: "REF-S", settledAt: "2026-11-19T10:00:00.000Z" })).toEqual({ outcome: "settled", milestoneActivated: true });
    expect(await store.settlePayment({ reference: "REF-S", settledAt: "2026-11-19T10:01:00.000Z" })).toEqual({ outcome: "already_settled", milestoneActivated: false });
    expect(await store.settlePayment({ reference: "REF-NONE", settledAt: "2026-11-19T10:01:00.000Z" })).toEqual({ outcome: "unknown_reference", milestoneActivated: false });
    const project = await store.getProject(projectId);
    expect(project?.stage).toBe("in_progress");
    expect(project?.milestones[0]?.status).toBe("in_progress");
    expect((await store.getPayment("REF-S"))?.settledAt).toBe("2026-11-19T10:00:00.000Z");
  });

  it("settles a payment only once when two webhooks arrive together", async () => {
    const store = createMemoryStore();
    const projectId = await signedProject(store, "Webhook race");
    await store.createPayment(record(projectId, "REF-W"));
    const results = await Promise.all([
      store.settlePayment({ reference: "REF-W", settledAt: "2026-11-19T10:00:00.000Z" }),
      store.settlePayment({ reference: "REF-W", settledAt: "2026-11-19T10:00:00.000Z" }),
    ]);
    expect(results.filter((r) => r.outcome === "settled")).toHaveLength(1);
  });
});

describe("core store: invitations", () => {
  const invitation = (projectId: string, id: string, overrides: Partial<{ expiresAt: string; revoked: boolean }> = {}) => ({
    id, projectId, email: "client@example.com", tokenHash: `hash-${id}`, invitedByUserId: demoStudioOwnerId,
    createdAt: "2026-11-19T09:00:00.000Z", expiresAt: "2026-12-03T09:00:00.000Z", revoked: false, ...overrides,
  });

  it("accepts once and adds the contact in the same step", async () => {
    const store = createMemoryStore();
    const { projectId } = await sentProposal(store, "Invite once");
    await store.createInvitation(invitation(projectId, "inv-1"));
    const first = await store.acceptInvitation({ invitationId: "inv-1", userId: "usr_c1", acceptedAt: "2026-11-20T09:00:00.000Z" });
    const second = await store.acceptInvitation({ invitationId: "inv-1", userId: "usr_c2", acceptedAt: "2026-11-20T09:00:01.000Z" });
    expect([first, second]).toEqual(["accepted", "unavailable"]);
    expect((await store.getProject(projectId))?.contactUserIds).toEqual(["usr_c1"]);
  });

  it("refuses a revoked or expired invitation, and finds one by its hash", async () => {
    const store = createMemoryStore();
    const { projectId } = await sentProposal(store, "Invite refused");
    await store.createInvitation(invitation(projectId, "inv-r", { revoked: true }));
    await store.createInvitation(invitation(projectId, "inv-e", { expiresAt: "2026-11-19T10:00:00.000Z" }));
    expect(await store.acceptInvitation({ invitationId: "inv-r", userId: "usr_c", acceptedAt: "2026-11-20T09:00:00.000Z" })).toBe("unavailable");
    expect(await store.acceptInvitation({ invitationId: "inv-e", userId: "usr_c", acceptedAt: "2026-11-20T09:00:00.000Z" })).toBe("unavailable");
    expect((await store.findInvitationByHash("hash-inv-r"))?.id).toBe("inv-r");
    expect(await store.findInvitationByHash("missing")).toBeNull();
  });
});

describe("core store: change requests, files and deletion requests", () => {
  it("records a change request only when the milestone change applies, and takes one reply", async () => {
    const store = createMemoryStore();
    const { projectId, proposalId } = await sentProposal(store, "Change");
    await store.commitSignature(signature(proposalId, "usr_a"));
    await pay(store, projectId, 1);
    await store.applyMilestoneTransition({ projectId, position: 1, from: "in_progress", to: "delivered" });
    const request = { id: "cr-1", projectId, position: 1, body: "Please adjust", createdAt: "2026-11-19T10:00:00.000Z" };

    const stale = await store.applyMilestoneTransition({ projectId, position: 1, from: "in_progress", to: "in_progress", changeRequest: request });
    expect(stale.applied).toBe(false);
    expect(await store.listChangeRequests(projectId)).toEqual([]);

    const applied = await store.applyMilestoneTransition({ projectId, position: 1, from: "delivered", to: "in_progress", changeRequest: request });
    expect(applied.applied).toBe(true);
    expect((await store.listChangeRequests(projectId)).map((c) => c.id)).toEqual(["cr-1"]);

    const reply = { id: "cr-1", projectId, body: "Done", repliedAt: "2026-11-19T11:00:00.000Z" };
    expect(await store.replyToChangeRequest(reply)).toBe("replied");
    expect(await store.replyToChangeRequest(reply)).toBe("already_replied");
    expect(await store.replyToChangeRequest({ ...reply, id: "cr-none" })).toBe("not_found");
  });

  it("keeps a file pending until it is made ready once, and lists only ready files", async () => {
    const store = createMemoryStore();
    const file = { id: "f-1", projectId: "prj_files", position: 1, key: "k/1", filename: "a.pdf", contentType: "application/pdf", size: 10, status: "pending" as const, createdAt: "2026-11-19T09:00:00.000Z" };
    await store.createFile(file);
    expect(await store.listReadyFiles("prj_files", 1)).toEqual([]);
    expect((await store.listPendingFilesBefore("2026-11-20T00:00:00.000Z")).map((f) => f.id)).toEqual(["f-1"]);
    expect(await store.markFileReady("f-1")).toBe(true);
    expect(await store.markFileReady("f-1")).toBe(false);
    expect((await store.listReadyFiles("prj_files", 1)).map((f) => f.id)).toEqual(["f-1"]);
    expect(await store.removeFile("f-1")).toBe(true);
    expect(await store.removeFile("f-1")).toBe(false);
  });

  it("records an account deletion request once and keeps the first time", async () => {
    const store = createMemoryStore();
    expect(await store.requestDeletion("usr_d", "2026-11-19T09:00:00.000Z")).toEqual({ requestedAt: "2026-11-19T09:00:00.000Z", alreadyRequested: false });
    expect(await store.requestDeletion("usr_d", "2026-11-20T09:00:00.000Z")).toEqual({ requestedAt: "2026-11-19T09:00:00.000Z", alreadyRequested: true });
    expect(await store.getDeletionRequest("usr_d")).toBe("2026-11-19T09:00:00.000Z");
    expect(await store.getDeletionRequest("usr_none")).toBeNull();
  });
});
