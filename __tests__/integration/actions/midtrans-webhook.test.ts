import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ── Mock prisma ────────────────────────────────────────────

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    processedWebhook: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ── Helpers ────────────────────────────────────────────────

const SERVER_KEY = "Mid-server-test123";

function makeSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string
): string {
  return crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + SERVER_KEY)
    .digest("hex");
}

function makeNotification(overrides: Record<string, string> = {}) {
  const orderId = overrides.order_id ?? "ORDER-testorder123-1709600000000";
  const statusCode = overrides.status_code ?? "200";
  const grossAmount = overrides.gross_amount ?? "28000.00";

  return {
    transaction_status: overrides.transaction_status ?? "settlement",
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: makeSignature(orderId, statusCode, grossAmount),
    fraud_status: overrides.fraud_status ?? "accept",
    payment_type: overrides.payment_type ?? "bank_transfer",
  };
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/webhooks/midtrans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ──────────────────────────────────────────────────

describe("Midtrans Webhook: /api/webhooks/midtrans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MIDTRANS_SERVER_KEY", SERVER_KEY);
  });

  it("rejects requests with invalid signature", async () => {
    const { POST } = await import(
      "@/app/api/webhooks/midtrans/route"
    );

    const notification = makeNotification();
    notification.signature_key = "invalid-signature";

    const response = await POST(makeRequest(notification) as never);
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error).toBe("Invalid signature");
  });

  it("ignores unknown order_id formats", async () => {
    const { POST } = await import(
      "@/app/api/webhooks/midtrans/route"
    );

    const orderId = "UNKNOWN-format-123";
    const notification = makeNotification({ order_id: orderId });

    const response = await POST(makeRequest(notification) as never);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ignored");
  });

  describe("ORDER payment", () => {
    it("updates order to CONFIRMED on settlement", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      mockFindUnique.mockResolvedValueOnce({
        id: "testorder123",
        status: "PENDING",
        payment_method: "MIDTRANS",
        user_id: "user1",
        total_amount: 28000,
      });
      mockUpdate.mockResolvedValueOnce({});

      const notification = makeNotification({
        transaction_status: "settlement",
      });

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "testorder123" },
        data: {
          status: "CONFIRMED",
          midtrans_transaction_id: notification.order_id,
          midtrans_payment_status: "settlement",
        },
      });
    });

    it("updates order to CONFIRMED on capture with accept fraud", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      mockFindUnique.mockResolvedValueOnce({
        id: "testorder123",
        status: "PENDING",
        payment_method: "MIDTRANS",
        user_id: "user1",
        total_amount: 28000,
      });
      mockUpdate.mockResolvedValueOnce({});

      const notification = makeNotification({
        transaction_status: "capture",
        fraud_status: "accept",
      });

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "testorder123" },
        data: {
          status: "CONFIRMED",
          midtrans_transaction_id: notification.order_id,
          midtrans_payment_status: "capture",
        },
      });
    });

    it("updates order to CANCELLED on deny", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      mockFindUnique.mockResolvedValueOnce({
        id: "testorder123",
        status: "PENDING",
        payment_method: "MIDTRANS",
        user_id: "user1",
        total_amount: 28000,
      });
      mockUpdate.mockResolvedValueOnce({});

      const notification = makeNotification({
        transaction_status: "deny",
      });

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "testorder123" },
        data: {
          status: "CANCELLED",
          midtrans_transaction_id: notification.order_id,
          midtrans_payment_status: "deny",
        },
      });
    });

    it("updates order to CANCELLED on cancel", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      mockFindUnique.mockResolvedValueOnce({
        id: "testorder123",
        status: "PENDING",
        payment_method: "MIDTRANS",
        user_id: "user1",
        total_amount: 28000,
      });
      mockUpdate.mockResolvedValueOnce({});

      const notification = makeNotification({
        transaction_status: "cancel",
      });

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "testorder123" },
        data: {
          status: "CANCELLED",
          midtrans_transaction_id: notification.order_id,
          midtrans_payment_status: "cancel",
        },
      });
    });

    it("updates order to CANCELLED on expire", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      mockFindUnique.mockResolvedValueOnce({
        id: "testorder123",
        status: "PENDING",
        payment_method: "MIDTRANS",
        user_id: "user1",
        total_amount: 28000,
      });
      mockUpdate.mockResolvedValueOnce({});

      const notification = makeNotification({
        transaction_status: "expire",
      });

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "testorder123" },
        data: {
          status: "CANCELLED",
          midtrans_transaction_id: notification.order_id,
          midtrans_payment_status: "expire",
        },
      });
    });

    it("skips non-MIDTRANS payment orders", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      mockFindUnique.mockResolvedValueOnce({
        id: "testorder123",
        status: "PENDING",
        payment_method: "BALANCE",
        user_id: "user1",
        total_amount: 28000,
      });

      const notification = makeNotification();

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("updates midtrans_payment_status for already processed orders", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      mockFindUnique.mockResolvedValueOnce({
        id: "testorder123",
        status: "PREPARING",
        payment_method: "MIDTRANS",
        user_id: "user1",
        total_amount: 28000,
      });
      mockUpdate.mockResolvedValueOnce({});

      const notification = makeNotification();

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);

      // Should still update midtrans_payment_status for tracking
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "testorder123" },
        data: {
          midtrans_payment_status: "settlement",
        },
      });
    });

    it("handles non-existent order gracefully", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      mockFindUnique.mockResolvedValueOnce(null);

      const notification = makeNotification();

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("TOPUP payment", () => {
    it("increments user balance on settlement", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      const orderId = "TOPUP-user123-1709600000000";
      const grossAmount = "50000.00";

      const txUpdate = vi.fn();
      const txCreate = vi.fn();

      // Mock for $transaction — simulate the tx proxy with all models
      mockTransaction.mockImplementationOnce(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            processedWebhook: {
              findUnique: vi.fn().mockResolvedValueOnce(null), // not yet processed
              create: txCreate,
            },
            user: {
              findUnique: vi.fn().mockResolvedValueOnce({ id: "user123" }),
              update: txUpdate,
            },
            notification: {
              create: vi.fn(),
            },
          };
          return fn(tx);
        }
      );

      const notification = makeNotification({
        order_id: orderId,
        gross_amount: grossAmount,
      });

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);

      // Should increment balance
      expect(txUpdate).toHaveBeenCalledWith({
        where: { id: "user123" },
        data: { balance: { increment: 50000 } },
      });

      // Should mark as processed with amount
      expect(txCreate).toHaveBeenCalledWith({
        data: {
          midtrans_order_id: orderId,
          type: "TOPUP",
          amount: 50000,
        },
      });
    });

    it("skips already processed top-up (idempotency)", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      const orderId = "TOPUP-user123-1709600000000";
      const grossAmount = "50000.00";

      const txUpdate = vi.fn();

      mockTransaction.mockImplementationOnce(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            processedWebhook: {
              findUnique: vi.fn().mockResolvedValueOnce({
                midtrans_order_id: orderId,
                type: "TOPUP",
                amount: 50000,
              }), // already processed
            },
            user: {
              findUnique: vi.fn(),
              update: txUpdate,
            },
            notification: {
              create: vi.fn(),
            },
          };
          return fn(tx);
        }
      );

      const notification = makeNotification({
        order_id: orderId,
        gross_amount: grossAmount,
      });

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);

      // Should NOT increment balance (idempotent skip)
      expect(txUpdate).not.toHaveBeenCalled();
    });

    it("does nothing on failed top-up", async () => {
      const { POST } = await import(
        "@/app/api/webhooks/midtrans/route"
      );

      const orderId = "TOPUP-user123-1709600000000";

      const notification = makeNotification({
        order_id: orderId,
        transaction_status: "expire",
      });

      const response = await POST(makeRequest(notification) as never);
      expect(response.status).toBe(200);

      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
