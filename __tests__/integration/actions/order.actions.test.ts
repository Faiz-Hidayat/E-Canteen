import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock setup ─────────────────────────────────────────────

const mockAuth = vi.fn();
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
      mockTransaction(fn),
    menu: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    order: {
      create: (...args: unknown[]) => mockCreate(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ── Import actions (after mocks) ───────────────────────────

import {
  createOrder,
  updateOrderStatus,
  cancelOrder,
} from "@/actions/order.actions";

// ── Test Data ──────────────────────────────────────────────

const USER_SESSION = {
  user: { id: "user-1", role: "USER", tenantId: null },
};

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "ADMIN", tenantId: "tenant-1" },
};

const VALID_ORDER_INPUT = {
  tenantId: "tenant-1",
  items: [{ menuId: "menu-1", quantity: 2 }],
  pickupTime: "BREAK_1" as const,
  paymentMethod: "BALANCE" as const,
  notes: "Sambelnya banyakin",
};

// ── createOrder ────────────────────────────────────────────

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createOrder(VALID_ORDER_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Kamu harus login dulu ya.");
    }
  });

  it("returns error for invalid input", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);

    const result = await createOrder({
      ...VALID_ORDER_INPUT,
      items: [], // empty items
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Minimal harus ada 1 item pesanan.");
    }
  });

  it("succeeds with BALANCE payment when saldo is sufficient", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        menu: {
          findMany: vi.fn().mockResolvedValue([
            { id: "menu-1", price: 15000, name: "Nasi Goreng" },
          ]),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ balance: 100000 }),
          update: vi.fn(),
        },
        order: {
          create: vi
            .fn()
            .mockResolvedValue({ id: "order-new" }),
        },
      };
      return fn(tx);
    });

    const result = await createOrder(VALID_ORDER_INPUT);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orderId).toBe("order-new");
    }
  });

  it("fails when saldo is insufficient (BALANCE)", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        menu: {
          findMany: vi.fn().mockResolvedValue([
            { id: "menu-1", price: 15000, name: "Nasi Goreng" },
          ]),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ balance: 5000 }), // not enough
          update: vi.fn(),
        },
        order: { create: vi.fn() },
      };
      return fn(tx);
    });

    const result = await createOrder(VALID_ORDER_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("saldo kamu nggak cukup");
    }
  });

  it("fails when menu is unavailable", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        menu: {
          findMany: vi.fn().mockResolvedValue([]), // no matching menus
        },
        user: { findUnique: vi.fn(), update: vi.fn() },
        order: { create: vi.fn() },
      };
      return fn(tx);
    });

    const result = await createOrder(VALID_ORDER_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("tidak tersedia");
    }
  });

  it("succeeds with MIDTRANS payment (no balance check)", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        menu: {
          findMany: vi.fn().mockResolvedValue([
            { id: "menu-1", price: 15000, name: "Nasi Goreng" },
          ]),
        },
        user: { findUnique: vi.fn(), update: vi.fn() },
        order: {
          create: vi
            .fn()
            .mockResolvedValue({ id: "order-midtrans" }),
        },
      };
      return fn(tx);
    });

    const result = await createOrder({
      ...VALID_ORDER_INPUT,
      paymentMethod: "MIDTRANS",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orderId).toBe("order-midtrans");
    }
  });
});

// ── updateOrderStatus ──────────────────────────────────────

