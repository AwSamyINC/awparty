# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Что это:** браузерная игра на **Phaser 3** (vanilla JS, без сборщика). Это порт
> оригинальной C++/SFML-версии (её код заархивирован отдельно в
> `../AwParty-cpp-legacy/` и больше **не** является активным проектом). Множество
> комментариев в коде ссылаются на C++-исходники (`Game.cpp`, `Enemy.h`) — это история
> происхождения, не зависимость.

## Запуск (локально)

Сборки нет — это статические файлы. Нужен любой http-сервер (открывать `file://`
нельзя: модули и ассеты грузятся по сети):

```bash
python -m http.server 8000
# затем открыть http://localhost:8000/index.html
```

`index.html` подключает `phaser.min.js`, затем модули из `src/` динамически.

### Анти-кэш: ASSET_VER

В `index.html` есть **единственная** константа `ASSET_VER` (сейчас `'90'`). Она
добавляется как `?v=N` ко всем модулям. **После правки любого `src/*.js` подними
`ASSET_VER` на 1**, иначе браузер (и GitHub Pages) отдадут старый код из кэша.

### Порядок загрузки модулей важен

Сборщика нет — всё через глобальные переменные. Порядок в массиве `MODULES`
(`index.html`) критичен: `scene.js` объявляет класс `MainScene`, затем
`scene_records.js` и `scene_ui.js` навешивают методы на его **прототип**, и только
потом `main.js` создаёт игру. Не переставляй модули местами.

## Деплой

Git-remote: `github.com/AwSamyINC/awparty`. Раздаётся через **GitHub Pages** —
`git push` в репозиторий публикует игру. Не забудь поднять `ASSET_VER` перед пушем,
иначе у игроков останется закэшированный старый код.

## Архитектура

`main.js` собирает Phaser-конфиг и создаёт `new Phaser.Game(config)` с единственной
сценой `MainScene`. Всё крутится вокруг неё.

- **Рендер:** внутреннее разрешение фиксировано **1920×1080** (`C.VIEW_WIDTH/HEIGHT`),
  `Phaser.Scale.NONE` + CSS-растяжение канваса на весь вьюпорт (UI не плывёт, чёрных
  полос нет). Две камеры: `cameras.main` (следит за игроком, мир) и `uiCam` (фикс., UI).
  Слои `worldLayer` / `uiLayer` разведены через `camera.ignore()`.
- **FPS:** `fps.limit = 0` — игра идёт на частоте монитора (requestAnimationFrame).
- **Машина состояний:** `GameState` (`MENU, LOBBY, SHOP, PLAYING, PAUSED, SETTINGS,
  LEVEL_UP, ABILITY_SELECT, NAME_INPUT, RENAME_INPUT, LEADERBOARD, CLOUD_RESTORE,
  STAGE_CLEAR, CHAPTER_SELECT`). Прогрессия рана: `GamePhase` (`PHASE_1 → CLEARING →
  PHASE_2 → PHASE_3`).
- **Главы:** забег = выбранная глава (1..3) из 3 этапов. `CHAPTERS` в `constants.js`
  задаёт тему/арт/множители сложности; разблокировка — через `save.maxChapterUnlocked`.
  Все `*Key` имеют фолбэк на главу 1 — глава играбельна ещё до появления арта.

### Модули `src/`

