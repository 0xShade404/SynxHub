import { test, expect } from "@playwright/test";
import { loginAsInvestor } from "./utils";

test.describe("Investor dashboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsInvestor(page);
  });

  test("overview shows ledger-derived portfolio stats", async ({ page }) => {
    await expect(page.getByText("Portfolio value")).toBeVisible();
    await expect(page.getByText("Net P&L")).toBeVisible();
    await expect(page.getByText("Total deposited")).toBeVisible();
  });

  test("portfolio page shows allocation and balances", async ({ page }) => {
    await page.goto("/dashboard/portfolio");
    await expect(page.getByRole("heading", { name: "Portfolio", exact: true })).toBeVisible();
    await expect(page.getByText("Balances by asset")).toBeVisible();
  });

  test("deposits page can generate a deposit address", async ({ page }) => {
    await page.goto("/dashboard/deposits");
    await page.getByRole("button", { name: /generate deposit address/i }).click();
    await expect(page.getByText("DEPOSIT ADDRESS")).toBeVisible({ timeout: 10000 });
  });

  test("withdrawals page requires MFA before showing the request form", async ({ page }) => {
    await page.goto("/dashboard/withdrawals");
    await expect(page.getByText("Multi-factor authentication required")).toBeVisible();
  });

  test("security page can start MFA enrollment", async ({ page }) => {
    await page.goto("/dashboard/security");
    await page.getByRole("button", { name: /set up mfa/i }).click();
    await expect(page.getByText(/scan this qr code/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/save these recovery codes/i)).toBeVisible();
  });

  test("transactions page lists ledger entries", async ({ page }) => {
    await page.goto("/dashboard/transactions");
    await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();
  });

  test("settings page shows account details and KYC panel", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
    await expect(page.getByText("Identity verification (KYC)")).toBeVisible();
  });
});
