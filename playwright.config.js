const { defineConfig, devices } = require('@playwright/test');

const PORT = 8099;

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30000,
    fullyParallel: true,
    reporter: process.env.CI ? 'github' : 'list',
    use: { baseURL: 'http://localhost:' + PORT },
    // Поднимаем свой статический сервер (без внешних зависимостей) на время тестов.
    webServer: {
        command: 'node scripts/serve.js',
        url: 'http://localhost:' + PORT + '/index.html',
        reuseExistingServer: !process.env.CI,
        env: { PORT: String(PORT) },
        timeout: 30000,
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
