import { describe, expect, it } from "vitest";
import { demoMemberships, demoStudioOwnerEmail, demoStudioOwnerId, demoViewerId } from "@/db/fixtures/cadence-demo";
import { listStudioClients, listStudioMembers, listStudioPayments } from "@/server/studio-reads";

describe("studio read models", () => {
  it("groups the studio's projects by client, and counts the active ones", async () => {
    const rows = await listStudioClients(demoStudioOwnerId);
    expect(rows).toEqual([
      {
        name: "Apex Holdings LLC",
        projectCount: 2,
        activeCount: 1,
        projects: [
          { id: "prj_cad_2026_089", reference: "CAD-2026-089", title: "Brand identity and website" },
          { id: "prj_cad_2026_090", reference: "CAD-2026-090", title: "Brand identity and website" },
        ],
      },
    ]);
  });

  it("gives the payments ledger to an owner and to nobody else in the studio", async () => {
    expect(await listStudioPayments(demoStudioOwnerId)).toEqual([]);
    demoMemberships.push({ studioId: "stu_lumen", userId: "usr_ledger_member", role: "member" });
    demoMemberships.push({ studioId: "stu_lumen", userId: "usr_ledger_viewer", role: "viewer" });
    expect(await listStudioPayments("usr_ledger_member")).toBeNull();
    expect(await listStudioPayments("usr_ledger_viewer")).toBeNull();
  });

  it("lists the team with roles, and shows contact details only where they are on file", async () => {
    expect(await listStudioMembers(demoStudioOwnerId)).toEqual([
      { role: "owner", contact: demoStudioOwnerEmail },
      { role: "member", contact: "Email not on file" },
      { role: "viewer", contact: "Email not on file" },
    ]);
  });

  it("gives a client contact none of the studio's lists", async () => {
    expect(await listStudioClients(demoViewerId)).toBeNull();
    expect(await listStudioMembers(demoViewerId)).toBeNull();
    expect(await listStudioPayments(demoViewerId)).toBeNull();
  });
});
