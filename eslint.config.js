// ESLint flat config (ESLint 9). Цель — НЕ навести стиль, а ловить главную опасность
// «глобального супа» без сборщика: ссылку на не-объявленный идентификатор (no-undef),
// что особенно ценно при переносе кода между файлами (декомпозиция scene.js).
//
// Все модули из src/ грузятся как обычные <script> и общаются через глобалы, поэтому
// каждый кросс-файловый идентификатор перечислен ниже. Если ESLint ругается на no-undef
// для реально существующего глобала — добавь его сюда.
const globals = require('globals');

module.exports = [
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script', // не модули: import/export не используются
            globals: {
                ...globals.browser,
                ...globals.es2021,
                Phaser: 'readonly',

                // constants.js
                C: 'readonly', GameState: 'readonly', GamePhase: 'readonly',
                EnemyType: 'readonly', BossState: 'readonly', GoblinState: 'readonly',
                CHAPTERS: 'readonly', getChapter: 'readonly', TEXTURE_MANIFEST: 'readonly',
                ANIM_DIRS: 'readonly', UPGRADE_ICONS: 'readonly',
                LEGENDARY_UPGRADE_IDS: 'readonly', LEGENDARY_CARD_CHANCE: 'readonly',
                ABILITY_COOLDOWNS: 'readonly', ABILITY_ICONS: 'readonly', ARTIFACTS: 'readonly',

                // i18n.js
                t: 'readonly', setLanguage: 'readonly', detectLang: 'readonly',

                // utils.js
                distSq: 'readonly', dist: 'readonly', normalize: 'readonly', randInt: 'readonly',
                rgb: 'readonly', clamp8: 'readonly', clamp: 'readonly', fmtNum: 'readonly',
                lbCompare: 'readonly', lbEmptyEntry: 'readonly', formatTime: 'readonly',

                // save.js
                SaveSystem: 'readonly',

                // entities.js
                Player: 'readonly', Enemy: 'readonly', Bullet: 'readonly',
                EnemyProjectile: 'readonly', BossSoul: 'readonly', Gem: 'readonly',
                Coin: 'readonly', Vinyl: 'readonly', Particle: 'readonly', DamageText: 'readonly',
                DEG: 'readonly',

                // spawner.js
                EnemySpawner: 'readonly', findSpawnPos: 'readonly',

                // hud.js
                HUD: 'readonly', FONT: 'readonly',

                // shop.js
                Shop: 'readonly', ARTIFACT_ICONS: 'readonly',

                // audio.js
                AudioManager: 'readonly',

                // config.js
                SUPABASE_URL: 'readonly', SUPABASE_ANON_KEY: 'readonly',

                // leaderboard_remote.js / cloud_save.js
                RemoteLeaderboard: 'readonly', CloudSave: 'readonly',

                // scene.js
                MainScene: 'readonly',
            },
        },
        rules: {
            'no-undef': 'error',
            // no-unused-vars выключен: в «глобальном супе» ESLint видит каждый файл
            // отдельно и не знает, что класс/константа используется в другом файле,
            // поэтому давал бы массу ложных срабатываний на экспортируемые глобалы.
            'no-unused-vars': 'off',
            'no-redeclare': ['error', { builtinGlobals: false }],
            'no-dupe-keys': 'error',
            'no-dupe-args': 'error',
            'no-unreachable': 'warn',
        },
    },
];
