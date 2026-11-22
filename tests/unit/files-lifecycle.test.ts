import { describe, expect, it } from "vitest";
import { demoProjects, demoStudioOwnerId, demoViewerId } from "@/db/fixtures/cadence-demo";
import { isCronAuthorised } from "@/lib/cron-auth";
import { MemoryStorage } from "@/lib/services/storage-memory";
import { listEvents } from "@/server/events";
import { completeUpload, createUploadIntent, deleteFile, keyOf, listMilestoneFiles, sweepAbandonedUploads } from "@/server/files";

const PROJECT = "prj_cad_2026_090";
const DAY = 24 * 60 * 60 * 1000;
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

function project() {
  const p = demoProjects.find((x) => x.id === PROJECT);
  if (!p) throw new Error("fixture missing");
  return p;
}

async function readyFile(storage: MemoryStorage, filename: string): Promise<string> {
  const intent = await createUploadIntent({
    userId: demoStudioOwnerId,
    projectId: PROJECT,
    position: 1,
    filename,
    contentType: "application/pdf",
    size: PDF.byteLength,
    storage,
  });
  if (!intent.ok) throw new Error(`intent failed: ${intent.message}`);
  storage.put(keyOf(PROJECT, 1, intent.fileId), PDF);
  const done = await completeUpload({ userId: demoStudioOwnerId, fileId: intent.fileId, storage });
  if (!done.ok) throw new Error(`complete failed: ${done.message}`);
  return intent.fileId;
}

describe("abandoned uploads", () => {
  it("removes an unconfirmed upload and its object once it is a day old, and keeps recent ones", async () => {
    project().milestones[0]!.status = "in_progress";
    const storage = new MemoryStorage();
    const intent = await createUploadIntent({
      userId: demoStudioOwnerId,
      projectId: PROJECT,
      position: 1,
      filename: "stale.pdf",
      contentType: "application/pdf",
      size: PDF.byteLength,
      storage,
    });
    if (!intent.ok) throw new Error("intent failed");
    storage.put(keyOf(PROJECT, 1, intent.fileId), PDF);

    expect(await sweepAbandonedUploads(storage, new Date(Date.now() + 60_000))).toBe(0);
    expect(storage.has(keyOf(PROJECT, 1, intent.fileId))).toBe(true);

    expect(await sweepAbandonedUploads(storage, new Date(Date.now() + 2 * DAY))).toBe(1);
    expect(storage.has(keyOf(PROJECT, 1, intent.fileId))).toBe(false);
  });
});

describe("removing a deliverable", () => {
  it("refuses a client contact and a stranger", async () => {
    const storage = new MemoryStorage();
    const id = await readyFile(storage, "a.pdf");
    expect((await deleteFile({ userId: demoViewerId, projectId: PROJECT, fileId: id, storage })).ok).toBe(false);
    expect((await deleteFile({ userId: "usr_stranger", projectId: PROJECT, fileId: id, storage })).ok).toBe(false);
  });

  it("removes a ready file, its object, and records a studio-only event", async () => {
    const storage = new MemoryStorage();
    const id = await readyFile(storage, "remove-me.pdf");
    const before = (await listMilestoneFiles(PROJECT, 1)).length;
    expect(await deleteFile({ userId: demoStudioOwnerId, projectId: PROJECT, fileId: id, storage })).toEqual({ ok: true });
    expect((await listMilestoneFiles(PROJECT, 1)).length).toBe(before - 1);
    expect(storage.has(keyOf(PROJECT, 1, id))).toBe(false);
    expect((await listEvents(PROJECT, "client")).map((e) => e.summary)).not.toContain("Deliverable removed from milestone 1");
    expect((await listEvents(PROJECT, "studio")).map((e) => e.summary)).toContain("Deliverable removed from milestone 1");
  });

  it("refuses to remove a file once its milestone is approved", async () => {
    const storage = new MemoryStorage();
    const id = await readyFile(storage, "locked.pdf");
    project().milestones[0]!.status = "approved";
    const r = await deleteFile({ userId: demoStudioOwnerId, projectId: PROJECT, fileId: id, storage });
    expect(r.ok).toBe(false);
    expect(storage.has(keyOf(PROJECT, 1, id))).toBe(true);
  });
});

describe("cron authorisation", () => {
  const SECRET = "abcdefghijklmnop";
  it("accepts the exact bearer secret only", async () => {
    expect(isCronAuthorised(`Bearer ${SECRET}`, SECRET)).toBe(true);
    expect(isCronAuthorised(`Bearer ${SECRET}x`, SECRET)).toBe(false);
    expect(isCronAuthorised(SECRET, SECRET)).toBe(false);
    expect(isCronAuthorised(null, SECRET)).toBe(false);
  });

  it("refuses everything when no secret is configured", async () => {
    expect(isCronAuthorised("Bearer ", undefined)).toBe(false);
    expect(isCronAuthorised("Bearer anything-at-all", undefined)).toBe(false);
  });
});
