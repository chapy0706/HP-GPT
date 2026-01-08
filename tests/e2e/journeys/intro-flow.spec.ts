// tests/e2e/journeys/intro-flow.spec.ts
import { expect } from '@playwright/test';
import { test } from '../helpers/setup';

test('カード導線が最後まで進める', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('intro-skip').click();
  await page.getByTestId('card-1').click();

  await expect(page.getByTestId('card-detail')).toBeVisible();

  await page.getByTestId('detail-next').click();
  await page.getByTestId('detail-next').click();

  await expect(page.getByTestId('section-top')).toBeVisible();
});
