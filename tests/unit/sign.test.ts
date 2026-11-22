import { describe, expect, it } from "vitest";
import { demoProjects, demoProposals, demoViewerId } from "@/db/fixtures/cadence-demo";
import { signProposalSchema } from "@/lib/validation/sign";
import { documentDigest, getProposalView, signProposal } from "@/server/proposals";

const PROPOSAL_ID = "prp_cad_2026_090_v4";
const PROJECT_ID = "prj_cad_2026_090";

describe("signProposalSchema", () => {
  it("accepts a trimmed full name with the box ticked", () => {
    const r = signProposalSchema.safeParse({ proposalId: PROPOSAL_ID, typedName: "  Sofia Marin ", agreed: "on" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.typedName).toBe("Sofia Marin");
  });

  it("rejects a one-letter name", () => {
    const r = signProposalSchema.safeParse({ proposalId: PROPOSAL_ID, typedName: "S", agreed: "on" });
    expect(r.success).toBe(false);
  });

  it("rejects an unticked agreement box", () => {
    const r = signProposalSchema.safeParse({ proposalId: PROPOSAL_ID, typedName: "Sofia Marin", agreed: undefined });
    expect(r.success).toBe(false);
  });
});

describe("documentDigest", () => {
  it("gives the same digest for the same terms", () => {
    const project = demoProjects.find((p) => p.id === PROJECT_ID);
    const proposal = demoProposals.find((p) => p.id === PROPOSAL_ID);
    if (!project || !proposal) throw new Error("fixture missing");
    const a = documentDigest(project, proposal);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(documentDigest(project, proposal)).toBe(a);
  });
});

describe("signProposal", () => {
  it("refuses a viewer who is not a contact on the project", async () => {
    const r = await signProposal("usr_someone_else", PROPOSAL_ID, "Eve Attacker");
    expect(r.ok).toBe(false);
    expect(await getProposalView("usr_someone_else", PROPOSAL_ID)).toBeNull();
  });

  it("signs once, moves the project to Signed and makes milestone 1 payment due", async () => {
    const result = await signProposal(demoViewerId, PROPOSAL_ID, "Sofia Marin");
    expect(result.ok).toBe(true);
    const project = demoProjects.find((p) => p.id === PROJECT_ID);
    expect(project?.stage).toBe("signed");
    expect(project?.milestones[0]?.status).toBe("payment_due");
  });

  it("is idempotent for the same signer", async () => {
    const again = await signProposal(demoViewerId, PROPOSAL_ID, "Sofia Marin");
    expect(again.ok).toBe(true);
  });

  it("records the digest in the signature and exposes it to the signer", async () => {
    const view = await getProposalView(demoViewerId, PROPOSAL_ID);
    expect(view?.signature?.signerUserId).toBe(demoViewerId);
    expect(view?.signature?.documentSha256).toMatch(/^[0-9a-f]{64}$/);
  });
});
