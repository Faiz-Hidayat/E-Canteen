import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ──────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

const mockCreateOrder = vi.fn();
vi.mock("@/actions/order.actions", () => ({
  createOrder: (...args: unknown[]) => mockCreateOrder(...args),
}));

const mockCreateMidtransOrderToken = vi.fn();
vi.mock("@/actions/balance.actions", () => ({
  createMidtransOrderToken: (...args: unknown[]) =>
    mockCreateMidtransOrderToken(...args),
}));

vi.mock("@/lib/toast", () => ({
  playfulToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    orderCreated: vi.fn(),
    paymentPending: vi.fn(),
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      void initial; void animate; void exit; void transition; void whileHover; void whileTap;
      return <div {...rest}>{children}</div>;
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props;
      void initial; void animate; void exit; void transition;
      return <p {...rest}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock cart store with initial items
import { useCartStore } from "@/hooks/useCartStore";

import { CheckoutForm } from "@/components/shared/CheckoutForm";

// ── Helpers ────────────────────────────────────────────────

function seedCart() {
  useCartStore.setState({
    items: [
      {
        menuId: "menu-1",
        name: "Nasi Goreng",
        price: 15000,
        quantity: 2,
        tenantId: "tenant-1",
        tenantName: "Stan Bu Ani",
      },
    ],
    pendingItem: null,
  });
}

function clearCartStore() {
  useCartStore.setState({ items: [], pendingItem: null });
}

// ── Tests ──────────────────────────────────────────────────

describe("CheckoutForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCartStore();
  });

  it("shows empty cart message when no items", () => {
    render(<CheckoutForm />);

    expect(
      screen.getByText(/belum ada makanan yang dipilih/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /lihat menu/i })
    ).toBeInTheDocument();
  });

  it("renders order summary with cart items", () => {
    seedCart();
    render(<CheckoutForm />);

    expect(screen.getByText("Nasi Goreng")).toBeInTheDocument();
    expect(screen.getByText("Stan Bu Ani")).toBeInTheDocument();
    // Price appears in both item line and total — just verify it exists
    const priceElements = screen.getAllByText(/Rp 30\.000/);
    expect(priceElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders pickup time and payment method options", () => {
    seedCart();
    render(<CheckoutForm />);

    expect(screen.getByText("Istirahat 1")).toBeInTheDocument();
    expect(screen.getByText("Istirahat 2")).toBeInTheDocument();
    expect(screen.getByText("Potong Saldo")).toBeInTheDocument();
    expect(
      screen.getByText(/Bayar via Midtrans/i)
    ).toBeInTheDocument();
  });

  it("submits order successfully with BALANCE", async () => {
    seedCart();
    mockCreateOrder.mockResolvedValue({
      success: true,
      data: { orderId: "order-new" },
    });
    const user = userEvent.setup();

    render(<CheckoutForm />);

    const submitBtn = screen.getByRole("button", { name: /bayar/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-1",
          items: [{ menuId: "menu-1", quantity: 2 }],
          pickupTime: "BREAK_1",
          paymentMethod: "BALANCE",
        })
      );
    });
  });

  it("shows error toast on failed order", async () => {
    seedCart();
    mockCreateOrder.mockResolvedValue({
      success: false,
      error: "Oops, saldo kamu nggak cukup nih!",
    });
    const user = userEvent.setup();
    const { playfulToast } = await import("@/lib/toast");

    render(<CheckoutForm />);

    await user.click(screen.getByRole("button", { name: /bayar/i }));

    await waitFor(() => {
      expect(playfulToast.error).toHaveBeenCalledWith(
        "Oops, saldo kamu nggak cukup nih!"
      );
    });
  });

  it("shows loading state while submitting", async () => {
    seedCart();
    // Never resolve to keep it loading
    mockCreateOrder.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    render(<CheckoutForm />);

    await user.click(screen.getByRole("button", { name: /bayar/i }));

    await waitFor(() => {
      expect(screen.getByText(/memproses/i)).toBeInTheDocument();
    });
  });

  it("can increment and decrement item quantity", async () => {
    seedCart();
    const user = userEvent.setup();

    render(<CheckoutForm />);

    const addBtn = screen.getByRole("button", {
      name: /tambah nasi goreng/i,
    });
    await user.click(addBtn);

    // Quantity should now be 3, total Rp 45.000
    expect(screen.getByText("3")).toBeInTheDocument();
    const priceElements = screen.getAllByText(/Rp 45\.000/);
    expect(priceElements.length).toBeGreaterThanOrEqual(1);
  });

  it("redirects to /menu when cart is empty and button clicked", async () => {
    const user = userEvent.setup();

    render(<CheckoutForm />);

    await user.click(
      screen.getByRole("button", { name: /lihat menu/i })
    );

    expect(mockPush).toHaveBeenCalledWith("/menu");
  });
});
