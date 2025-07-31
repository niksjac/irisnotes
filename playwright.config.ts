import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Tauri desktop app testing.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './tests',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Global test timeout */
	timeout: 30000,
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL for dev server */
		baseURL: 'http://localhost:1420',
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
		/* Take screenshot on failure */
		screenshot: 'only-on-failure',
		/* Record video on failure */
		video: 'retain-on-failure',
	},

	/* Configure projects for desktop app testing */
	projects: [
		{
			name: 'tauri-desktop',
			use: {
				...devices['Desktop Chrome'],
				/* Use viewport that matches typical desktop app */
				viewport: { width: 1280, height: 720 },
			},
		},
	],

	/* Run Tauri dev server before starting the tests */
	webServer: {
		command: 'pnpm tauri dev',
		url: 'http://localhost:1420',
		timeout: 120000,
		reuseExistingServer: !process.env.CI,
		stdout: 'pipe',
		stderr: 'pipe',
	},
});
