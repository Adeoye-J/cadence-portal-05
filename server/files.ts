import { randomUUID } from "node:crypto";
import { canWrite } from "@/lib/authz";
import type { ObjectStorage } from "@/lib/services/storage";
import { DELIVERABLE_TYPES, MAX_FILE_BYTES, safeFilename, sniffFamily } from "@/lib/validation/files";
import type { ProjectRecord } from "@/server/core/types";
import { buildEffects } from "@/server/effects";
import { getStudioMembership } from "@/server/studio";
import { getStore } from "@/server/store/registry";

/**
 * Deliverable files. The studio uploads straight to object storage with a short-lived signed link. A file row is
 * pending until the server has checked what was uploaded (size and the file's own first bytes), then ready.
 */

const UPLOAD_TTL_SEC = 15 * 60;
const DOWNLOAD_TTL_SEC = 5 * 60;

export type FileResult = { ok: true } | { ok: false; message: string };

function keyFor(projectId: string, position: number, fileId: string): string {
  return `projects/${projectId}/milestones/${position}/${fileId}`;
}

async function findProject(studioId: string, projectId: string): Promise<ProjectRecord | null> {
  const project = await getStore().getProject(projectId);
  return project && project.studioId === studioId ? project : null;
}

/** A project's contacts and its own studio's members may see its files. */
async function canSee(userId: string, project: ProjectRecord): Promise<boolean> {
  if (project.contactUserIds.includes(userId)) return true;
  const membership = await getStudioMembership(userId);
  return membership !== null && membership.studioId === project.studioId;
}

export type UploadIntent = { ok: true; fileId: string; url: string } | { ok: false; message: string };

