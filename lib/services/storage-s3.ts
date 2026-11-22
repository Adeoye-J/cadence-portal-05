import { presignUrl } from "@/lib/services/sigv4";
import type { ObjectStorage, PresignMethod } from "@/lib/services/storage";

export type S3Config = {
  /** Full origin, for example "https://account.r2.cloudflarestorage.com" or "http://localhost:9000". */
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

/**
 * S3-compatible storage (Cloudflare R2, MinIO, AWS S3) over path-style URLs.
 * Head, read and delete run as presigned requests. Only the GET range header is sent unsigned.
 * Unverified against a live bucket (docs/verification.md).
 */
export class S3CompatibleStorage implements ObjectStorage {
  private readonly origin: URL;

  constructor(private readonly config: S3Config) {
    this.origin = new URL(config.endpoint);
  }

  private presignFor(method: PresignMethod, key: string, expiresSec: number, query?: Record<string, string>): string {
    return presignUrl({
      method,
      origin: this.origin.origin,
      host: this.origin.host,
      path: `/${this.config.bucket}/${key}`,
      region: this.config.region,
      service: "s3",
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      expiresSec,
      now: new Date(),
      query,
    });
  }

  async presign(method: PresignMethod, key: string, expiresSec: number, query?: Record<string, string>): Promise<string> {
    return this.presignFor(method, key, expiresSec, query);
  }

  async head(key: string): Promise<{ size: number } | null> {
    const res = await fetch(this.presignFor("HEAD", key, 60), { method: "HEAD" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`storage HEAD failed with HTTP ${res.status}`);
    return { size: Number(res.headers.get("content-length") ?? 0) };
  }

  async readHead(key: string, bytes: number): Promise<Uint8Array | null> {
    const res = await fetch(this.presignFor("GET", key, 60), { headers: { Range: `bytes=0-${bytes - 1}` } });
    if (res.status === 404) return null;
    if (!res.ok && res.status !== 206) throw new Error(`storage GET failed with HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  }

  async remove(key: string): Promise<void> {
    const res = await fetch(this.presignFor("DELETE", key, 60), { method: "DELETE" });
    if (!res.ok && res.status !== 404) throw new Error(`storage DELETE failed with HTTP ${res.status}`);
  }
}
