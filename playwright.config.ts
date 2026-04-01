import { defineConfig, devices } from '@playwright/test';

const frontendPort = Number(process.env.PLAYWRIGHT_FRONTEND_PORT ?? 4173);
const backendPort = Number(process.env.PORT ?? 3000);
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['html', { outputFolder: 'e2e/playwright-report' }], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run build:api',
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'npm run build:web',
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'npm run start:api',
      url: `http://127.0.0.1:${backendPort}/healthz`,
      reuseExistingServer: !isCI,
      timeout: 120000,
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        PORT: String(backendPort),
        OTEL_ENABLED: 'false',
      },
    },
    {
      command: `npx vite preview --config front-end/vite.config.mts --host 127.0.0.1 --port ${frontendPort}`,
      url: `http://127.0.0.1:${frontendPort}`,
      reuseExistingServer: !isCI,
      timeout: 120000,
      env: {
        ...process.env,
        VITE_API_URL: `http://127.0.0.1:${backendPort}`,
      },
    },
  ],
});
