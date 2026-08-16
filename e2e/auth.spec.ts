import { test, expect } from "@playwright/test";
import { loginAsInvestor, loginAsAdmin } from "./utils";

test.describe("Authentication & authorization", () => {
  test("redirects unauthenticated users away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated users away from the admin console", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("rejects an incorrect password", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "investor@synxhub.demo");
    await page.fill("#password", "wrong-password-123");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs an investor in and lands on the dashboard", async ({ page }) => {
    await loginAsInvestor(page);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  });

  test("prevents an investor from reaching the admin console", async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("logs an admin in and allows access to the admin console", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin overview" })).toBeVisible();
  });

  test("signs out and returns to a logged-out state", async ({ page }) => {
    await loginAsInvestor(page);
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("**/");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
