import { describe, expect, it } from "vitest";
import { buildSeedRows } from "@/db/seed/rows";

const rows = buildSeedRows();
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);
const unique = (xs: string[]) => new Set(xs).size === xs.length;

describe("seed rows", () => {
  it("gives every row in each table a unique id", () => {
    for (const table of [rows.users, rows.studios, rows.clients, rows.projects, rows.milestones, rows.proposals]) {
      expect(unique(ids(table))).toBe(true);
    }
  });

  it("points every foreign key at a row that exists", () => {
    const projectIds = new Set(ids(rows.projects));
    const userIds = new Set(ids(rows.users));
    const studioIds = new Set(ids(rows.studios));
    const clientIds = new Set(ids(rows.clients));
    for (const m of rows.milestones) expect(projectIds.has(m.projectId)).toBe(true);
    for (const c of rows.projectContacts) {
      expect(projectIds.has(c.projectId)).toBe(true);
      expect(userIds.has(c.userId)).toBe(true);
    }
    for (const m of rows.memberships) {
      expect(studioIds.has(m.studioId)).toBe(true);
      expect(userIds.has(m.userId)).toBe(true);
    }
    for (const p of rows.projects) {
      expect(studioIds.has(p.studioId)).toBe(true);
      expect(clientIds.has(p.clientId)).toBe(true);
    }
  });

  it("keeps amounts as positive whole minor units and milestone positions unique per project", () => {
    for (const m of rows.milestones) {
      expect(Number.isInteger(m.amountMinor)).toBe(true);
      expect(m.amountMinor).toBeGreaterThan(0);
    }
    const keys = rows.milestones.map((m) => `${m.projectId}:${m.position}`);
    expect(unique(keys)).toBe(true);
  });

  it("seeds the design's retainer: three milestones totalling 600000 minor units", () => {
    const total = rows.milestones.filter((m) => m.projectId === "prj_cad_2026_089").reduce((a, m) => a + m.amountMinor, 0);
    expect(total).toBe(600000);
  });
});
