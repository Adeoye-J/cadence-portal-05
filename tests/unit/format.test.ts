import { describe, expect, it } from "vitest";
import { formatDate, formatMoney } from "@/lib/format";

describe("formatMoney", () => {
  it("formats USD minor units with two decimals", () => {
    expect(formatMoney(180000, "USD")).toBe("$1,800.00");
    expect(formatMoney(240000, "USD")).toBe("$2,400.00");
  });

  it("uses the naira symbol for NGN", () => {
    expect(formatMoney(5050, "NGN")).toBe("₦50.50");
  });

  it("keeps the sign for negative amounts", () => {
    expect(formatMoney(-100, "USD")).toBe("-$1.00");
  });
});

describe("formatDate", () => {
  it("formats ISO dates as DD MMM YYYY", () => {
    expect(formatDate("2026-11-14")).toBe("14 Nov 2026");
    expect(formatDate("2026-12-02")).toBe("02 Dec 2026");
  });

  it("rejects malformed input instead of guessing", () => {
    expect(() => formatDate("14/11/2026")).toThrow(RangeError);
  });
});
