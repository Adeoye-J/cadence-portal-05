import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/server/store/memory";
import { getStore, setStore } from "@/server/store/registry";
import type { SignatureRecord } from "@/server/store/types";

const SIG: SignatureRecord = {
  proposalId: "prp_1",
  signerUserId: "usr_a",
  typedName: "Sofia Marin",
  documentSha256: "abc",
  signedAt: "2026-11-19T09:00:00.000Z",
};

describe("store", () => {
  it("records one signature per proposal, even when two attempts race", async () => {
    setStore(createMemoryStore());
    const store = getStore();
    const results = await Promise.all([store.insertSignature(SIG), store.insertSignature({ ...SIG, signerUserId: "usr_b" })]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await store.getSignature("prp_1")).not.toBeNull();
  });

  it("gives a pending sign-up to one caller only", async () => {
    setStore(createMemoryStore());
    const store = getStore();
    await store.putPendingSignup({ email: "a@x.com", fullName: "A", studioName: "S", country: "US", currency: "USD", createdAt: SIG.signedAt });
    const [first, second] = await Promise.all([store.takePendingSignup("a@x.com"), store.takePendingSignup("a@x.com")]);
    expect([first, second].filter(Boolean)).toHaveLength(1);
  });

  it("keeps notes with their proposal", async () => {
    setStore(createMemoryStore());
    const store = getStore();
    await store.addNote({ id: "n1", proposalId: "prp_1", projectId: "prj_1", authorUserId: "usr_a", kind: "general", sectionRef: null, body: "Hello", createdAt: SIG.signedAt });
    expect(await store.listNotes("prp_1")).toHaveLength(1);
    expect(await store.listNotes("prp_2")).toHaveLength(0);
  });
});
