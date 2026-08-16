import type { Page } from "@playwright/test";

export async function loginAsInvestor(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "investor@synxhub.demo");
  await page.fill("#password", "InvestorDemo123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 20000 });
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "admin@synxhub.demo");
  await page.fill("#password", "AdminDemo123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 20000 });
}
