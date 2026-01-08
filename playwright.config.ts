// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3030' },
  webServer: {
    command: 'pnpm exec serve . -l 3030',
    url: 'http://localhost:3030',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
