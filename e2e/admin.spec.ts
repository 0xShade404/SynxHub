import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./utils";

test.describe("Admin console", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("asset & strategy console lists the configured asset universe", async ({ page }) => {
    await page.goto("/admin/portfolio");
    await expect(page.getByRole("heading", { name: "Assets & Strategy" })).toBeVisible();
    await expect(page.getByText("BTC")).toBeVisible();
  });

  test("investors list is searchable", async ({ page }) => {
    await page.goto("/admin/investors");
    await expect(page.getByRole("heading", { name: "Investors" })).toBeVisible();
    await expect(page.getByText("investor@synxhub.demo")).toBeVisible();
  });

  test("withdrawals queue renders status tabs", async ({ page }) => {
    await page.goto("/admin/withdrawals");
    await expect(page.getByRole("tab", { name: "Flagged" })).toBeVisible();
  });

  test("compliance page shows KYC queue and restricted jurisdictions", async ({ page }) => {
    await page.goto("/admin/compliance");
    await expect(page.getByRole("heading", { name: "Compliance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Restricted jurisdictions" })).toBeVisible();
  });

  test("system page reports provider status honestly as mock", async ({ page }) => {
    await page.goto("/admin/system");
    await expect(page.getByText("CUSTODY PROVIDER")).toBeVisible();
    await expect(page.getByText("Not connected to a real custodian.")).toBeVisible();
  });
});