| Файл | Роль |
|---|---|
| `main.js` | Точка входа: конфиг Phaser, прогрев шрифтов, `boot()` |
| `scene.js` | `MainScene` — порт `Game.cpp`: `preload/create/update`, игровой цикл, состояния, спатиал-грид, способности, фазы/главы. **Самый большой файл.** |
| `scene_ui.js` | Методы `MainScene.prototype.*` — рендер меню/HUD-экранов/настроек |
| `scene_records.js` | Методы `MainScene.prototype.*` — экраны рекордов и ввода ника |
| `constants.js` | Все игровые константы (порт 1:1 из C++) + enum'ы (`GameState`, `GamePhase`, `EnemyType`, `BossState`, `GoblinState`), `CHAPTERS`, `TEXTURE_MANIFEST`, `ANIM_DIRS` |
| `entities.js` | Классы: `Player, Enemy, Bullet, EnemyProjectile, BossSoul, Gem, Coin, Vinyl, Particle, DamageText`. **Самый большой после scene.js.** |
| `spawner.js` | `EnemySpawner` — спавн по таймеру, масштаб от времени выживания, боссы |
| `hud.js` | `HUD` — HP/XP-бары, таймер, HP-бар босса, счётчик монет |
| `shop.js` | `Shop` — межзабеговый магазин перманентных апгрейдов |
| `audio.js` | `AudioManager` — загрузка и воспроизведение музыки/SFX |
| `i18n.js` | Локализация **en/ru**: `setLanguage`, `detectLang`, словари (`upgrade_titles` и т.д.) |
| `utils.js` | Математика и хелперы: `distSq, dist, normalize, randInt, rgb, clamp, fmtNum, formatTime, lbCompare` |
| `save.js` | `SaveSystem` — сейв в `localStorage` (порт `save.bin`), загрузка/запись таблиц рекордов |
| `config.js` | `SUPABASE_URL` + публичный `SUPABASE_ANON_KEY` |
| `leaderboard_remote.js` | `RemoteLeaderboard` — онлайн-рекорды через Supabase REST (`fetch`, без библиотек) |
| `cloud_save.js` | `CloudSave` — облачный бэкап мета-прогресса по нику через Supabase REST |

### Спатиал-грид

`MainScene` держит плоскую сетку ячеек `C.CELL_SIZE` (150px) на арене 3000×3000:
каждый кадр очистка → вставка врагов → проверка 3×3 соседей для сепарации. Считается
только в радиусе ~1200px от игрока (`COLLISION.SEPARATION_ACTIVE_SQ`).

### Сейв и онлайн-сервисы

- **Локальный сейв:** `SaveSystem` пишет JSON в `localStorage` (ключ `awparty_save`).
  Поля = мета-прогресс (монеты, перм-прокачка, артефакты, открытые главы) + настройки
  устройства. Все поля валидируются/клэмпятся в `_validate()` — повторяй этот паттерн
  при добавлении полей.
- **Рекорды:** две таблицы (`normal` / `hardcore`), по 10 записей `{name, score, time,
  day, month, year}`. Метрика — **score** (при равенстве — время). Локально в
  `localStorage`; онлайн (если заданы ключи Supabase) — через `RemoteLeaderboard`
  (RPC `submit_score`, `rename_player`).
- **Supabase:** обычный `fetch` к `/rest/v1/...`, никаких SDK. `anon`-ключ публичный
  по дизайну, доступ ограничен RLS. Если ключи в `config.js` пусты — игра молча
  откатывается на `localStorage`. Подробности и модель угроз — в `SECURITY.md`.

### Способности

Сбор `BossSoul` → состояние `ABILITY_SELECT` → выбор 1 из 3 карт. Выбранная способность
занимает один из 3 слотов `equippedAbilities`; кулдауны в `abilityCooldowns[3]` /
`abilityMaxCooldowns[3]`. Параметры — в `C.ABILITY` (`constants.js`).

### Ассеты

Всё в `assets/`. Текстуры грузятся по `TEXTURE_MANIFEST` (`constants.js`), кадры
анимации игрока — `panim_<dir><1..6>`. Шрифты: **Orbitron** (латиница) и **Exo 2**
(кириллица — у Orbitron её нет); оба прогреваются в `index.html`/`main.js` до первого кадра.

## Core rules

- Не гадать. Смотреть код. *(Do not guess. Inspect the code.)*
- Делать минимальную безопасную правку. *(Make the smallest safe change.)*
- Предпочитать существующие паттерны проекта новым. *(Prefer existing project patterns over introducing new ones.)*
- Перед правкой объяснять, какие файлы относятся к делу и почему. *(Before editing, explain what files are relevant and why.)*
- Не решать задачу удалением тестов или ослаблением типов. *(Do not solve by deleting tests or weakening types.)*
- Улучшать код, но не делать не связанную с задачей «уборку». *(Leave the codebase better, but do not do unrelated cleanup.)*
- Для многошаговой работы вести план и держать его актуальным. *(Use a plan for multi-step work and keep it updated.)*
- В конце давать PR-style итог. *(At the end, give the user a PR-style summary.)*

**Специфика проекта:** после правки любого `src/*.js` поднимай `ASSET_VER` в `index.html` (иначе браузер/GitHub Pages отдадут старый код из кэша).
