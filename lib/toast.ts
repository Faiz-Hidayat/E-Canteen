import { toast as sonnerToast } from "sonner";

/**
 * Playful toast notifications with emoji and Indonesian-style messaging.
 * Wraps sonner `toast` with consistent styling & personality.
 */
export const playfulToast = {
  success: (message: string) =>
    sonnerToast.success(message, {
      icon: "🎉",
      className:
        "!bg-emerald-50 !border-emerald-200 !text-emerald-800 !rounded-2xl !shadow-lg !shadow-emerald-100/50 !font-bold",
    }),

  error: (message: string) =>
    sonnerToast.error(message, {
      icon: "😵",
      className:
        "!bg-red-50 !border-red-200 !text-red-800 !rounded-2xl !shadow-lg !shadow-red-100/50 !font-bold",
    }),

  info: (message: string) =>
    sonnerToast.info(message, {
      icon: "💡",
      className:
        "!bg-blue-50 !border-blue-200 !text-blue-800 !rounded-2xl !shadow-lg !shadow-blue-100/50 !font-bold",
    }),

  warning: (message: string) =>
    sonnerToast.warning(message, {
      icon: "⚠️",
      className:
        "!bg-amber-50 !border-amber-200 !text-amber-800 !rounded-2xl !shadow-lg !shadow-amber-100/50 !font-bold",
    }),

  /** Cart-specific: item added */
  cartAdd: (itemName: string) =>
    sonnerToast.success(`${itemName} masuk keranjang! 🛒`, {
      icon: "✅",
      className:
        "!bg-orange-50 !border-orange-200 !text-orange-800 !rounded-2xl !shadow-lg !shadow-orange-100/50 !font-bold",
      duration: 2000,
    }),

  /** Payment pending notification */
  paymentPending: () =>
    sonnerToast.info("Menunggu pembayaran... ⏳", {
      icon: "🕐",
      className:
        "!bg-violet-50 !border-violet-200 !text-violet-800 !rounded-2xl !shadow-lg !shadow-violet-100/50 !font-bold",
      duration: 5000,
    }),

  /** Order created */
  orderCreated: () =>
    sonnerToast.success("Pesanan berhasil dibuat! Mantap! 🔥", {
      icon: "🎊",
      className:
        "!bg-emerald-50 !border-emerald-200 !text-emerald-800 !rounded-2xl !shadow-lg !shadow-emerald-100/50 !font-bold",
      duration: 4000,
    }),
} as const;
