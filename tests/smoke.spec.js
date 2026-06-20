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

// Прогон боя: заходим в забег и даём игровому циклу покрутиться. Покрывает updatePlaying
// и вынесенные системы (прогрессия фаз/спавн/бой/FX) — то, что не видно на MENU. Ловит
// рантайм-ошибки вроде «this._updatePhaseProgression is not a function» после декомпозиции.
test('runs a PLAYING tick without uncaught errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/index.html');
    await page.waitForFunction(() => {
        const g = window.__gameRef;
        const s = g && g.scene && g.scene.scenes && g.scene.scenes[0];
        return s && s.currentState === 'MENU';
    }, { timeout: 15000 });

    // Стартуем забег напрямую (без кликов по меню) и крутим цикл ~2.5 c.
    await page.evaluate(() => {
        const s = window.__gameRef.scene.scenes[0];
        s.currentChapter = 1;
        s.resetGame();
        s.setState('PLAYING');
    });
    await page.waitForTimeout(2500);

    // Игра не упала и осталась в боевом контуре (левел-ап/выбор способности — тоже ок).
    const state = await page.evaluate(() => window.__gameRef.scene.scenes[0].currentState);
    expect(['PLAYING', 'LEVEL_UP', 'ABILITY_SELECT']).toContain(state);
    expect(pageErrors, 'uncaught errors:\n' + pageErrors.join('\n')).toEqual([]);
});
