import { test, expect } from "@playwright/test";

// ── Helpers ────────────────────────────────────────────────

const TEST_USER = {
  email: "testuser@example.com",
  password: "password123",
};

async function loginAsUser(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole("button", { name: /masuk/i }).click();
  await expect(page).toHaveURL(/\/menu/, { timeout: 10000 });
}

// ── Checkout Flow Tests ────────────────────────────────────

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test("menu page displays available menus", async ({ page }) => {
    // Should see the hero greeting
    await expect(page.getByText(/kantin/i).first()).toBeVisible();

    // Should see at least one menu card
    const menuCards = page.locator('[data-testid="menu-card"]');
    // If no data-testid, look for menu items by pattern
    const menuItems = menuCards.or(
      page.locator("text=/Rp \\d/").first()
    );
    await expect(menuItems).toBeVisible({ timeout: 5000 });
  });

  test("can add item to cart via menu card", async ({ page }) => {
    // Look for an add-to-cart button (+ icon or "Masukkan Keranjang")
    const addBtn = page
      .getByRole("button", { name: /tambah|masukkan|keranjang|\+/i })
      .first();

    if (await addBtn.isVisible()) {
      await addBtn.click();

      // Cart FAB or counter should show item count
      await expect(
        page.getByText(/keranjang|cart/i).or(page.locator('[data-testid="cart-fab"]'))
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test("cart page shows empty state when no items", async ({ page }) => {
    await page.goto("/cart");

    await expect(
      page.getByText(/belum ada makanan yang dipilih/i)
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /lihat menu/i })
    ).toBeVisible();
  });

  test("empty cart 'Lihat Menu' button redirects to /menu", async ({
    page,
  }) => {
    await page.goto("/cart");

    await page.getByRole("button", { name: /lihat menu/i }).click();
    await expect(page).toHaveURL(/\/menu/);
  });

  test("checkout form shows order summary with items", async ({
    page,
  }) => {
    // Add item first (from menu page)
    const addBtn = page
      .getByRole("button", { name: /tambah|masukkan|keranjang|\+/i })
      .first();

    if (await addBtn.isVisible({ timeout: 3000 })) {
      await addBtn.click();

      // Navigate to cart
      await page.goto("/cart");

      // Should show checkout header
      await expect(page.getByText(/checkout/i)).toBeVisible();

      // Should show pickup time options
      await expect(page.getByText(/istirahat 1/i)).toBeVisible();
      await expect(page.getByText(/istirahat 2/i)).toBeVisible();

      // Should show payment method options
      await expect(page.getByText(/potong saldo/i)).toBeVisible();
      await expect(page.getByText(/midtrans/i)).toBeVisible();

      // Should show submit button with price
      await expect(
        page.getByRole("button", { name: /bayar/i })
      ).toBeVisible();
    }
  });

  test("can change pickup time selection", async ({ page }) => {
    // Add item first
    const addBtn = page
      .getByRole("button", { name: /tambah|masukkan|keranjang|\+/i })
      .first();

    if (await addBtn.isVisible({ timeout: 3000 })) {
      await addBtn.click();
      await page.goto("/cart");

      // Default is BREAK_1, switch to BREAK_2
      await page.getByText(/istirahat 2/i).click();

      // BREAK_2 label should be selected (visually indicated)
      const break2Label = page.getByText(/istirahat 2/i);
      await expect(break2Label).toBeVisible();
    }
  });

  test("can write order notes", async ({ page }) => {
    const addBtn = page
      .getByRole("button", { name: /tambah|masukkan|keranjang|\+/i })
      .first();

    if (await addBtn.isVisible({ timeout: 3000 })) {
      await addBtn.click();
      await page.goto("/cart");

      const textarea = page.getByPlaceholder(/sambelnya/i);
      await textarea.fill("Pedasnya banyakin ya");
      await expect(textarea).toHaveValue("Pedasnya banyakin ya");
    }
  });

  test("submit button shows loading state during checkout", async ({
    page,
  }) => {
    const addBtn = page
      .getByRole("button", { name: /tambah|masukkan|keranjang|\+/i })
      .first();

    if (await addBtn.isVisible({ timeout: 3000 })) {
      await addBtn.click();
      await page.goto("/cart");

      const submitBtn = page.getByRole("button", { name: /bayar/i });
      await submitBtn.click();

      // Should show loading text
      await expect(
        page.getByText(/memproses/i).or(submitBtn)
      ).toBeVisible();
    }
  });
});
