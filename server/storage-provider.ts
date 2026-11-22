import { env } from "@/lib/env";
import type { ObjectStorage } from "@/lib/services/storage";
import { S3CompatibleStorage } from "@/lib/services/storage-s3";

/**
 * The configured object store. Throws when storage is not configured, so a file action fails with a
 * clear message instead of an upload that silently goes nowhere.
 */
export function getStorage(): ObjectStorage {
  const { STORAGE_ENDPOINT_URL, STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY } = env;
  if (!STORAGE_ENDPOINT_URL || !STORAGE_BUCKET || !STORAGE_ACCESS_KEY_ID || !STORAGE_SECRET_ACCESS_KEY) {
    throw new Error("File storage is not configured.");
  }
  return new S3CompatibleStorage({
    endpoint: STORAGE_ENDPOINT_URL,
    bucket: STORAGE_BUCKET,
    region: STORAGE_REGION ?? "auto",
    accessKeyId: STORAGE_ACCESS_KEY_ID,
    secretAccessKey: STORAGE_SECRET_ACCESS_KEY,
  });
}
