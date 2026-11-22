import { describe, expect, it } from "vitest";
import { demoStudioOwnerId } from "@/db/fixtures/cadence-demo";
import { inviteClient, previewInvitation } from "@/server/invitations";

describe("invitation preview", () => {
  it("shows the project's real reference, stage, currency, and milestones before sign-in", async () => {
    const r = await inviteClient(demoStudioOwnerId, "prj_cad_2026_090", "preview@example.com");
    if (!r.ok) throw new Error("invite failed");
    const p = await previewInvitation(r.token);
    expect(p?.reference).toBe("CAD-2026-090");
    expect(p?.currency).toBe("USD");
    expect(p?.stage).toBe("proposal");
    expect(p?.milestones).toHaveLength(3);
    expect(p?.milestones.reduce((a, m) => a + m.amountMinor, 0)).toBe(600000);
  });
});
