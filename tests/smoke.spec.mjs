// /tests/smoke.spec.mjs
import { test, expect } from "@playwright/test";

async function skipIntro(page) {
  await page.goto("/");
  const intro = page.locator("#intro-overlay");
  await expect(intro).toBeVisible();
  const skip = page.locator("#skip-button");
  await skip.click();
  await expect(intro).toHaveCount(0);
}

test("intro: skip shows top section and main content", async ({ page }) => {
  await page.goto("/");

  const intro = page.locator("#intro-overlay");
  await expect(intro).toBeVisible();

  await page.locator("#skip-button").click();
  await expect(intro).toHaveCount(0);

  await expect(page.locator("#main-content")).not.toHaveClass(/\bhidden\b/);
  await expect(page.locator("section#top")).not.toHaveClass(/\bhidden\b/);
});

test("journey modal: start button opens and renders first step", async ({ page }) => {
  await skipIntro(page);

  await page.locator("#start-journey-button").click();

  const modal = page.locator("#journey-modal");
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute("aria-hidden", "false");

  // first step button label comes from modal-steps.json
  await expect(page.locator("#modal-actions")).toContainText("なぜ感じあうなの？");
});

test("logos: feel section grid renders and detail view reacts", async ({ page }) => {
  await skipIntro(page);

  // Go to feel section using footer nav
  await page.locator('.footer-nav-row a[data-section="feel"]').click();
  await expect(page.locator("section#feel")).not.toHaveClass(/\bhidden\b/);

  const gridCells = page.locator("#logo-u-grid .logo-cell");
  await expect(gridCells).toHaveCount(100);

  // Ensure at least one logo image is present (logos.json loaded)
  const firstLogoImg = page.locator("#logo-u-grid .logo-cell img").first();
  await expect(firstLogoImg).toBeVisible();

  // Click the first logo and confirm detail panel updated
  await firstLogoImg.click();

  const author = page.locator("#detail-author");
  await expect(author).not.toHaveText("");

  const thumb = page.locator("#detail-thumbnail");
  await expect(thumb).toHaveAttribute("src", /.+/);
});
