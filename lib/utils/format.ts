/**
 * Format angka ke format Rupiah Indonesia.
 * @example formatRupiah(15000) → "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  if (amount === 0) return "Rp 0";
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/**
 * Label waktu pengambilan.
 * @example getPickupLabel("BREAK_1") → "Istirahat 1"
 */
export function getPickupLabel(pickupTime: string): string {
  const labels: Record<string, string> = {
    BREAK_1: "Istirahat 1",
    BREAK_2: "Istirahat 2",
  } as const;

  return labels[pickupTime] ?? pickupTime;
}

/**
 * Label status pesanan (Bahasa Indonesia).
 * @example getStatusLabel("PREPARING") → "Lagi Disiapin"
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Menunggu Pembayaran",
    CONFIRMED: "Pesanan Diterima",
    PREPARING: "Lagi Disiapin",
    READY: "Siap Diambil",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  } as const;

  return labels[status] ?? status;
}
