// tests/e2e/smoke/app.spec.ts
import { expect } from '@playwright/test';
import { test } from '../helpers/setup';

test('トップが表示される', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('section-top')).toBeVisible();
});

test('ヘッダーナビで遷移できる', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('nav-price').click();
  await expect(page.getByTestId('section-price')).toBeVisible();
});

test('モバイルナビが開閉できる', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  await page.getByTestId('nav-toggle').click();
  await expect(page.getByTestId('nav-mobile')).toBeVisible();
});

test('チャットが開いて閉じられる', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('chat-open').click();
  await expect(page.getByTestId('chat-modal')).toBeVisible();
  await page.getByTestId('chat-close').click();
  await expect(page.getByTestId('chat-modal')).toBeHidden();
});

test('動画モーダルが開閉できる', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('video-thumb-1').click();
  await expect(page.getByTestId('video-modal')).toBeVisible();
  await page.getByTestId('video-close').click();
  await expect(page.getByTestId('video-modal')).toBeHidden();
});
