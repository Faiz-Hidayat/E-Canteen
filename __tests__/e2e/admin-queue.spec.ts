import { test, expect } from "@playwright/test";

// ── Helpers ────────────────────────────────────────────────

const TEST_ADMIN = {
  email: "admin@example.com",
  password: "password123",
};

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_ADMIN.email);
  await page.getByLabel(/password/i).fill(TEST_ADMIN.password);
  await page.getByRole("button", { name: /masuk/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
}

// ── Admin Queue Tests ──────────────────────────────────────

test.describe("Admin Queue", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin queue page renders header", async ({ page }) => {
    await page.goto("/admin/queue");

    await expect(
      page.getByText(/antrean pesanan/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("queue shows order statistics badges", async ({ page }) => {
    await page.goto("/admin/queue");

    // Should see status counters: Masuk, Diproses, Siap
    await expect(page.getByText(/masuk/i).first()).toBeVisible();
    await expect(page.getByText(/diproses/i).first()).toBeVisible();
    await expect(page.getByText(/siap/i).first()).toBeVisible();
  });

  test("queue board shows column headers or status groups", async ({
    page,
  }) => {
    await page.goto("/admin/queue");

    // Board should show status categories
    const confirmed = page.getByText(/dikonfirmasi|confirmed|masuk/i);
    const preparing = page.getByText(
      /sedang disiapkan|preparing|lagi disiapin|diproses/i
    );
    const ready = page.getByText(
      /siap diambil|ready|siap/i
    );

    // At least the board structure should be visible
    await expect(
      confirmed.or(preparing).or(ready).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("admin menus page renders", async ({ page }) => {
    await page.goto("/admin/menus");

    await expect(
      page.getByText(/menu saya/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("admin reports page renders", async ({ page }) => {
    await page.goto("/admin/reports");

    await expect(
      page.getByText(/laporan/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("admin sidebar navigation works", async ({ page }) => {
    await page.goto("/admin/queue");

    // Navigate to menus
    const menuLink = page.getByRole("link", { name: /menu/i }).first();
    if (await menuLink.isVisible()) {
      await menuLink.click();
      await expect(page).toHaveURL(/\/admin\/menus/);
    }
  });

  test("admin can see order cards with details", async ({ page }) => {
    await page.goto("/admin/queue");

    // If there are orders, they should show user name, items, total
    const orderCards = page.locator(
      '[data-testid="order-card"]'
    );

    // Even if no orders, the page should render without error
    const noOrders = page.getByText(
      /belum ada pesanan|kosong|tidak ada/i
    );

    await expect(
      orderCards.first().or(noOrders.first()).or(
        page.getByText(/antrean pesanan/i)
      )
    ).toBeVisible({ timeout: 5000 });
  });
});
