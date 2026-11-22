import { describe, expect, it } from "vitest";
import { demoProjects, demoStudioOwnerId, demoViewerId } from "@/db/fixtures/cadence-demo";
import { listEvents } from "@/server/events";
import {
  deliverMilestone,
  getClientMilestone,
  listProjectChangeRequests,
  replyToChangeRequest,
  requestChanges,
} from "@/server/milestones";

const PROJECT = "prj_cad_2026_090";

function fixture() {
  const p = demoProjects.find((x) => x.id === PROJECT);
  if (!p) throw new Error("fixture missing");
  return p;
}

describe("studio reply to a change request", () => {
  it("sets up a change request on a delivered milestone", async () => {
    fixture().milestones[0]!.status = "in_progress";
    expect((await deliverMilestone(demoStudioOwnerId, PROJECT, 1)).ok).toBe(true);
    expect((await requestChanges(demoViewerId, PROJECT, 1, "Please make the logo larger.")).ok).toBe(true);
    expect((await listProjectChangeRequests(PROJECT)).length).toBe(1);
  });

  it("refuses a reply from the client, and from a stranger", async () => {
    const id = (await listProjectChangeRequests(PROJECT))[0]!.id;
    expect((await replyToChangeRequest(demoViewerId, PROJECT, id, "Done")).ok).toBe(false);
    expect((await replyToChangeRequest("usr_stranger", PROJECT, id, "Done")).ok).toBe(false);
  });

  it("lets the studio reply once, and shows the reply to the client", async () => {
    const id = (await listProjectChangeRequests(PROJECT))[0]!.id;
    expect((await replyToChangeRequest(demoStudioOwnerId, PROJECT, id, "Logo enlarged in v2.")).ok).toBe(true);
    const view = await getClientMilestone(demoViewerId, PROJECT, 1);
    expect(view?.changeRequests[0]?.reply?.body).toBe("Logo enlarged in v2.");
  });

  it("refuses a second reply to the same request", async () => {
    const id = (await listProjectChangeRequests(PROJECT))[0]!.id;
    const again = await replyToChangeRequest(demoStudioOwnerId, PROJECT, id, "Another reply");
    expect(again.ok).toBe(false);
  });

  it("records the reply in the client-visible activity trail", async () => {
    const summaries = (await listEvents(PROJECT, "client")).map((e) => e.summary);
    expect(summaries.some((s) => s.includes("Studio replied"))).toBe(true);
  });
});
