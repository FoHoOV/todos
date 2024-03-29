import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'npm run build-integration && npm run preview',
		port: 5174
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(spec)\.[jt]s/,
	reporter: [['html', { open: 'on-failure', outputDir: 'test-results' }]],
	use: {
		video: 'retain-on-failure'
	},
	timeout: 2 * 60 * 1000,
	projects: [
		{
			name: 'Chromium',
			use: { browserName: 'chromium' }
		},
		{
			name: 'Firefox',
			use: { browserName: 'firefox' }
		},
		{
			name: 'WebKit',
			use: { browserName: 'webkit' }
		}
	]
};

export default config;
