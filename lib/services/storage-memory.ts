import type { ObjectStorage, PresignMethod } from "@/lib/services/storage";

/**
 * In-memory object storage for tests. `put` stands in for the browser's upload to a presigned URL.
 * The URLs it returns are fake, so nothing here can reach the network.
 */
export class MemoryStorage implements ObjectStorage {
  private readonly objects = new Map<string, Uint8Array>();

  async presign(method: PresignMethod, key: string, expiresSec: number): Promise<string> {
    return `memory://${method}/${encodeURIComponent(key)}?expires=${expiresSec}`;
  }

  async head(key: string): Promise<{ size: number } | null> {
    const object = this.objects.get(key);
    return object ? { size: object.byteLength } : null;
  }

  async readHead(key: string, bytes: number): Promise<Uint8Array | null> {
    const object = this.objects.get(key);
    return object ? object.slice(0, bytes) : null;
  }

  async remove(key: string): Promise<void> {
    this.objects.delete(key);
  }

  /** Test helper: the bytes a browser would have uploaded. */
  put(key: string, bytes: Uint8Array): void {
    this.objects.set(key, bytes);
  }

  has(key: string): boolean {
    return this.objects.has(key);
  }
}
