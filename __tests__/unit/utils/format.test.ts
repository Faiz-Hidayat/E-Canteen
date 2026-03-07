import { describe, it, expect } from "vitest";
import {
  formatRupiah,
  getPickupLabel,
  getStatusLabel,
} from "@/lib/utils/format";

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

  it("formats negative numbers", () => {
    expect(formatRupiah(-5000)).toBe("Rp -5.000");
  });

  it("formats very large numbers", () => {
    expect(formatRupiah(10000000)).toBe("Rp 10.000.000");
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

  it("returns empty string for empty input", () => {
    expect(getPickupLabel("")).toBe("");
  });
});

describe("getStatusLabel", () => {
  it('returns "Menunggu Pembayaran" for PENDING', () => {
    expect(getStatusLabel("PENDING")).toBe("Menunggu Pembayaran");
  });

  it('returns "Pesanan Diterima" for CONFIRMED', () => {
    expect(getStatusLabel("CONFIRMED")).toBe("Pesanan Diterima");
  });

  it('returns "Lagi Disiapin" for PREPARING', () => {
    expect(getStatusLabel("PREPARING")).toBe("Lagi Disiapin");
  });

  it('returns "Siap Diambil" for READY', () => {
    expect(getStatusLabel("READY")).toBe("Siap Diambil");
  });

  it('returns "Selesai" for COMPLETED', () => {
    expect(getStatusLabel("COMPLETED")).toBe("Selesai");
  });

  it('returns "Dibatalkan" for CANCELLED', () => {
    expect(getStatusLabel("CANCELLED")).toBe("Dibatalkan");
  });

  it("returns raw string for unknown status", () => {
    expect(getStatusLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});
