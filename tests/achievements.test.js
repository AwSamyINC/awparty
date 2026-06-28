// TDD-тест чистой логики достижений (каталог + evaluate + progressFor).
// Запуск: node tests/achievements.test.js
const assert = require('node:assert');
const { Achievements } = require('../src/achievements.js');

let n = 0;
const ok = (label, cond) => { assert.strictEqual(cond, true, label); n++; };
const has = (res, id) => res.newly.some((u) => u.id === id);
const ctx = (over) => Object.assign({
    chapter: 1, cleared: false, runKills: 0, runScore: 0, runTime: 0,
    runCoins: 0, hits: 0, hardcore: false, lifetimeKills: 0, lifetimeRuns: 0,
}, over || {});

// --- каталог ---
ok('21 достижение в каталоге', Achievements.DEFS.length === 21);
let sum = 0; for (const d of Achievements.DEFS) sum += d.coins;
ok('суммарный payout = 83975', sum === 83975);

// --- first_run всегда ---
const r = Achievements.evaluate(ctx(), []);
ok('first_run выдаётся', has(r, 'first_run'));

// --- идемпотентность ---
const r2 = Achievements.evaluate(ctx(), r.newly.map((u) => u.id));
ok('повтор не доначисляет', r2.newly.length === 0);
ok('повтор: 0 монет', r2.coins === 0);

// --- границы порогов ---
ok('score 9999 → нет', !has(Achievements.evaluate(ctx({ runScore: 9999 }), []), 'score_10k'));
ok('score 10000 → да', has(Achievements.evaluate(ctx({ runScore: 10000 }), []), 'score_10k'));
ok('slayer_2 4999 → нет', !has(Achievements.evaluate(ctx({ lifetimeKills: 4999 }), []), 'slayer_2'));
ok('slayer_2 5000 → да', has(Achievements.evaluate(ctx({ lifetimeKills: 5000 }), []), 'slayer_2'));

// --- cleared / chapter ---
ok('ch3 без cleared → нет', !has(Achievements.evaluate(ctx({ chapter: 3, cleared: false }), []), 'ch3_clear'));
ok('ch3 cleared → да', has(Achievements.evaluate(ctx({ chapter: 3, cleared: true }), []), 'ch3_clear'));
ok('ch1_clear при chapter 3 → нет', !has(Achievements.evaluate(ctx({ chapter: 3, cleared: true }), []), 'ch1_clear'));

// --- untouchable ---
ok('9 ударов → нет', !has(Achievements.evaluate(ctx({ chapter: 1, cleared: true, hits: 9 }), []), 'untouchable'));
ok('8 ударов → да', has(Achievements.evaluate(ctx({ chapter: 1, cleared: true, hits: 8 }), []), 'untouchable'));

// --- монеты конкретной ачивки ---
ok('ch3_clear даёт 6000', Achievements.evaluate(ctx({ chapter: 3, cleared: true }), []).newly.find((u) => u.id === 'ch3_clear').coins === 6000);

// --- порог rich_run (новый масштаб экономики) ---
ok('rich_run 3999 → нет', !has(Achievements.evaluate(ctx({ runCoins: 3999 }), []), 'rich_run'));
ok('rich_run 4000 → да', has(Achievements.evaluate(ctx({ runCoins: 4000 }), []), 'rich_run'));

// --- progressFor ---
const slayer3 = Achievements.DEFS.find((d) => d.id === 'slayer_3');
const pr = Achievements.progressFor(slayer3, { lifetimeKills: 7340 });
ok('progress cur', pr.cur === 7340);
ok('progress max', pr.max === 10000);
ok('progress для run → null', Achievements.progressFor(Achievements.DEFS.find((d) => d.id === 'first_run'), {}) === null);

console.log(`all ${n} achievements tests passed`);
