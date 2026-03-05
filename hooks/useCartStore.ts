"use client";

import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────

interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  tenantId: string;
  tenantName: string;
}

interface CartState {
  items: CartItem[];
  /** Pending item when a tenant mismatch is detected */
  pendingItem: Omit<CartItem, "quantity"> | null;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  /** Confirm switching tenant: clear cart and add the pending item */
  confirmTenantSwitch: () => void;
  /** Cancel the tenant-switch dialog */
  cancelTenantSwitch: () => void;
}

// ── Store ──────────────────────────────────────────────────

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  pendingItem: null,

  addItem: (item) => {
    const state = get();
    const currentTenantId = state.items[0]?.tenantId;

    // Tenant mismatch check
    if (currentTenantId && currentTenantId !== item.tenantId) {
      set({ pendingItem: item });
      return;
    }

    const existing = state.items.find((i) => i.menuId === item.menuId);
    if (existing) {
      set({
        items: state.items.map((i) =>
          i.menuId === item.menuId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({ items: [...state.items, { ...item, quantity: 1 }] });
    }
  },

  removeItem: (menuId) => {
    set({ items: get().items.filter((i) => i.menuId !== menuId) });
  },

  updateQuantity: (menuId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(menuId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.menuId === menuId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ items: [], pendingItem: null }),

  getTotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  getItemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),

  confirmTenantSwitch: () => {
    const pending = get().pendingItem;
    if (!pending) return;
    set({
      items: [{ ...pending, quantity: 1 }],
      pendingItem: null,
    });
  },

  cancelTenantSwitch: () => set({ pendingItem: null }),
}));

export type { CartItem };
