// src/achievements.js — каталог достижений + чистая логика оценки. Награда — монеты.
// Каталог = данные (как ARTIFACTS). Логика (evaluate/progressFor) не зависит от Phaser/
// браузера → тестируется в Node (tests/achievements.test.js, как updater.js).
// Дизайн: docs/superpowers/specs/2026-06-28-achievements-design.md

const Achievements = {
    // kind:'run'  — разовая веха, test(ctx) от снапшота забега.
    // kind:'life' — накопительная: проверка ctx[stat] >= goal (порог в каталоге).
    DEFS: [
        { id: 'first_run',      coins: 25,  kind: 'run',  test: (c) => true },
        { id: 'rich_run',       coins: 50,  kind: 'run',  test: (c) => c.runCoins >= 120 },
        { id: 'ch1_clear',      coins: 100, kind: 'run',  test: (c) => c.cleared && c.chapter === 1 },
        { id: 'ch2_clear',      coins: 175, kind: 'run',  test: (c) => c.cleared && c.chapter === 2 },
        { id: 'ch3_clear',      coins: 400, kind: 'run',  test: (c) => c.cleared && c.chapter === 3 },
        { id: 'score_10k',      coins: 150, kind: 'run',  test: (c) => c.runScore >= 10000 },
        { id: 'score_18k',      coins: 400, kind: 'run',  test: (c) => c.runScore >= 18000 },
        { id: 'survivor_10',    coins: 100, kind: 'run',  test: (c) => c.runTime >= 600 },
        { id: 'survivor_15',    coins: 400, kind: 'run',  test: (c) => c.runTime >= 900 },
        { id: 'massacre_500',   coins: 150, kind: 'run',  test: (c) => c.runKills >= 500 },
        { id: 'massacre_1000',  coins: 450, kind: 'run',  test: (c) => c.runKills >= 1000 },
        { id: 'untouchable',    coins: 325, kind: 'run',  test: (c) => c.cleared && c.hits <= 8 },
        { id: 'hardcore_clear', coins: 300, kind: 'run',  test: (c) => c.cleared && c.hardcore },
        { id: 'slayer_1',  coins: 50,  kind: 'life', stat: 'lifetimeKills', goal: 1000 },
        { id: 'slayer_2',  coins: 100, kind: 'life', stat: 'lifetimeKills', goal: 5000 },
        { id: 'slayer_3',  coins: 150, kind: 'life', stat: 'lifetimeKills', goal: 10000 },
        { id: 'slayer_4',  coins: 250, kind: 'life', stat: 'lifetimeKills', goal: 25000 },
        { id: 'slayer_5',  coins: 500,  kind: 'life', stat: 'lifetimeKills', goal: 50000 },
        { id: 'slayer_6',  coins: 1000, kind: 'life', stat: 'lifetimeKills', goal: 100000 },
        { id: 'veteran_1', coins: 75,  kind: 'life', stat: 'lifetimeRuns', goal: 25 },
        { id: 'veteran_2', coins: 450, kind: 'life', stat: 'lifetimeRuns', goal: 100 },
    ],

    // Чистая оценка: какие НОВЫЕ ачивки выполнены и сколько монет. Идемпотентна —
    // уже полученные (unlockedIds) пропускаются.
    evaluate(ctx, unlockedIds) {
        const have = Object.create(null);
        for (const id of (unlockedIds || [])) have[id] = true;
        const newly = [];
        let coins = 0;
        for (const def of Achievements.DEFS) {
            if (have[def.id]) continue;
            const passed = def.test ? def.test(ctx) : (ctx[def.stat] >= def.goal);
            if (passed) { newly.push({ id: def.id, coins: def.coins }); coins += def.coins; }
        }
        return { newly, coins };
    },

    // Прогресс накопительной ачивки (для экрана). Для разовой — null.
    progressFor(def, stats) {
        if (!def || def.kind !== 'life') return null;
        return { cur: (stats && stats[def.stat]) || 0, max: def.goal };
    },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Achievements };
