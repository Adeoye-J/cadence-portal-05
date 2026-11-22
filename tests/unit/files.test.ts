import { describe, expect, it } from "vitest";
import { demoProjects, demoStudioOwnerId, demoViewerId } from "@/db/fixtures/cadence-demo";
import { MemoryStorage } from "@/lib/services/storage-memory";
import { safeFilename, sniffFamily } from "@/lib/validation/files";
import { listEvents } from "@/server/events";
import { completeUpload, createUploadIntent, downloadUrl, keyOf, listMilestoneFiles } from "@/server/files";

const PROJECT = "prj_cad_2026_090";
const PDF_TYPE = "application/pdf";
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0, 0, 0, 0, 0, 0, 0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);

function project() {
  const p = demoProjects.find((x) => x.id === PROJECT);
  if (!p) throw new Error("fixture missing");
  return p;
}

describe("file signatures and names", () => {
  it("recognises the accepted families and nothing else", async () => {
    expect(sniffFamily(PDF)).toBe("pdf");
    expect(sniffFamily(PNG)).toBe("png");
    expect(sniffFamily(new Uint8Array([0x00, 0x01]))).toBeNull();
    expect(sniffFamily(new Uint8Array())).toBeNull();
  });

  it("strips path parts and unsafe characters from filenames", async () => {
    expect(safeFilename("../../etc/passwd")).toBe("passwd");
    expect(safeFilename("Final <script>.pdf")).toBe("Final _script_.pdf");
    expect(safeFilename("***")).toBeNull();
  });
});

describe("deliverable uploads on CAD-2026-090", () => {
  it("refuses an upload to a milestone that is not in progress", async () => {
    const r = await createUploadIntent({
      userId: demoStudioOwnerId,
      projectId: PROJECT,
      position: 1,
      filename: "brand.pdf",
      contentType: PDF_TYPE,
      size: 16,
      storage: new MemoryStorage(),
    });
    expect(r.ok).toBe(false);
  });

  it("refuses an unknown type, an oversize file and a nameless file", async () => {
    project().milestones[0]!.status = "in_progress";
    const base = { userId: demoStudioOwnerId, projectId: PROJECT, position: 1, storage: new MemoryStorage() };
    expect((await createUploadIntent({ ...base, filename: "x.html", contentType: "text/html", size: 10 })).ok).toBe(false);
    expect((await createUploadIntent({ ...base, filename: "x.pdf", contentType: PDF_TYPE, size: 60 * 1024 * 1024 })).ok).toBe(false);
    expect((await createUploadIntent({ ...base, filename: "***", contentType: PDF_TYPE, size: 10 })).ok).toBe(false);
  });

  it("refuses a client contact and a stranger", async () => {
    const base = { projectId: PROJECT, position: 1, filename: "x.pdf", contentType: PDF_TYPE, size: 16, storage: new MemoryStorage() };
    expect((await createUploadIntent({ ...base, userId: demoViewerId })).ok).toBe(false);
    expect((await createUploadIntent({ ...base, userId: "usr_stranger" })).ok).toBe(false);
  });

  it("keeps a file pending until its bytes are confirmed, then makes it a deliverable", async () => {
    const storage = new MemoryStorage();
    const intent = await createUploadIntent({
      userId: demoStudioOwnerId,
      projectId: PROJECT,
      position: 1,
      filename: "brand guide.pdf",
      contentType: PDF_TYPE,
      size: PDF.byteLength,
      storage,
    });
    expect(intent.ok).toBe(true);
    if (!intent.ok) return;
    expect(await listMilestoneFiles(PROJECT, 1)).toEqual([]);

    storage.put(keyOf(PROJECT, 1, intent.fileId), PDF);
    expect(await completeUpload({ userId: demoStudioOwnerId, fileId: intent.fileId, storage })).toEqual({ ok: true });
    expect(await listMilestoneFiles(PROJECT, 1)).toEqual([
      { id: intent.fileId, filename: "brand guide.pdf", size: PDF.byteLength, contentType: PDF_TYPE },
    ]);
    expect((await listEvents(PROJECT, "client")).map((e) => e.summary)).toContain("Deliverable added to milestone 1");
  });

  it("removes an upload whose bytes do not match its declared type", async () => {
    const storage = new MemoryStorage();
    const intent = await createUploadIntent({
      userId: demoStudioOwnerId,
      projectId: PROJECT,
      position: 1,
      filename: "liar.pdf",
      contentType: PDF_TYPE,
      size: PNG.byteLength,
      storage,
    });
    if (!intent.ok) throw new Error("intent should succeed");
    storage.put(keyOf(PROJECT, 1, intent.fileId), PNG);
    const r = await completeUpload({ userId: demoStudioOwnerId, fileId: intent.fileId, storage });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("does not match");
    expect(storage.has(keyOf(PROJECT, 1, intent.fileId))).toBe(false);
    expect((await listMilestoneFiles(PROJECT, 1)).map((f) => f.id)).not.toContain(intent.fileId);
  });

  it("rejects an upload whose stored size differs from the declared size", async () => {
    const storage = new MemoryStorage();
    const intent = await createUploadIntent({
      userId: demoStudioOwnerId,
      projectId: PROJECT,
      position: 1,
      filename: "short.pdf",
      contentType: PDF_TYPE,
      size: 16,
      storage,
    });
    if (!intent.ok) throw new Error("intent should succeed");
    storage.put(keyOf(PROJECT, 1, intent.fileId), new Uint8Array(32).fill(0x25));
    const r = await completeUpload({ userId: demoStudioOwnerId, fileId: intent.fileId, storage });
    expect(r.ok).toBe(false);
  });
});

describe("downloads", () => {
  it("gives a short-lived forced-download link to a contact and to the studio, not to a stranger", async () => {
    const storage = new MemoryStorage();
    const intent = await createUploadIntent({
      userId: demoStudioOwnerId,
      projectId: PROJECT,
      position: 1,
      filename: "final.pdf",
      contentType: PDF_TYPE,
      size: PDF.byteLength,
      storage,
    });
    if (!intent.ok) throw new Error("intent should succeed");
    storage.put(keyOf(PROJECT, 1, intent.fileId), PDF);
    await completeUpload({ userId: demoStudioOwnerId, fileId: intent.fileId, storage });

    const client = await downloadUrl({ userId: demoViewerId, projectId: PROJECT, fileId: intent.fileId, storage });
    const studio = await downloadUrl({ userId: demoStudioOwnerId, projectId: PROJECT, fileId: intent.fileId, storage });
    const stranger = await downloadUrl({ userId: "usr_stranger", projectId: PROJECT, fileId: intent.fileId, storage });

    expect(client.ok).toBe(true);
    expect(studio.ok).toBe(true);
    expect(stranger.ok).toBe(false);
    if (client.ok) expect(client.url).toMatch(/^memory:\/\/GET\//);
  });
});
