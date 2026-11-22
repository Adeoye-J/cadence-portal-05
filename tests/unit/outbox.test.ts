import { describe, expect, it } from "vitest";
import { backoffMs, drain, errorCode, MAX_ATTEMPTS, MemoryOutbox, type Sender } from "@/server/outbox";

const T0 = new Date("2026-11-17T09:00:00Z");
const MIN = 60_000;
const msg = (key: string) => ({ dedupeKey: key, to: "a@example.com", subject: "s", text: "t", html: "<p>h</p>" });

function sender(fail: (to: string) => boolean, log: string[] = []): Sender {
  return {
    async send(m) {
      if (fail(m.to)) {
        const err = new Error(`provider refused ${m.to}`);
        err.name = "ProviderError";
        throw err;
      }
      log.push(m.to);
    },
  };
}

describe("outbox queue", () => {
  it("queues a dedupe key once", async () => {
    const box = new MemoryOutbox();
    expect(await box.enqueue(msg("evt-1:a"), T0)).toBe(true);
    expect(await box.enqueue(msg("evt-1:a"), T0)).toBe(false);
    expect(box.snapshot()).toHaveLength(1);
  });

  it("sends due messages and marks them sent, so a second drain sends nothing", async () => {
    const box = new MemoryOutbox();
    await box.enqueue(msg("evt-2:a"), T0);
    const sentTo: string[] = [];
    expect(await drain(box, sender(() => false, sentTo), T0)).toEqual({ sent: 1, retried: 0, dead: 0 });
    expect(await drain(box, sender(() => false, sentTo), T0)).toEqual({ sent: 0, retried: 0, dead: 0 });
    expect(sentTo).toEqual(["a@example.com"]);
  });

  it("retries a failed send after a growing wait, then gives up after the maximum attempts", async () => {
    const box = new MemoryOutbox();
    await box.enqueue(msg("evt-3:a"), T0);
    const failing = sender(() => true);

    expect(await drain(box, failing, T0)).toEqual({ sent: 0, retried: 1, dead: 0 });
    // Not due yet one minute later, due after the first two-minute wait.
    expect(await drain(box, failing, new Date(T0.getTime() + MIN))).toEqual({ sent: 0, retried: 0, dead: 0 });

    let now = T0.getTime();
    let deadTotal = 0;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      now += 2 * 60 * MIN;
      deadTotal += (await drain(box, failing, new Date(now))).dead;
    }
    expect(deadTotal).toBe(1);
    expect(box.snapshot()[0]?.status).toBe("dead");
  });

  it("keeps only the error name, never the message that may contain an address", async () => {
    const box = new MemoryOutbox();
    await box.enqueue(msg("evt-4:a"), T0);
    await drain(box, sender(() => true), T0);
    const code = box.snapshot()[0]?.lastErrorCode ?? "";
    expect(code).toBe("ProviderError");
    expect(code).not.toContain("@");
  });

  it("uses a safe fallback code for non-Error throws", () => {
    expect(errorCode("boom a@example.com")).toBe("SendError");
  });

  it("caps the backoff at one hour", () => {
    expect(backoffMs(1)).toBe(2 * MIN);
    expect(backoffMs(3)).toBe(8 * MIN);
    expect(backoffMs(20)).toBe(60 * MIN);
  });

  it("one failing message does not stop the rest of the batch", async () => {
    const box = new MemoryOutbox();
    await box.enqueue(msg("evt-5:bad"), T0);
    await box.enqueue({ ...msg("evt-5:good"), to: "good@example.com" }, T0);
    const sentTo: string[] = [];
    const result = await drain(box, sender((to) => to === "a@example.com", sentTo), T0);
    expect(result).toEqual({ sent: 1, retried: 1, dead: 0 });
    expect(sentTo).toEqual(["good@example.com"]);
  });
});