describe("updateOrderStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateOrderStatus({
      orderId: "order-1",
      status: "PREPARING",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Kamu harus login dulu ya.");
    }
  });

  it("returns error for non-admin user", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);

    const result = await updateOrderStatus({
      orderId: "order-1",
      status: "PREPARING",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Kamu tidak punya akses untuk ini.");
    }
  });

  it("returns error for admin without tenantId", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", tenantId: null },
    });

    const result = await updateOrderStatus({
      orderId: "order-1",
      status: "PREPARING",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Akun admin kamu belum terhubung ke stan."
      );
    }
  });

  it("returns error when order not found", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockFindFirst.mockResolvedValue(null);

    const result = await updateOrderStatus({
      orderId: "order-404",
      status: "PREPARING",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Pesanan tidak ditemukan.");
    }
  });

  it("returns error for invalid transition", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockFindFirst.mockResolvedValue({
      id: "order-1",
      status: "COMPLETED", // can't transition from COMPLETED
      payment_method: "BALANCE",
      user_id: "user-1",
      total_amount: 30000,
    });

    const result = await updateOrderStatus({
      orderId: "order-1",
      status: "PREPARING",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Tidak bisa mengubah status");
    }
  });

  it("succeeds for valid CONFIRMED → PREPARING transition", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockFindFirst.mockResolvedValue({
      id: "order-1",
      status: "CONFIRMED",
      payment_method: "BALANCE",
      user_id: "user-1",
      total_amount: 30000,
    });
    mockUpdate.mockResolvedValue({});

    const result = await updateOrderStatus({
      orderId: "order-1",
      status: "PREPARING",
    });
    expect(result.success).toBe(true);
  });

  it("succeeds for READY → COMPLETED", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockFindFirst.mockResolvedValue({
      id: "order-1",
      status: "READY",
      payment_method: "BALANCE",
      user_id: "user-1",
      total_amount: 30000,
    });
    mockUpdate.mockResolvedValue({});

    const result = await updateOrderStatus({
      orderId: "order-1",
      status: "COMPLETED",
    });
    expect(result.success).toBe(true);
  });

  it("handles CANCELLED with refund via $transaction", async () => {
    mockAuth.mockResolvedValue(ADMIN_SESSION);
    mockFindFirst.mockResolvedValue({
      id: "order-1",
      status: "CONFIRMED",
      payment_method: "BALANCE",
      user_id: "user-1",
      total_amount: 30000,
    });
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        order: { update: vi.fn() },
        user: { update: vi.fn() },
        notification: { create: vi.fn() },
      };
      return fn(tx);
    });

    const result = await updateOrderStatus({
      orderId: "order-1",
      status: "CANCELLED",
      cancellationReason: "Bahan habis",
    });
    expect(result.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });
});

// ── cancelOrder (User) ─────────────────────────────────────

describe("cancelOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await cancelOrder({ orderId: "order-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Kamu harus login dulu ya.");
    }
  });

  it("returns error when order not found", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockFindFirst.mockResolvedValue(null);

    const result = await cancelOrder({ orderId: "order-404" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Pesanan tidak ditemukan.");
    }
  });

  it("rejects cancelling PREPARING order", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockFindFirst.mockResolvedValue({
      id: "order-1",
      status: "PREPARING",
      payment_method: "BALANCE",
      total_amount: 30000,
      user_id: "user-1",
    });

    const result = await cancelOrder({ orderId: "order-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("sudah mulai diproses");
    }
  });

  it("rejects cancelling READY order", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockFindFirst.mockResolvedValue({
      id: "order-1",
      status: "READY",
      payment_method: "BALANCE",
      total_amount: 30000,
      user_id: "user-1",
    });

    const result = await cancelOrder({ orderId: "order-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("sudah siap diambil");
    }
  });

  it("cancels CONFIRMED BALANCE order with refund", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockFindFirst.mockResolvedValue({
      id: "order-1",
      status: "CONFIRMED",
      payment_method: "BALANCE",
      total_amount: 30000,
      user_id: "user-1",
    });
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        order: { update: vi.fn() },
        user: { update: vi.fn() },
      };
      return fn(tx);
    });

    const result = await cancelOrder({ orderId: "order-1" });
    expect(result.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("cancels PENDING MIDTRANS order without refund", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockFindFirst.mockResolvedValue({
      id: "order-1",
      status: "PENDING",
      payment_method: "MIDTRANS",
      total_amount: 30000,
      user_id: "user-1",
    });
    mockUpdate.mockResolvedValue({});

    const result = await cancelOrder({ orderId: "order-1" });
    expect(result.success).toBe(true);
    // No $transaction for PENDING MIDTRANS
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("cancels CONFIRMED MIDTRANS order with refund to balance", async () => {
    mockAuth.mockResolvedValue(USER_SESSION);
    mockFindFirst.mockResolvedValue({
      id: "order-1",
      status: "CONFIRMED",
      payment_method: "MIDTRANS",
      total_amount: 50000,
      user_id: "user-1",
    });
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        order: { update: vi.fn() },
        user: { update: vi.fn() },
      };
      return fn(tx);
    });

    const result = await cancelOrder({ orderId: "order-1" });
    expect(result.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });
});
