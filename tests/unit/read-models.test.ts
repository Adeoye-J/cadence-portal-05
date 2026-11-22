import { describe, expect, it } from "vitest";
import { demoMemberships, demoStudioOwnerEmail, demoStudioOwnerId, demoViewerId } from "@/db/fixtures/cadence-demo";
import { buildEffects } from "@/server/effects";
import { getStore } from "@/server/store/registry";
import { requestAccountDeletion, accountDeletionStatus } from "@/server/account";
import { buildClientDataExport, getClientFiles, listViewerNotifications, listViewerPayments } from "@/server/client-reads";
import { getClientChangeRequests } from "@/server/milestones";

const NOW = new Date("2026-11-18T09:00:00Z");

describe("client read models", () => {
  it("shows a client only their own projects, and nothing for a stranger", async () => {
    expect((await getClientFiles(demoViewerId, "prj_cad_2026_090"))?.project.reference).toBe("CAD-2026-090");
    expect(await getClientFiles("usr_stranger", "prj_cad_2026_090")).toBeNull();
  });

  it("returns change requests only to a contact", async () => {
    expect(await getClientChangeRequests("usr_stranger", "prj_cad_2026_090")).toBeNull();
    expect(await getClientChangeRequests(demoViewerId, "prj_cad_2026_090")).toEqual([]);
  });

  it("starts with no payments and no notifications, and shows events once they exist", async () => {
    expect(await listViewerPayments(demoViewerId)).toEqual([]);
    expect(await listViewerNotifications(demoViewerId)).toEqual([]);
    await getStore().appendEffects(await buildEffects({ projectId: "prj_cad_2026_090", kind: "proposal_sent", actor: "studio", summary: "Proposal version 1 sent" }));
    expect((await listViewerNotifications(demoViewerId)).map((n) => n.summary)).toContain("Proposal version 1 sent");
  });

  it("exports the viewer's own data and nothing about the studio's staff", async () => {
    const doc = await buildClientDataExport({ userId: demoViewerId, email: "sofia.marin@example.com", name: "Sofia" }, NOW);
    expect(doc.projects.length).toBe(2);
    expect(doc.generatedAt).toBe(NOW.toISOString());
    expect(JSON.stringify(doc)).not.toContain(demoStudioOwnerEmail);
    expect(JSON.stringify(doc)).not.toContain(demoStudioOwnerId);
  });
});

describe("account deletion requests", () => {
  it("records a request once, and reports the repeat without creating another", async () => {
    const first = await requestAccountDeletion("usr_delete_me", NOW);
    expect(first.alreadyRequested).toBe(false);
    const again = await requestAccountDeletion("usr_delete_me", new Date("2026-11-19T09:00:00Z"));
    expect(again.alreadyRequested).toBe(true);
    expect(again.requestedAt).toBe(first.requestedAt);
    expect(await accountDeletionStatus("usr_delete_me")).toBe(first.requestedAt);
    expect(await accountDeletionStatus("usr_nobody")).toBeNull();
  });
});

describe("studio membership fixtures", () => {
  it("has exactly one owner for the seeded studio", async () => {
    expect(demoMemberships.filter((m) => m.role === "owner")).toHaveLength(1);
  });
});
