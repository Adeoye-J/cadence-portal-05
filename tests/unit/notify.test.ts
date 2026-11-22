import { describe, expect, it } from "vitest";
import { demoStudioOwnerEmail, demoViewerEmail } from "@/db/fixtures/cadence-demo";
import { notificationFor } from "@/lib/services/notification-templates";
import type { NewEvent } from "@/server/event-types";
import { planNotifications, recipientsFor } from "@/server/notify-core";

const PROJECT = "prj_cad_2026_090";
const APP = "https://portal.example.com";

function event(kind: NewEvent["kind"], n = 7): NewEvent {
  return {
    id: `evt_${n}`,
    projectId: PROJECT,
    kind,
    actor: "system",
    summary: "Milestone 1 payment settled",
    at: new Date().toISOString(),
    clientVisible: true,
  };
}

describe("notification templates", () => {
  it("sends nothing for studio-only kinds", async () => {
    const ctx = { projectTitle: "Brand", summary: "Draft created", link: APP, audience: "studio" as const };
    expect(notificationFor("proposal_drafted", ctx)).toBeNull();
    expect(notificationFor("invitation_sent", ctx)).toBeNull();
  });

  it("escapes the project title and includes the link", async () => {
    const m = notificationFor("payment_settled", {
      projectTitle: "<script>x</script>",
      summary: "Milestone 1 payment settled",
      link: `${APP}/projects/p`,
      audience: "client",
    });
    expect(m?.html).not.toContain("<script>");
    expect(m?.text).toContain(`${APP}/projects/p`);
  });
});

describe("recipients", () => {
  it("includes the client contact and the studio owner, once each", async () => {
    const got = await recipientsFor(PROJECT, ["client", "studio"]);
    expect(got).toContainEqual({ audience: "client", email: demoViewerEmail });
    expect(got).toContainEqual({ audience: "studio", email: demoStudioOwnerEmail });
    expect(got.length).toBe(2);
  });
});

describe("planNotifications", () => {
  it("queues one message per recipient, with the right link for each audience", async () => {
    const messages = await planNotifications(event("payment_settled"), APP);
    expect(messages).toHaveLength(2);
    const client = messages.find((m) => m.to === demoViewerEmail);
    const studio = messages.find((m) => m.to === demoStudioOwnerEmail);
    expect(client?.text).toContain(`${APP}/projects/${PROJECT}`);
    expect(studio?.text).toContain(`${APP}/studio/projects/${PROJECT}`);
  });

  it("builds dedupe keys from the event id and the address", async () => {
    const messages = await planNotifications(event("payment_settled", 42), APP);
    expect(messages.map((m) => m.dedupeKey).sort()).toEqual(
      [`evt_42:${demoStudioOwnerEmail}`, `evt_42:${demoViewerEmail}`].sort(),
    );
  });

  it("queues nothing for an event kind with no plan", async () => {
    expect(await planNotifications(event("proposal_drafted"), APP)).toEqual([]);
  });
});
