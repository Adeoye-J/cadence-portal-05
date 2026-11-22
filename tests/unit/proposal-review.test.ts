import { describe, expect, it } from "vitest";
import { demoViewerId } from "@/db/fixtures/cadence-demo";
import { addProposalNote, listProposalNotes } from "@/server/proposal-notes";
import { buildReviewData } from "@/server/proposal-review";
import { documentDigest, getProposalView } from "@/server/proposals";
import { createMemoryStore } from "@/server/store/memory";
import { setStore } from "@/server/store/registry";

async function view() {
  const v = await getProposalView(demoViewerId, "prp_cad_2026_090_v4");
  if (!v) throw new Error("proposal not visible to the demo contact");
  return v;
}

describe("proposal review data", () => {
  it("builds the totals, schedule and stage from the real records", async () => {
    const d = buildReviewData({ viewerName: "Sofia Marin", view: await view() });
    expect(d.money.total).toBe("$6,000.00");
    expect(d.money.m1).toBe("$1,800.00 USD");
    expect(d.stageText).toBe("Stage 1 of 6: Proposal");
    expect(d.window.days).toBe(32);
    expect(d.window.range).toBe("18 Nov – 20 Dec");
    expect(d.milestones.map((m) => m.percent)).toEqual(["30.0", "40.0", "30.0"]);
    expect(d.milestones[0]?.statusLabel).toBe("Waiting on you");
  });

  it("lists the deliverables and their hours, with a fixed fee where no hours are set", async () => {
    const d = buildReviewData({ viewerName: "Sofia Marin", view: await view() });
    expect(d.proposal.deliverables.map((x) => x.hours)).toEqual([32, 60, 0]);
    expect(d.totalHours).toBe(92);
    expect(d.proposal.deliverables[0]?.items).toHaveLength(3);
  });

  it("gives a fingerprint that changes when the scope changes", async () => {
    const v = await view();
    const changed = {
      ...v.proposal,
      deliverables: (v.proposal.deliverables ?? []).map((x, i) => (i === 0 ? { ...x, title: "Changed" } : x)),
    };
    expect(documentDigest(v.project, changed)).not.toBe(documentDigest(v.project, v.proposal));
    expect(buildReviewData({ viewerName: "x", view: v }).proposal.digest).toHaveLength(64);
  });
});

describe("proposal notes", () => {
  it("keeps each note with its proposal", async () => {
    setStore(createMemoryStore());
    await addProposalNote({ proposalId: "prp_test_a", projectId: "prj_test", authorUserId: "usr_x", kind: "section", sectionRef: "Revision policy", body: "Please confirm the revision count." });
    expect(await listProposalNotes("prp_test_a")).toHaveLength(1);
    expect(await listProposalNotes("prp_other")).toHaveLength(0);
  });
});
