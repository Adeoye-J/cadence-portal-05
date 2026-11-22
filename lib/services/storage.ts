/**
 * Object storage interface. Files never pass through the app server: uploads and downloads use
 * presigned URLs issued here, and the server checks objects only through small reads.
 */
export type PresignMethod = "GET" | "PUT" | "HEAD" | "DELETE";

export interface ObjectStorage {
  presign(method: PresignMethod, key: string, expiresSec: number, query?: Record<string, string>): Promise<string>;
  /** Size of a stored object, or null when it does not exist. */
  head(key: string): Promise<{ size: number } | null>;
  /** The first `bytes` bytes, for content sniffing. Null when the object does not exist. */
  readHead(key: string, bytes: number): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
}
