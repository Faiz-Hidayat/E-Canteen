import { describe, it, expect } from 'vitest';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  CancelOrderSchema,
  OrderItemSchema,
} from '@/lib/validations/order.schema';

// ── Helpers ────────────────────────────────────────────────

function validOrder() {
  return {
    tenantId: 'tenant-abc',
    items: [{ menuId: 'menu-1', quantity: 2 }],
    pickupTime: 'BREAK_1' as const,
    paymentMethod: 'BALANCE' as const,
    notes: '',
  };
}

// ── OrderItemSchema ────────────────────────────────────────

describe('OrderItemSchema', () => {
  it('accepts valid item', () => {
    const result = OrderItemSchema.safeParse({ menuId: 'm1', quantity: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects empty menuId', () => {
    const result = OrderItemSchema.safeParse({ menuId: '', quantity: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects quantity = 0', () => {
    const result = OrderItemSchema.safeParse({ menuId: 'm1', quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = OrderItemSchema.safeParse({ menuId: 'm1', quantity: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects quantity > 50', () => {
    const result = OrderItemSchema.safeParse({ menuId: 'm1', quantity: 51 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Maksimal 50 item per menu ya.');
    }
  });

  it('accepts quantity = 50 (boundary)', () => {
    const result = OrderItemSchema.safeParse({ menuId: 'm1', quantity: 50 });
    expect(result.success).toBe(true);
  });

  it('rejects float quantity', () => {
    const result = OrderItemSchema.safeParse({ menuId: 'm1', quantity: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects non-number quantity', () => {
    const result = OrderItemSchema.safeParse({ menuId: 'm1', quantity: '2' });
    expect(result.success).toBe(false);
  });
});

// ── CreateOrderSchema ──────────────────────────────────────

describe('CreateOrderSchema', () => {
  // ── Valid cases ──────────────────────────────────────────

  it('accepts valid order with BREAK_1 + BALANCE', () => {
    const result = CreateOrderSchema.safeParse(validOrder());
    expect(result.success).toBe(true);
  });

  it('accepts valid order with BREAK_2 + MIDTRANS', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      pickupTime: 'BREAK_2',
      paymentMethod: 'MIDTRANS',
    });
    expect(result.success).toBe(true);
  });

  it('accepts order with multiple items', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      items: [
        { menuId: 'm1', quantity: 1 },
        { menuId: 'm2', quantity: 3 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('defaults notes to empty string when omitted', () => {
    const { notes: _notes, ...noNotes } = validOrder();
    const result = CreateOrderSchema.safeParse(noNotes);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('');
    }
  });

  it('accepts notes with 200 chars (boundary)', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      notes: 'a'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  // ── Empty items ──────────────────────────────────────────

  it('rejects empty items array', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      items: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Minimal harus ada 1 item pesanan.');
    }
  });

  // ── tenantId ─────────────────────────────────────────────

  it('rejects empty tenantId', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      tenantId: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing tenantId', () => {
    const { tenantId: _tenantId, ...noTenant } = validOrder();
    const result = CreateOrderSchema.safeParse(noTenant);
    expect(result.success).toBe(false);
  });

  // ── pickupTime ───────────────────────────────────────────

  it('rejects invalid pickupTime', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      pickupTime: 'BREAK_3',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Pilih waktu pengambilan yang valid.');
    }
  });

  it('rejects missing pickupTime', () => {
    const { pickupTime: _pickupTime, ...noPickup } = validOrder();
    const result = CreateOrderSchema.safeParse(noPickup);
    expect(result.success).toBe(false);
  });

  // ── paymentMethod ────────────────────────────────────────

  it('rejects invalid paymentMethod', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      paymentMethod: 'CASH',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Pilih metode pembayaran yang valid.');
    }
  });

  // ── notes ────────────────────────────────────────────────

  it('rejects notes > 200 chars', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      notes: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Catatan maksimal 200 karakter.');
    }
  });

  // ── item validation inside order ─────────────────────────

  it('rejects item with quantity > 50 inside order', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      items: [{ menuId: 'm1', quantity: 51 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with missing menuId inside order', () => {
    const result = CreateOrderSchema.safeParse({
      ...validOrder(),
      items: [{ quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

// ── UpdateOrderStatusSchema ────────────────────────────────

describe('UpdateOrderStatusSchema', () => {
  it('accepts valid status update', () => {
    const result = UpdateOrderStatusSchema.safeParse({
      orderId: 'order-123',
      status: 'PREPARING',
    });
    expect(result.success).toBe(true);
  });

  it('accepts CANCELLED with cancellationReason', () => {
    const result = UpdateOrderStatusSchema.safeParse({
      orderId: 'order-123',
      status: 'CANCELLED',
      cancellationReason: 'Bahan habis',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty orderId', () => {
    const result = UpdateOrderStatusSchema.safeParse({
      orderId: '',
      status: 'PREPARING',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = UpdateOrderStatusSchema.safeParse({
      orderId: 'order-123',
      status: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid statuses', () => {
    for (const status of ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']) {
      const result = UpdateOrderStatusSchema.safeParse({
        orderId: 'order-123',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects cancellationReason > 200 chars', () => {
    const result = UpdateOrderStatusSchema.safeParse({
      orderId: 'order-123',
      status: 'CANCELLED',
      cancellationReason: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty cancellationReason when provided', () => {
    const result = UpdateOrderStatusSchema.safeParse({
      orderId: 'order-123',
      status: 'CANCELLED',
      cancellationReason: '',
    });
    expect(result.success).toBe(false);
  });
});

// ── CancelOrderSchema ──────────────────────────────────────

describe('CancelOrderSchema', () => {
  it('accepts valid orderId', () => {
    const result = CancelOrderSchema.safeParse({ orderId: 'order-123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty orderId', () => {
    const result = CancelOrderSchema.safeParse({ orderId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing orderId', () => {
    const result = CancelOrderSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
