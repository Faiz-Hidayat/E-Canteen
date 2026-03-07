import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ──────────────────────────────────────────────────

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockLoginUser = vi.fn();
vi.mock("@/actions/auth.actions", () => ({
  loginUser: (...args: unknown[]) => mockLoginUser(...args),
}));

vi.mock("@/lib/toast", () => ({
  playfulToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { LoginForm } from "@/components/shared/LoginForm";

// ── Tests ──────────────────────────────────────────────────

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/masukkan password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /masuk/i })
    ).toBeInTheDocument();
  });

  it("renders register link", () => {
    render(<LoginForm />);

    const link = screen.getByRole("link", { name: /daftar di sini/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("submits valid credentials and redirects USER to /menu", async () => {
    mockLoginUser.mockResolvedValue({ success: true, role: "USER" });
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "siswa@kantin.id");
    await user.type(screen.getByPlaceholderText(/masukkan password/i), "rahasia123");
    await user.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith({
        email: "siswa@kantin.id",
        password: "rahasia123",
      });
      expect(mockPush).toHaveBeenCalledWith("/menu");
    });
  });

  it("redirects ADMIN to /admin/queue", async () => {
    mockLoginUser.mockResolvedValue({ success: true, role: "ADMIN" });
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "admin@kantin.id");
    await user.type(screen.getByPlaceholderText(/masukkan password/i), "admin123");
    await user.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/queue");
    });
  });

  it("redirects SUPER_ADMIN to /super-admin", async () => {
    mockLoginUser.mockResolvedValue({
      success: true,
      role: "SUPER_ADMIN",
    });
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "super@kantin.id");
    await user.type(screen.getByPlaceholderText(/masukkan password/i), "super123");
    await user.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/super-admin");
    });
  });

  it("shows error toast on failed login", async () => {
    mockLoginUser.mockResolvedValue({
      success: false,
      error: "Email atau password salah.",
    });
    const user = userEvent.setup();
    const { playfulToast } = await import("@/lib/toast");

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "wrong@email.com");
    await user.type(screen.getByPlaceholderText(/masukkan password/i), "wrongpw");
    await user.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(playfulToast.error).toHaveBeenCalledWith(
        "Email atau password salah."
      );
    });
  });

  it("does not submit with invalid email format (client validation)", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "bukan-email");
    await user.type(screen.getByPlaceholderText(/masukkan password/i), "rahasia123");
    await user.click(screen.getByRole("button", { name: /masuk/i }));

    // Wait a tick for validation to process
    await waitFor(() => {
      // Should not have called the server action because client validation failed
      expect(mockLoginUser).not.toHaveBeenCalled();
    });
  });

  it("shows validation error for empty password", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "siswa@kantin.id");
    // don't type password
    await user.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/password wajib diisi/i)
      ).toBeInTheDocument();
    });

    expect(mockLoginUser).not.toHaveBeenCalled();
  });
});
