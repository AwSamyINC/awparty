// Точка входа: конфигурация Phaser и запуск сцены.

// Лимит FPS из сейва, чтобы он действовал с самого первого кадра.
// FPS_LIMITS: [30,60,120,240,0]; 0 = без лимита (совпадает с Phaser fps.limit).
const savedFpsLimit = (() => {
    try { return C.FPS_LIMITS[SaveSystem.load().currentFpsIndex] || 0; }
    catch (e) { return 0; }
})();

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0a0a0a',
    // limit>0 — Phaser ограничивает частоту кадров (stepLimitFPS); 0 — без лимита.
    fps: { limit: savedFpsLimit },
    scale: {
        // NONE + CSS-растяжение канваса на весь вьюпорт: внутреннее разрешение
        // остаётся 1920x1080 (UI не плывёт), но чёрных полос нет.
        mode: Phaser.Scale.NONE,
        width: C.VIEW_WIDTH,
        height: C.VIEW_HEIGHT,
    },
    render: {
        antialias: true,
        roundPixels: false,
    },
    scene: [MainScene],
};

const boot = () => {
    const start = () => {
        const game = new Phaser.Game(config);
        window.__gameRef = game;
        // Растягиваем канвас на весь экран; refresh() пересчитывает попадание мыши.
        const fit = () => {
            const c = game.canvas;
            if (!c) return;
            c.style.width = '100%';
            c.style.height = '100%';
            c.style.display = 'block';
            game.scale.refresh();
        };
        game.events.once('ready', fit);
        window.addEventListener('resize', fit);
        setTimeout(fit, 100);
    };
    if (document.fonts && document.fonts.load) {
        // Ждём оба шрифта: Orbitron (латиница) и Exo 2 (кириллица), иначе первый кадр
        // нарисуется запасным Arial.
        Promise.all([
            document.fonts.load('30px Orbitron'),
            document.fonts.load('30px "Exo 2"', 'прогрев'),
        ]).then(start).catch(start);
    } else {
        start();
    }
};

// Модули подключаются динамически (script.async=false), поэтому main.js может
// выполниться уже ПОСЛЕ события 'load'. Если страница загружена — стартуем сразу,
// иначе ждём 'load'.
if (document.readyState === 'complete') boot();
else window.addEventListener('load', boot);
