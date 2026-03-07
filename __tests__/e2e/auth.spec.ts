import { test, expect } from "@playwright/test";

// ── Helpers ────────────────────────────────────────────────

const TEST_USER = {
  email: "testuser@example.com",
  password: "password123",
};

const TEST_ADMIN = {
  email: "admin@example.com",
  password: "password123",
};

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /masuk/i }).click();
}

// ── Auth Flow Tests ────────────────────────────────────────

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByText(/masuk ke kantin 40/i)
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /masuk/i })
    ).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByText(/daftar akun kantin 40/i)
    ).toBeVisible();
    await expect(page.getByLabel(/nama/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("login link on register page navigates to login", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByRole("link", { name: /masuk/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("register link on login page navigates to register", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: /daftar/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("shows validation error for empty email", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /masuk/i }).click();

    // Expect some kind of validation message
    await expect(page.locator("form")).toContainText(/email/i);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("wrong@email.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /masuk/i }).click();

    // Should show error toast or message
    await expect(
      page.getByText(/email atau password salah|gagal/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("successful USER login redirects to /menu", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);

    await expect(page).toHaveURL(/\/menu/, { timeout: 10000 });
  });

  test("successful ADMIN login redirects to /admin/queue", async ({
    page,
  }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);

    await expect(page).toHaveURL(/\/admin\/queue/, {
      timeout: 10000,
    });
  });
});
