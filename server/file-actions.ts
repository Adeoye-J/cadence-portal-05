"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/session";
import { completeUpload, createUploadIntent, deleteFile, downloadUrl } from "@/server/files";
import { getStorage } from "@/server/storage-provider";

export type UploadStart = { ok: true; fileId: string; url: string } | { ok: false; message: string };
export type UploadDone = { ok: true } | { ok: false; message: string };
export type DownloadStart = { ok: true; url: string } | { ok: false; message: string };

const SESSION_ENDED = "Your session has ended. Sign in again to continue.";
const NOT_CONFIGURED = "File storage is not set up yet. Ask the platform administrator.";

/** Studio: asks for an upload URL for one file on one milestone. */
export async function requestUploadAction(
  projectId: string,
  position: number,
  filename: string,
  contentType: string,
  size: number,
): Promise<UploadStart> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  let storage;
  try {
    storage = getStorage();
  } catch {
    return { ok: false, message: NOT_CONFIGURED };
  }
  return createUploadIntent({ userId: viewer.userId, projectId, position, filename, contentType, size, storage });
}

/** Studio: confirms an upload after the browser has sent the bytes. */
export async function completeUploadAction(projectId: string, fileId: string): Promise<UploadDone> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  let storage;
  try {
    storage = getStorage();
  } catch {
    return { ok: false, message: NOT_CONFIGURED };
  }
  const result = await completeUpload({ userId: viewer.userId, fileId, storage });
  if (result.ok) {
    revalidatePath(`/studio/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}`, "layout");
  }
  return result;
}

/** Client or studio: a short-lived link to download one ready file. */
export async function downloadLinkAction(projectId: string, fileId: string): Promise<DownloadStart> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  let storage;
  try {
    storage = getStorage();
  } catch {
    return { ok: false, message: NOT_CONFIGURED };
  }
  return downloadUrl({ userId: viewer.userId, projectId, fileId, storage });
}

/** Studio: removes a deliverable that has not yet been approved. */
export async function deleteFileAction(projectId: string, fileId: string): Promise<UploadDone> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  let storage;
  try {
    storage = getStorage();
  } catch {
    return { ok: false, message: NOT_CONFIGURED };
  }
  const result = await deleteFile({ userId: viewer.userId, projectId, fileId, storage });
  if (result.ok) {
    revalidatePath(`/studio/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}`, "layout");
  }
  return result;
}
