import { describe, expect, it } from "vitest";
import { demoStudioOwnerId, demoViewerId } from "@/db/fixtures/cadence-demo";
import { getStudioMembership, listStudioProjects } from "@/server/studio";

describe("studio access", () => {
  it("returns the owner's studio and role", async () => {
    expect(await getStudioMembership(demoStudioOwnerId)).toEqual({
      studioId: "stu_lumen",
      studioName: "Lumen Studio",
      role: "owner",
    });
  });

  it("gives a client contact no studio at all", async () => {
    expect(await getStudioMembership(demoViewerId)).toBeNull();
    expect(await listStudioProjects(demoViewerId)).toBeNull();
  });

  it("lists the studio's projects, and flags the one awaiting payment", async () => {
    const rows = await listStudioProjects(demoStudioOwnerId);
    expect(rows).not.toBeNull();
    expect(rows).toHaveLength(2);
    const active = rows?.find((r) => r.reference === "CAD-2026-089");
    expect(active?.awaitingPayment).toBe(true);
    expect(active?.remainingMinor).toBe(420000);
  });
});
