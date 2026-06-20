const { test, expect } = require('@playwright/test');

// Smoke-тест — страховка при рефакторинге (декомпозиция scene.js, DRY-спавнер):
// игра должна загрузиться, построить сцену и дойти до меню БЕЗ необработанных
// исключений. Главная регрессия при переносе кода между файлами «глобального супа» —
// ReferenceError на не найденный идентификатор — проявляется как pageerror.
test('boots to MENU without uncaught errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/index.html');

    // Канвас Phaser появился.
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });

    // Дать движку прогрузить ассеты и построить меню.
    await page.waitForFunction(() => {
        const g = window.__gameRef;
        const scene = g && g.scene && g.scene.scenes && g.scene.scenes[0];
        return scene && scene.currentState === 'MENU';
    }, { timeout: 15000 });

    // Никаких необработанных JS-исключений за время загрузки.
    expect(pageErrors, 'uncaught errors:\n' + pageErrors.join('\n')).toEqual([]);
});
