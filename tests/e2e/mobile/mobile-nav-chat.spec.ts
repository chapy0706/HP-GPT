// tests/e2e/mobile/mobile-nav-chat.spec.ts
import { expect } from '@playwright/test';
import { test } from '../helpers/setup';

test('モバイルでチャットを最後まで読める', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');

  await page.getByTestId('chat-open').click();

  const messages = page.getByTestId('chat-messages');
  await messages.evaluate(el => el.scrollTop = el.scrollHeight);

  await expect(page.getByTestId('chat-next')).toBeVisible();
});
