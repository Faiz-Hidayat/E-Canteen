import { describe, it, expect } from "vitest";
import { formatRupiah, getPickupLabel } from "@/lib/utils/format";

describe("formatRupiah", () => {
  it('formats 15000 as "Rp 15.000"', () => {
    expect(formatRupiah(15000)).toBe("Rp 15.000");
  });

  it('formats 0 as "Rp 0"', () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("formats large numbers correctly", () => {
    expect(formatRupiah(1000000)).toBe("Rp 1.000.000");
  });

  it("formats small numbers correctly", () => {
    expect(formatRupiah(500)).toBe("Rp 500");
  });

  it('formats 3000 as "Rp 3.000"', () => {
    expect(formatRupiah(3000)).toBe("Rp 3.000");
  });
});

describe("getPickupLabel", () => {
  it('returns "Istirahat 1" for BREAK_1', () => {
    expect(getPickupLabel("BREAK_1")).toBe("Istirahat 1");
  });

  it('returns "Istirahat 2" for BREAK_2', () => {
    expect(getPickupLabel("BREAK_2")).toBe("Istirahat 2");
  });

  it("returns the original string for unknown values", () => {
    expect(getPickupLabel("BREAK_3")).toBe("BREAK_3");
  });
});
