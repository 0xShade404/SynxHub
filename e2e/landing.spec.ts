import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows the hero, tagline, and risk disclosure", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Automated Crypto Investing/i })).toBeVisible();
    await expect(page.getByText(/Cryptocurrency investments are volatile/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Create Account" }).first()).toBeVisible();
  });

  test("never claims guaranteed returns anywhere on the page", async ({ page }) => {
    await page.goto("/");
    const bodyText = await page.locator("body").innerText();
    for (const phrase of ["guaranteed return", "guaranteed profit", "risk-free", "guaranteed roi"]) {
      expect(bodyText.toLowerCase()).not.toContain(phrase);
    }
  });

  test("shows the eight-asset universe with a DEMO DATA label", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "The asset universe" })).toBeVisible();
    await expect(page.getByText("BTC")).toBeVisible();
    await expect(page.getByText("DEMO DATA").first()).toBeVisible();
  });

  test("navigates to the Transparency & Security page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "View Transparency & Security" }).click();
    await expect(page).toHaveURL(/\/transparency/);
    await expect(page.getByRole("heading", { name: "Transparency & Security" })).toBeVisible();
  });

  test("legal pages are reachable from the footer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Terms of Service" }).click();
    await expect(page).toHaveURL(/\/legal\/terms/);
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
  });

  test("has no horizontal overflow at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasOverflow).toBe(false);
  });
});
