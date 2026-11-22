import { describe, expect, it } from "vitest";
import { demoProjects, demoStudioOwnerId, demoViewerId } from "@/db/fixtures/cadence-demo";
import { nextStatus } from "@/lib/milestone-transitions";
import { approveMilestone, deliverMilestone, getClientMilestone, requestChanges } from "@/server/milestones";

const PROJECT = "prj_cad_2026_090";
const project = () => {
  const p = demoProjects.find((x) => x.id === PROJECT);
  if (!p) throw new Error("fixture missing");
  return p;
};

describe("nextStatus", () => {
  it("allows only the listed moves", () => {
    expect(nextStatus("in_progress", "deliver")).toBe("delivered");
    expect(nextStatus("delivered", "approve")).toBe("approved");
    expect(nextStatus("delivered", "request_changes")).toBe("in_progress");
    expect(nextStatus("upcoming", "deliver")).toBeNull();
    expect(nextStatus("approved", "approve")).toBeNull();
    expect(nextStatus("payment_due", "approve")).toBeNull();
  });
});

describe("milestone review loop on CAD-2026-090", () => {
  it("refuses to deliver a milestone that is not in progress", async () => {
    expect((await deliverMilestone(demoStudioOwnerId, PROJECT, 1)).ok).toBe(false);
  });

  it("refuses a delivery from a viewer role, and from a client contact", async () => {
    project().milestones[0]!.status = "in_progress";
    expect((await deliverMilestone(demoViewerId, PROJECT, 1)).ok).toBe(false);
  });

  it("delivers, then the client can request changes, which returns it to in progress", async () => {
    expect((await deliverMilestone(demoStudioOwnerId, PROJECT, 1)).ok).toBe(true);
    expect(project().milestones[0]!.status).toBe("delivered");
    expect((await requestChanges(demoViewerId, PROJECT, 1, "too short")).ok).toBe(true);
    expect(project().milestones[0]!.status).toBe("in_progress");
    const view = await getClientMilestone(demoViewerId, PROJECT, 1);
    expect(view?.changeRequests).toHaveLength(1);
  });

  it("approves a delivered milestone and makes the next payment due", async () => {
    await deliverMilestone(demoStudioOwnerId, PROJECT, 1);
    expect((await approveMilestone(demoViewerId, PROJECT, 1)).ok).toBe(true);
    expect(project().milestones[0]!.status).toBe("approved");
    expect(project().milestones[1]!.status).toBe("payment_due");
  });

  it("does not approve the same milestone twice", async () => {
    expect((await approveMilestone(demoViewerId, PROJECT, 1)).ok).toBe(false);
  });

  it("does not let a stranger approve or read the milestone", async () => {
    expect((await approveMilestone("usr_stranger", PROJECT, 2)).ok).toBe(false);
    expect(await getClientMilestone("usr_stranger", PROJECT, 2)).toBeNull();
  });
});