/** Studio: starts an upload to a milestone in progress. Returns a link to upload to. */
export async function createUploadIntent(input: {
  userId: string;
  projectId: string;
  position: number;
  filename: string;
  contentType: string;
  size: number;
  storage: ObjectStorage;
}): Promise<UploadIntent> {
  const membership = await getStudioMembership(input.userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (!canWrite(membership.role)) return { ok: false, message: "Your role cannot add deliverables." };

  const project = await findProject(membership.studioId, input.projectId);
  const milestone = project?.milestones.find((m) => m.position === input.position);
  if (!project || !milestone) return { ok: false, message: "Milestone not found." };
  if (milestone.status !== "in_progress") {
    return { ok: false, message: "Deliverables can be added while a milestone is in progress." };
  }

  const type = DELIVERABLE_TYPES[input.contentType];
  if (!type) return { ok: false, message: "That file type is not accepted. Use PDF, PNG, JPEG, ZIP or an Office file." };
  if (!Number.isInteger(input.size) || input.size < 1 || input.size > MAX_FILE_BYTES) {
    return { ok: false, message: "The file must be between 1 byte and 50 MB." };
  }
  const filename = safeFilename(input.filename);
  if (!filename) return { ok: false, message: "Give the file a name with letters or numbers." };

  const fileId = randomUUID();
  const key = keyFor(input.projectId, input.position, fileId);
  await getStore().createFile({
    id: fileId,
    projectId: input.projectId,
    position: input.position,
    key,
    filename,
    contentType: input.contentType,
    size: input.size,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  const url = await input.storage.presign("PUT", key, UPLOAD_TTL_SEC);
  return { ok: true, fileId, url };
}

/** Studio: finishes an upload after checking what arrived. A bad upload is removed, never kept. */
export async function completeUpload(input: { userId: string; fileId: string; storage: ObjectStorage }): Promise<FileResult> {
  const membership = await getStudioMembership(input.userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (!canWrite(membership.role)) return { ok: false, message: "Your role cannot add deliverables." };

  const store = getStore();
  const found = await store.getFile(input.fileId);
  const record = found && found.status === "pending" ? found : null;
  const project = record ? await findProject(membership.studioId, record.projectId) : null;
  if (!record || !project) return { ok: false, message: "Upload not found." };

  const reject = async (message: string): Promise<FileResult> => {
    await input.storage.remove(record.key);
    await store.removeFile(record.id);
    return { ok: false, message };
  };

  const head = await input.storage.head(record.key);
  if (!head || head.size !== record.size) return reject("The upload did not finish. Try again.");
  const bytes = await input.storage.readHead(record.key, 16);
  const family = bytes ? sniffFamily(bytes) : null;
  if (family !== DELIVERABLE_TYPES[record.contentType]?.family) {
    return reject("The file does not match the type it was declared as.");
  }

  const effects = await buildEffects({
    projectId: record.projectId,
    kind: "file_added",
    actor: "studio",
    summary: `Deliverable added to milestone ${record.position}`,
  });
  if (!(await store.markFileReady(record.id, effects))) return { ok: false, message: "Upload not found." };
  return { ok: true };
}

/** Studio: removes a ready file. Files of an approved milestone stay, because the client has signed off on them. */
export async function deleteFile(input: {
  userId: string;
  projectId: string;
  fileId: string;
  storage: ObjectStorage;
}): Promise<FileResult> {
  const membership = await getStudioMembership(input.userId);
  if (!membership) return { ok: false, message: "Studio not found." };
  if (!canWrite(membership.role)) return { ok: false, message: "Your role cannot remove deliverables." };

  const store = getStore();
  const project = await findProject(membership.studioId, input.projectId);
  const found = await store.getFile(input.fileId);
  const record = found && found.projectId === input.projectId && found.status === "ready" ? found : null;
  if (!project || !record) return { ok: false, message: "File not found." };

  const milestone = project.milestones.find((m) => m.position === record.position);
  if (milestone?.status === "approved") return { ok: false, message: "An approved milestone's files cannot be removed." };

  await input.storage.remove(record.key);
  const effects = await buildEffects({
    projectId: record.projectId,
    kind: "file_removed",
    actor: "studio",
    summary: `Deliverable removed from milestone ${record.position}`,
  });
  await store.removeFile(record.id, effects);
  return { ok: true };
}

/** Removes uploads that were started and never finished, and their stored bytes. Returns how many. */
export async function sweepAbandonedUploads(storage: ObjectStorage, now: Date, maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
  const store = getStore();
  const stale = await store.listPendingFilesBefore(new Date(now.getTime() - maxAgeMs).toISOString());
  for (const record of stale) {
    await storage.remove(record.key);
    await store.removeFile(record.id);
  }
  return stale.length;
}

export type ReadyFile = { id: string; filename: string; size: number; contentType: string };

/** A milestone's ready files. The caller has already checked access to the project. */
export async function listMilestoneFiles(projectId: string, position: number): Promise<ReadyFile[]> {
  const files = await getStore().listReadyFiles(projectId, position);
  return files.map((f) => ({ id: f.id, filename: f.filename, size: f.size, contentType: f.contentType }));
}

export type DownloadResult = { ok: true; url: string } | { ok: false; message: string };

/** A short-lived download link for a ready file, for a contact on the project or a member of its studio. */
export async function downloadUrl(input: {
  userId: string;
  projectId: string;
  fileId: string;
  storage: ObjectStorage;
}): Promise<DownloadResult> {
  const store = getStore();
  const project = await store.getProject(input.projectId);
  if (!project || !(await canSee(input.userId, project))) return { ok: false, message: "File not found." };
  const found = await store.getFile(input.fileId);
  const record = found && found.projectId === input.projectId && found.status === "ready" ? found : null;
  if (!record) return { ok: false, message: "File not found." };
  const url = await input.storage.presign("GET", record.key, DOWNLOAD_TTL_SEC, {
    "response-content-disposition": `attachment; filename="${record.filename}"`,
  });
  return { ok: true, url };
}

/** The storage key for a file, for tests and for code that places bytes where a file's row says. */
export function keyOf(projectId: string, position: number, fileId: string): string {
  return keyFor(projectId, position, fileId);
}
