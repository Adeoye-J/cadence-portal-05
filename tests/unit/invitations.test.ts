import { describe, expect, it } from "vitest";
import { demoProjects, demoStudioOwnerId, demoViewerEmail, demoViewerId } from "@/db/fixtures/cadence-demo";
import { safeNextPath } from "@/lib/safe-redirect";
import { escapeHtml, invitationEmail } from "@/lib/services/email-templates";
import { acceptInvitation, inviteClient, listInvitations, previewInvitation, revokeInvitation } from "@/server/invitations";

const PROJECT = "prj_cad_2026_090";
const DAY = 24 * 60 * 60 * 1000;

describe("inviteClient", () => {
  it("refuses a client contact and a project the studio does not own", async () => {
    expect((await inviteClient(demoViewerId, PROJECT, "x@example.com")).ok).toBe(false);
    expect((await inviteClient(demoStudioOwnerId, "prj_missing", "x@example.com")).ok).toBe(false);
  });

  it("normalises the address and records the invitation without exposing the token", async () => {
    const r = await inviteClient(demoStudioOwnerId, PROJECT, "  Sofia.Marin@Example.com ");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.email).toBe("sofia.marin@example.com");
    expect((await previewInvitation(r.token))?.email).toBe("sofia.marin@example.com");
    expect(JSON.stringify(await listInvitations(PROJECT))).not.toContain(r.token);
  });
});

describe("acceptInvitation", () => {
  it("refuses a signed-in user whose email differs from the invited address", async () => {
    const r = await inviteClient(demoStudioOwnerId, PROJECT, "someone.else@example.com");
    if (!r.ok) throw new Error("invite failed");
    expect(await acceptInvitation(r.token, { userId: demoViewerId, email: demoViewerEmail })).toEqual({ ok: false, reason: "email_mismatch" });
    expect(demoProjects.find((p) => p.id === PROJECT)?.contactUserIds).not.toContain("usr_other");
  });

  it("adds the matching viewer as a contact once, and the link stops working", async () => {
    const r = await inviteClient(demoStudioOwnerId, PROJECT, demoViewerEmail);
    if (!r.ok) throw new Error("invite failed");
    expect(await acceptInvitation(r.token, { userId: demoViewerId, email: demoViewerEmail })).toEqual({ ok: true });
    expect(demoProjects.find((p) => p.id === PROJECT)?.contactUserIds).toContain(demoViewerId);
    expect(await acceptInvitation(r.token, { userId: demoViewerId, email: demoViewerEmail })).toEqual({ ok: false, reason: "invalid" });
    expect(await previewInvitation(r.token)).toBeNull();
  });

  it("refuses an expired invitation", async () => {
    const past = new Date("2026-01-01T00:00:00Z");
    const r = await inviteClient(demoStudioOwnerId, PROJECT, "late@example.com", past);
    if (!r.ok) throw new Error("invite failed");
    expect(await previewInvitation(r.token, new Date(past.getTime() + 15 * DAY))).toBeNull();
    expect(await acceptInvitation(r.token, { userId: "usr_late", email: "late@example.com" }, new Date(past.getTime() + 15 * DAY))).toEqual({ ok: false, reason: "invalid" });
  });

  it("stops a revoked invitation working", async () => {
    const r = await inviteClient(demoStudioOwnerId, PROJECT, "revoked@example.com");
    if (!r.ok) throw new Error("invite failed");
    await revokeInvitation(r.invitationId);
    expect(await previewInvitation(r.token)).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("keeps same-origin paths and rejects anything that could leave the site", async () => {
    expect(safeNextPath("/invite/abc")).toBe("/invite/abc");
    expect(safeNextPath("//evil.example")).toBe("/projects");
    expect(safeNextPath("https://evil.example")).toBe("/projects");
    expect(safeNextPath("/\\evil.example")).toBe("/projects");
    expect(safeNextPath(undefined)).toBe("/projects");
  });
});

describe("invitation email", () => {
  it("escapes the project title and studio name in HTML", async () => {
    const e = invitationEmail({ url: "https://x.example/invite/t", projectTitle: "<b>Brand</b>", studioName: "A & B" });
    expect(e.html).not.toContain("<b>Brand</b>");
    expect(e.html).toContain("&lt;b&gt;Brand&lt;/b&gt;");
    expect(escapeHtml("&")).toBe("&amp;");
  });
});
