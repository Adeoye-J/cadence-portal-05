import { describe, expect, it } from "vitest";
import { demoProjects, demoProposals, demoMemberships, demoStudioOwnerId, demoViewerId } from "@/db/fixtures/cadence-demo";
import { canWrite } from "@/lib/authz";
import { createProposalSchema, toMinor } from "@/lib/validation/proposal";
import { createDraftProposal, sendProposal } from "@/server/studio-writes";

const valid = {
  clientName: "Apex Holdings LLC",
  title: "Brand refresh",
  currency: "USD" as const,
  revisionTerms: "Two rounds per phase.",
  milestones: [{ title: "Discovery", description: "", amount: 1800, dueDate: "" }],
};

describe("role policy", () => {
  it("lets owners, admins and members write, and viewers read only", () => {
    expect(canWrite("owner")).toBe(true);
    expect(canWrite("admin")).toBe(true);
    expect(canWrite("member")).toBe(true);
    expect(canWrite("viewer")).toBe(false);
  });
});

describe("createProposalSchema", () => {
  it("accepts a complete proposal with optional fields blank", () => {
    expect(createProposalSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects no milestones, zero amounts, and more than twelve milestones", () => {
    expect(createProposalSchema.safeParse({ ...valid, milestones: [] }).success).toBe(false);
    expect(createProposalSchema.safeParse({ ...valid, milestones: [{ ...valid.milestones[0]!, amount: 0 }] }).success).toBe(false);
    const thirteen = Array.from({ length: 13 }, () => valid.milestones[0]!);
    expect(createProposalSchema.safeParse({ ...valid, milestones: thirteen }).success).toBe(false);
  });

  it("converts major units to minor units without float drift", () => {
    expect(toMinor(1800)).toBe(180000);
    expect(toMinor(19.99)).toBe(1999);
  });
});

describe("studio writes", () => {
  it("refuses a client contact, who has no studio", async () => {
    expect((await createDraftProposal(demoViewerId, valid)).ok).toBe(false);
  });

  it("refuses a viewer-role member", async () => {
    demoMemberships.push({ studioId: "stu_lumen", userId: "usr_viewer_only", role: "viewer" });
    expect((await createDraftProposal("usr_viewer_only", valid)).ok).toBe(false);
  });

  it("creates a private draft with a fresh reference and the currency on the project", async () => {
    const r = await createDraftProposal(demoStudioOwnerId, valid);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const project = demoProjects.find((p) => p.id === r.projectId);
    expect(project?.reference).toBe("CAD-2026-091");
    expect(project?.stage).toBe("proposal");
    expect(project?.contactUserIds).toEqual([]);
    expect(demoProposals.find((p) => p.projectId === r.projectId)?.status).toBe("draft");
  });

  it("will not send until a client contact exists", async () => {
    const project = demoProjects.find((p) => p.reference === "CAD-2026-091");
    if (!project) throw new Error("draft missing");
    const r = await sendProposal(demoStudioOwnerId, project.id);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("client contact");
  });

  it("sends once a contact exists, as version 1, and cannot send again", async () => {
    const project = demoProjects.find((p) => p.reference === "CAD-2026-091");
    if (!project) throw new Error("draft missing");
    project.contactUserIds.push(demoViewerId);
    expect((await sendProposal(demoStudioOwnerId, project.id)).ok).toBe(true);
    const sent = demoProposals.find((p) => p.projectId === project.id);
    expect(sent).toMatchObject({ status: "sent", version: 1 });
    expect((await sendProposal(demoStudioOwnerId, project.id)).ok).toBe(false);
  });
});
