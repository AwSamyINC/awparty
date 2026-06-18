// scene_ui.js — меню, экраны и ввод MainScene (вынесено из scene.js).
// Методы навешиваются на MainScene.prototype (класс объявлен в scene.js, грузится раньше).
// Сюда входят: построение всех экранов (меню/лобби/настройки/рекорды/пауза/левелап/способности),
// обработка мыши и клавиатуры, переходы по пунктам, смена языка/громкости, переименование игрока.

    // ===================== МЕНЮ / UI =====================
MainScene.prototype._clearMenu = function() { this.menuObjs.forEach(o => o.destroy()); this.menuObjs = []; }
MainScene.prototype._mAdd = function(o) { this.addUI(o); this.menuObjs.push(o); return o; }
MainScene.prototype._mText = function(x, y, str, size, color, ox, oy, stroke, strokeW) {
        const t = this.add.text(x, y, str, { fontFamily: FONT, fontSize: size + 'px', color: color, stroke: stroke || '#000', strokeThickness: strokeW === undefined ? 2 : strokeW, align: 'center' });
        t.setOrigin(ox === undefined ? 0.5 : ox, oy === undefined ? 0.5 : oy);
        return this._mAdd(t);
    }

    // Обновить только стиль выделения в простом списочном меню (MENU/LOBBY/PAUSE),
    // не пересоздавая текстовые объекты. Вызывается при перемещении выбора мышью/клавишами.
MainScene.prototype._restyleList = function(idx) {
        const L = this._listItems;
        if (!L) return;
        for (let i = 0; i < L.objs.length; i++) {
            const sel = i === idx;
            L.objs[i]
                .setText(sel ? '> ' + L.labels[i] + ' <' : L.labels[i])
                .setFontSize(sel ? L.selSize : L.baseSize)
                .setColor(sel ? '#ffffff' : '#00ffc8')
                .setStroke(sel ? '#ff0096' : '#000', sel ? 3 : 2);
        }
    }

MainScene.prototype.rebuildMenu = function() {
        this._clearMenu();
        this._listItems = null; // ссылки на тексты списочного меню (пересоздаются в _buildX)
        if (this.shop) this.shop.hide();
        const st = this.currentState;
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;

        const showBg = (st === GameState.MENU || st === GameState.SETTINGS || st === GameState.LOBBY || st === GameState.LEADERBOARD || st === GameState.RENAME_INPUT);
        this.menuBg.setVisible(showBg);
        this.lobbyPlayer.setVisible(st === GameState.LOBBY);
        const hudVisible = (st === GameState.PLAYING || st === GameState.PAUSED || st === GameState.LEVEL_UP || st === GameState.ABILITY_SELECT);
        this.hud.setVisible(hudVisible);

        // Скрыть динамические оверлеи вне активной игры
        if (st !== GameState.PLAYING) {
            this.phaseText.setVisible(false);
            this.phaseOverlay.setVisible(false);
            this.clearText.setVisible(false);
            this.warnRect.setVisible(false);
            this.upgradeMsg.setVisible(false);
        }

        if (st === GameState.MENU) this._buildMenuScreen();
        else if (st === GameState.LOBBY) this._buildLobby();
        else if (st === GameState.SHOP) this.shop.show();
        else if (st === GameState.SETTINGS) this._buildSettings();
        else if (st === GameState.LEADERBOARD) this._buildLeaderboard();
        else if (st === GameState.PAUSED) this._buildPause();
        else if (st === GameState.LEVEL_UP) this._buildLevelUp();
        else if (st === GameState.ABILITY_SELECT) this._buildAbilitySelect();
        else if (st === GameState.NAME_INPUT) this._buildNameInput();
        else if (st === GameState.RENAME_INPUT) this._buildRenameInput();
        else if (st === GameState.PLAYING && this.isGameOver) this._buildGameOver();
    }

MainScene.prototype._buildMenuScreen = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;
        this._mText(W / 2, H * 0.15, 'AwParty', 150, '#00ffc8', 0.5, 0.5, '#ffffff', 2);
        const items = [t('menu_play'), t('menu_records'), t('menu_settings')];
        const objs = [];
        for (let i = 0; i < items.length; i++) {
            const sel = i === this.selectedMenuIndex;
            objs.push(this._mText(W / 2, H * 0.45 + i * 110, sel ? '> ' + items[i] + ' <' : items[i],
                sel ? 75 : 60, sel ? '#ffffff' : '#00ffc8', 0.5, 0.5, sel ? '#ff0096' : '#000', sel ? 3 : 2));
        }
        this._listItems = { objs, labels: items, selSize: 75, baseSize: 60 };
    }

MainScene.prototype._buildLobby = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;
        this.lobbyPlayer.setPosition(W * 0.25, H * 0.55).setScale(1.2);
        this._mText(W * 0.7, H * 0.15, t('lobby_hub'), 100, '#00ffc8', 0.5, 0.5, '#ff0096', 4);
        const coin = this._mAdd(this.add.sprite(W * 0.7 - 70, H * 0.27, 'coin').setOrigin(0.5, 0.5));
        coin.setDisplaySize(50, 50);
        this._mText(W * 0.7 - 30, H * 0.25, '' + this.save.totalCoins, 50, '#ffff00', 0, 0.5);
        const items = [t('lobby_start'), t('lobby_shop'), t('lobby_back')];
        const objs = [];
        for (let i = 0; i < items.length; i++) {
            const sel = i === this.selectedLobbyIndex;
            objs.push(this._mText(W * 0.7, H * 0.45 + i * 110, sel ? '> ' + items[i] + ' <' : items[i],
                sel ? 75 : 60, sel ? '#ffffff' : '#00ffc8', 0.5, 0.5, sel ? '#ff0096' : '#000', sel ? 3 : 2));
        }
        this._listItems = { objs, labels: items, selSize: 75, baseSize: 60 };
    }

MainScene.prototype._buildSettings = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT, s = this.save;
        this._mText(W / 2, H * 0.11, 'AwParty', 110, '#00ffc8', 0.5, 0.5, '#ffffff', 2);
        const fps = C.FPS_LIMITS[s.currentFpsIndex];
        const langLabel = s.language === 'ru' ? t('lang_ru') : t('lang_en');
        const items = [
            t('set_hardcore') + ': ' + (s.isHardcoreMode ? t('on') : t('off')),
            t('set_fps') + ': < ' + (fps === 0 ? t('fps_uncapped') : fps) + ' >',
            t('set_window') + ': < ' + (s.isFullscreen ? t('win_full') : t('win_windowed')) + ' >',
            t('set_sound') + ': < ' + s.soundVolume + '% >',
            t('set_effects') + ': < ' + s.effectsVolume + '% >',
            t('set_language') + ': < ' + langLabel + ' >',
            t('set_rename') + ': ' + (s.playerName ? s.playerName : t('not_set')),
            t('back'),
        ];
        for (let i = 0; i < items.length; i++) {
            const sel = i === this.selectedSettingIndex;
            this._mText(W / 2, H * 0.25 + i * 84, sel ? '> ' + items[i] + ' <' : items[i],
                sel ? 46 : 38, sel ? '#ffffff' : '#00ffc8', 0.5, 0.5, sel ? '#ff0096' : '#000', sel ? 3 : 2);
        }
        if (this.cheatMessageTimer > 0) this._mText(50, H - 110, this.cheatMessage, 28, '#ffff00', 0, 0);
    }

MainScene.prototype._buildLeaderboard = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;
        this._mAdd(this.add.rectangle(0, 0, W, H, 0x000000, 160 / 255).setOrigin(0, 0));
        this._mText(W / 2, 50, t('lb_title'), 100, '#ffd700', 0.5, 0, '#b40050', 5);
        // Заголовок режима + переключатель.
        const hc = this.lbView === 'hardcore';
        this._mText(W / 2, 215, '<  ' + (hc ? t('lb_hardcore') : t('lb_normal')) + '  >', 44, hc ? '#ff5050' : '#00ffc8', 0.5, 0.5, '#000', 3);
        const board = this.leaderboards[this.lbView];
        const rowY0 = 300, rowH = 54;
        const colX = [W * 0.10, W * 0.20, W * 0.58, W * 0.78];
        const hdrs = [t('lb_col_num'), t('lb_col_name'), t('lb_col_time'), t('lb_col_date')];
        for (let i = 0; i < 4; i++) this._mText(colX[i], rowY0 - 38, hdrs[i], 26, '#00ffc8', 0, 0);
        for (let i = 0; i < 10; i++) {
            const y = rowY0 + i * rowH;
            const e = board[i];
            const isNew = i === this.leaderboardNewEntryIndex;
            const col = e.time > 0 ? (isNew ? '#ffd700' : '#dcd7eb') : '#504b5f';
            this._mText(colX[0], y, '' + (i + 1), 30, col, 0, 0);
            if (e.time > 0) {
                this._mText(colX[1], y, e.name, 30, col, 0, 0);
                this._mText(colX[2], y, formatTime(e.time), 30, col, 0, 0);
                const pad = (n) => (n < 10 ? '0' + n : '' + n);
                this._mText(colX[3], y, pad(e.day) + '.' + pad(e.month) + '.' + e.year, 30, col, 0, 0);
            } else this._mText(colX[1], y, '---', 30, col, 0, 0);
        }
        this._mText(W / 2, H * 0.86, t('lb_hint_switch'), 30, '#7d78a0', 0.5, 0, '#000', 2);
        this._mText(W / 2, H * 0.92, t('lb_hint_back'), 36, '#00ffc8', 0.5, 0);
    }

MainScene.prototype._buildPause = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;
        this._mAdd(this.add.rectangle(0, 0, W, H, 0x0a001e, 200 / 255).setOrigin(0, 0));
        this._mText(W / 2, H / 2 - 150, t('pause_title'), 130, '#ffffff', 0.5, 0.5, '#000', 3);
        const items = [t('pause_resume'), t('pause_restart'), t('pause_quit')];
        const objs = [];
        for (let i = 0; i < items.length; i++) {
            const sel = i === this.selectedPauseIndex;
            objs.push(this._mText(W / 2, H / 2 + 50 + i * 100, sel ? '> ' + items[i] + ' <' : items[i],
                sel ? 70 : 55, sel ? '#ffffff' : '#00ffc8', 0.5, 0.5, sel ? '#ff0096' : '#000', sel ? 3 : 2));
        }
        this._listItems = { objs, labels: items, selSize: 70, baseSize: 55 };
    }

MainScene.prototype._buildGameOver = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;
        this._mAdd(this.add.rectangle(0, 0, W, H, 0x1e000a, 220 / 255).setOrigin(0, 0));
        this._mText(W / 2, H / 2, t('gameover'), 80, '#ffffff', 0.5, 0.5, '#000', 3);
        this._mText(W / 2, H / 2 + 220, t('gameover_records'), 32, '#00ffc8', 0.5, 0);
    }

MainScene.prototype._buildNameInput = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;
        this._mAdd(this.add.rectangle(0, 0, W, H, 0x0a001e, 230 / 255).setOrigin(0, 0));
        this._mText(W / 2, H * 0.22, t('name_new_record'), 110, '#ffd700', 0.5, 0.5, '#b40050', 5);
        this._mText(W / 2, H * 0.36, t('name_time') + '  ' + formatTime(this.survivalTimer), 46, '#00ffc8', 0.5, 0.5, '#000', 3);
        this._mText(W / 2, H * 0.48, t('name_enter'), 38, '#dcd7eb', 0.5, 0.5, '#000', 2);

        // Поле ввода + текст с курсором-подчёркиванием.
        const boxW = 760, boxH = 96, boxY = H * 0.58;
        const errored = !!this._nameError;
        this._mAdd(this.add.rectangle(W / 2, boxY, boxW, boxH, 0x140028, 1).setOrigin(0.5, 0.5).setStrokeStyle(3, errored ? 0xff3264 : 0x9600ff));
        this._mText(W / 2, boxY, this.nameInput + '_', 50, '#ffffff', 0.5, 0.5, '#000', 2);

        if (errored) this._mText(W / 2, H * 0.66, this._nameError, 34, '#ff5078', 0.5, 0.5, '#000', 2);
        this._mText(W / 2, H * 0.74, t('name_hint'), 30, '#7d78a0', 0.5, 0.5, '#000', 2);
    }

MainScene.prototype._buildRenameInput = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;
        this._mAdd(this.add.rectangle(0, 0, W, H, 0x0a001e, 230 / 255).setOrigin(0, 0));
        this._mText(W / 2, H * 0.20, t('rename_title'), 100, '#ffd700', 0.5, 0.5, '#b40050', 5);
        this._mText(W / 2, H * 0.34, t('rename_current') + '  ' + (this.save.playerName || t('not_set')), 40, '#00ffc8', 0.5, 0.5, '#000', 3);
        this._mText(W / 2, H * 0.46, t('rename_new'), 38, '#dcd7eb', 0.5, 0.5, '#000', 2);

        const boxW = 760, boxH = 96, boxY = H * 0.56;
        const errored = !!this._renameError;
        this._mAdd(this.add.rectangle(W / 2, boxY, boxW, boxH, 0x140028, 1).setOrigin(0.5, 0.5).setStrokeStyle(3, errored ? 0xff3264 : 0x9600ff));
        this._mText(W / 2, boxY, this.renameInput + '_', 50, '#ffffff', 0.5, 0.5, '#000', 2);

        if (this._renameBusy) this._mText(W / 2, H * 0.64, t('rename_saving'), 34, '#ffd700', 0.5, 0.5, '#000', 2);
        else if (errored) this._mText(W / 2, H * 0.64, this._renameError, 34, '#ff5078', 0.5, 0.5, '#000', 2);

        this._mText(W / 2, H * 0.74, t('rename_merge_note'), 26, '#7d78a0', 0.5, 0.5, '#000', 2);
        this._mText(W / 2, H * 0.80, t('rename_hint'), 30, '#7d78a0', 0.5, 0.5, '#000', 2);
    }

MainScene.prototype._buildLevelUp = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;
        this._mAdd(this.add.rectangle(0, 0, W, H, 0x0a001e, 220 / 255).setOrigin(0, 0));
        this._mText(W / 2, 150, t('levelup'), 100, '#ffff00', 0.5, 0.5, '#ff0096', 5);
        this.levelUpCards = [];
        for (let i = 0; i < 3; i++) {
            const uId = this.levelUpIds[i];
            const cx = W / 2 + (i - 1) * 450;
            const cy = H / 2 + 50;
            // Легендарные карты — золотая рамка/заголовок и бейдж, без звёзд-этапов.
            const isLegendary = LEGENDARY_UPGRADE_IDS.includes(uId);
            const fill = isLegendary ? 0x2a2000 : 0x140028;
            const strokeCol = isLegendary ? 0xffd200 : 0x9600ff;
            const strokeW = isLegendary ? 7 : 5;
            const titleCol = isLegendary ? '#ffd200' : '#00ffc8';
            const rect = this._mAdd(this.add.rectangle(cx, cy, 400, 550, fill, 240 / 255).setOrigin(0.5, 0.5).setStrokeStyle(strokeW, strokeCol));
            const title = this._mText(cx, cy - 230, t('upgrade_titles')[uId], 35, titleCol, 0.5, 0);
            const icon = this._mAdd(this.add.sprite(cx, cy - 30, UPGRADE_ICONS[uId]).setOrigin(0.5, 0.5));
            const iscale = 180 / icon.width;
            icon.setScale(iscale);
            const desc = this._mText(cx, cy + 110, t('upgrade_descs')[uId], 25, '#ffffff', 0.5, 0);
            let badgeObj = null;
            const cnt = this.runUpgradeLevels[uId];
            if (isLegendary) {
                badgeObj = this._mText(cx, cy + 215, t('card_legendary'), 26, '#ffd200', 0.5, 0.5, '#643c00', 3);
            } else if (cnt > 0) {
                let stars = '';
                for (let s = 0; s < cnt; s++) stars += '*';
                badgeObj = this._mText(cx, cy + 215, stars, 28, '#ffd200', 0.5, 0.5, '#643c00', 2);
            }
            const objs = [rect, title, icon, desc]; if (badgeObj) objs.push(badgeObj);
            const baseY = objs.map(o => o.y);
            const baseSX = [1, 1, iscale, 1]; if (badgeObj) baseSX.push(1);
            this.levelUpCards.push({ rect, objs, baseY, baseSX, uId });
        }
        this._animateLevelUp();
    }

MainScene.prototype._buildAbilitySelect = function() {
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;
        this._mAdd(this.add.rectangle(0, 0, W, H, 0x080014, 210 / 255).setOrigin(0, 0));
        this._mText(W / 2, 130, t('ability_choose'), 80, '#dcb4ff', 0.5, 0.5, '#000', 4);
        const count = this.pendingAbilityCount;
        const gap = 430, cardW = 360, cardH = 560;
        const totalW = (count - 1) * gap;
        const startX = W / 2 - totalW / 2;
        const cy = H / 2 + 20;
        const keyLabels = ['[Q]', '[E]', '[R]'];
        const colHex = { 0: '#ffd700', 1: '#ff5000', 2: '#b400ff', 3: '#00e6ff' };
        this.abilityCards = [];
        for (let i = 0; i < count; i++) {
            const id = this.pendingAbilityIds[i];
            const cx = startX + i * gap;
            const rect = this._mAdd(this.add.rectangle(cx, cy, cardW, cardH, 0x120024, 245 / 255).setOrigin(0.5, 0.5).setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(colHex[id]).color));
            const title = this._mText(cx, cy - cardH / 2 + 28, t('ability_names')[id], 38, colHex[id], 0.5, 0, '#000', 3);
            const objs = [rect, title];
            const baseSX = [1, 1];
            const iconKey = ABILITY_ICONS[id];
            if (iconKey && this.textures.exists(iconKey)) {
                const icon = this._mAdd(this.add.sprite(cx, cy - cardH / 2 + 160, iconKey).setOrigin(0.5, 0.5));
                const iscale = 110 / Math.max(icon.width, icon.height);
                icon.setScale(iscale);
                objs.push(icon); baseSX.push(iscale);
            }
            const cd = ABILITY_COOLDOWNS[id];
            let desc = '';
            if (id === 0) desc = t('ability_desc_0') + '\n\n' + t('cooldown') + ': ' + cd + 's';
            else if (id === 1) desc = t('ability_desc_1') + '\n\n' + t('cooldown') + ': ' + cd + 's';
            else if (id === 2) desc = t('ability_desc_2') + '\n\n' + t('cooldown') + ': ' + cd + 's';
            else if (id === 3) desc = t('ability_desc_3') + '\n\n' + t('cooldown') + ': ' + cd + 's';
            const descObj = this._mText(cx, cy - cardH / 2 + 295, desc, 22, '#c8c3dc', 0.5, 0, '#000', 2);
            const slot = this.pendingSlot;
            const keyObj = this._mText(cx, cy + cardH / 2 - 70, (slot >= 0 && slot < 3) ? keyLabels[slot] : '[?]', 32, '#00f0c8', 0.5, 0, '#000', 2);
            objs.push(descObj, keyObj); baseSX.push(1, 1);
            this.abilityCards.push({ rect, id, cx, cy, w: cardW, h: cardH, objs, baseSX, stroke: Phaser.Display.Color.HexStringToColor(colHex[id]).color });
        }
        this._highlightAbility();
    }

MainScene.prototype._highlightAbility = function() {
        if (!this.abilityCards) return;
        for (let i = 0; i < this.abilityCards.length; i++) {
            const card = this.abilityCards[i];
            const sel = (i === this.selectedAbilityIndex);
            const scale = sel ? 1.05 : 1;
            card.objs.forEach((o, idx) => o.setScale(scale * card.baseSX[idx]));
            card.rect.setStrokeStyle(sel ? 6 : 4, sel ? 0xffffff : card.stroke);
        }
    }

    // ===================== ВВОД =====================
MainScene.prototype.onPointerMove = function(p) {
        const st = this.currentState;
        const x = p.x, y = p.y;
        const hit = (rx, ry, rw, rh) => x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;

        if (st === GameState.MENU) {
            let ns = -1;
            for (let i = 0; i < 3; i++) if (hit(W / 2 - 200, H * 0.45 + i * 110 - 40, 400, 80)) ns = i;
            if (ns !== -1 && ns !== this.selectedMenuIndex) { this.selectedMenuIndex = ns; this._restyleList(ns); }
        } else if (st === GameState.SETTINGS) {
            let ns = -1;
            for (let i = 0; i < 8; i++) if (hit(W / 2 - 300, H * 0.25 + i * 84 - 32, 600, 64)) ns = i;
            if (ns !== -1 && ns !== this.selectedSettingIndex) { this.selectedSettingIndex = ns; this.rebuildMenu(); }
        } else if (st === GameState.LOBBY) {
            let ns = -1;
            for (let i = 0; i < 3; i++) if (hit(W * 0.7 - 250, H * 0.45 + i * 110 - 40, 500, 80)) ns = i;
            if (ns !== -1 && ns !== this.selectedLobbyIndex) { this.selectedLobbyIndex = ns; this._restyleList(ns); }
        } else if (st === GameState.PAUSED) {
            let ns = -1;
            for (let i = 0; i < 3; i++) if (hit(W / 2 - 250, H / 2 + 50 + i * 100 - 40, 500, 80)) ns = i;
            if (ns !== -1 && ns !== this.selectedPauseIndex) { this.selectedPauseIndex = ns; this._restyleList(ns); }
        } else if (st === GameState.SHOP) {
            this.shop.updateHover(x, y);
        } else if (st === GameState.LEVEL_UP) {
            if (this.levelUpAnimTimer >= 1) {
                let ns = -1;
                for (let i = 0; i < 3; i++) { const cx = W / 2 + (i - 1) * 450, cy = H / 2 + 50; if (hit(cx - 200, cy - 275, 400, 550)) ns = i; }
                this.selectedLevelUpIndex = ns;
            }
        } else if (st === GameState.ABILITY_SELECT) {
            if (this.abilitySelectAnimTimer >= 0.5 && this.abilityCards) {
                let ns = -1;
                for (let i = 0; i < this.abilityCards.length; i++) {
                    const card = this.abilityCards[i];
                    if (hit(card.cx - card.w / 2, card.cy - card.h / 2, card.w, card.h)) ns = i;
                }
                if (ns !== this.selectedAbilityIndex) { this.selectedAbilityIndex = ns; this._highlightAbility(); }
            }
        }
    }

MainScene.prototype.onPointerDown = function(p) {
        const st = this.currentState;
        const x = p.x, y = p.y;
        const hit = (rx, ry, rw, rh) => x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
        const W = C.VIEW_WIDTH, H = C.VIEW_HEIGHT;

        if (st === GameState.MENU) {
            for (let i = 0; i < 3; i++) if (hit(W / 2 - 200, H * 0.45 + i * 110 - 40, 400, 80)) { this.selectedMenuIndex = i; this._menuActivate(); return; }
        } else if (st === GameState.LEADERBOARD) {
            if (hit(W / 2 - 150, H * 0.9 - 30, 300, 60)) this.setState(this.leaderboardFromMenu ? GameState.MENU : GameState.LOBBY);
        } else if (st === GameState.SETTINGS) {
            for (let i = 0; i < 8; i++) if (hit(W / 2 - 300, H * 0.25 + i * 84 - 32, 600, 64)) { this.selectedSettingIndex = i; this._settingsActivate(); return; }
        } else if (st === GameState.PAUSED) {
            for (let i = 0; i < 3; i++) if (hit(W / 2 - 250, H / 2 + 50 + i * 100 - 40, 500, 80)) { this.selectedPauseIndex = i; this._pauseActivate(); return; }
        } else if (st === GameState.LOBBY) {
            for (let i = 0; i < 3; i++) if (hit(W * 0.7 - 250, H * 0.45 + i * 110 - 40, 500, 80)) { this.selectedLobbyIndex = i; this._lobbyActivate(); return; }
        } else if (st === GameState.SHOP) {
            const r = this.shop.handleClick(x, y);
            if (r === 'back') { this.audio.play('sfx_menu_click'); this.saveGame(); this.setState(GameState.LOBBY); }
        } else if (st === GameState.LEVEL_UP) {
            if (this.levelUpAnimTimer >= 1) {
                for (let i = 0; i < 3; i++) { const cx = W / 2 + (i - 1) * 450, cy = H / 2 + 50; if (hit(cx - 200, cy - 275, 400, 550)) { this.applyUpgrade(this.levelUpIds[i]); return; } }
            }
        } else if (st === GameState.ABILITY_SELECT) {
            if (this.abilitySelectAnimTimer >= 0.5 && this.abilityCards) {
                for (const card of this.abilityCards) {
                    if (hit(card.cx - card.w / 2, card.cy - card.h / 2, card.w, card.h)) { this._chooseAbility(card.id); return; }
                }
            }
        }
    }

MainScene.prototype._chooseAbility = function(id) {
        for (let sIdx = 0; sIdx < 3; sIdx++) {
            if (this.equippedAbilities[sIdx] < 0) {
                this.equippedAbilities[sIdx] = id;
                this.abilityCooldowns[sIdx] = 0;
                this.abilityMaxCooldowns[sIdx] = ABILITY_COOLDOWNS[id] || 1;
                break;
            }
        }
        this.pendingAbilityCount = 0;
        this.setState(GameState.PLAYING);
    }

MainScene.prototype._menuActivate = function() {
        this.audio.play('sfx_menu_click');
        const i = this.selectedMenuIndex;
        if (i === 0) this.setState(GameState.LOBBY);
        else if (i === 1) { this.leaderboardFromMenu = true; this.leaderboardNewEntryIndex = -1; this._pendingHighlight = null; this.lbView = 'normal'; this.setState(GameState.LEADERBOARD); }
        else if (i === 2) this.setState(GameState.SETTINGS);
    }
MainScene.prototype._lobbyActivate = function() {
        this.audio.play('sfx_menu_click');
        const i = this.selectedLobbyIndex;
        if (i === 0) { this.resetGame(); this.setState(GameState.PLAYING); }
        else if (i === 1) { this.shop.reset(); this.setState(GameState.SHOP); }
        else if (i === 2) { this.saveGame(); this.setState(GameState.MENU); }
    }
MainScene.prototype._settingsActivate = function() {
        this.audio.play('sfx_menu_click');
        const i = this.selectedSettingIndex, s = this.save;
        if (i === 0) { s.isHardcoreMode = !s.isHardcoreMode; this.saveGame(); this.rebuildMenu(); }
        else if (i === 1) { s.currentFpsIndex = (s.currentFpsIndex + 1) % 5; this.applyFpsLimit(); this.saveGame(); this.rebuildMenu(); }
        else if (i === 2) { s.isFullscreen = !s.isFullscreen; if (s.isFullscreen) { if (!this.scale.isFullscreen) this.scale.startFullscreen(); } else if (this.scale.isFullscreen) this.scale.stopFullscreen(); this.saveGame(); this.rebuildMenu(); }
        else if (i === 3) { this._adjustVolume('sound', +1); }
        else if (i === 4) { this._adjustVolume('effects', +1); }
        else if (i === 5) { this._toggleLanguage(); }
        else if (i === 6) { this._openRename(); }
        else if (i === 7) { this.saveGame(); this.setState(GameState.MENU); }
    }

    // Переключить язык интерфейса en<->ru, применить и сохранить.
MainScene.prototype._toggleLanguage = function() {
        const s = this.save;
        s.language = (s.language === 'ru') ? 'en' : 'ru';
        setLanguage(s.language);
        this.saveGame();
        this.rebuildMenu();
    }

MainScene.prototype._openRename = function() {
        if (!this.save.playerName) {
            this.cheatMessage = t('cheat_noname');
            this.cheatMessageTimer = 3;
            this.rebuildMenu();
            return;
        }
        this.renameInput = this.save.playerName;
        this._renameError = '';
        this._renameBusy = false;
        this.setState(GameState.RENAME_INPUT);
    }

MainScene.prototype._confirmRename = function() {
        if (this._renameBusy) return;
        const oldName = this.save.playerName;
        const typed = this.renameInput.trim();
        if (!oldName) { this.setState(GameState.SETTINGS); return; }
        if (!typed) { this._renameError = t('err_enter_name'); this.rebuildMenu(); return; }
        if (typed === oldName) { this.setState(GameState.SETTINGS); return; }
        this._renameBusy = true;
        this._renameError = '';
        this.rebuildMenu();
        // Удалённо (мёрж по лучшему времени), затем локально.
        RemoteLeaderboard.rename(oldName, typed, (ok) => {
            if (this.currentState !== GameState.RENAME_INPUT) return;
            this._renameBusy = false;
            if (!ok) { this._renameError = t('err_server'); this.rebuildMenu(); return; }
            this._applyLocalRename(oldName, typed);
            this.save.playerName = typed;
            this.saveGame();
            this.audio.play('sfx_menu_click');
            this.setState(GameState.SETTINGS);
        });
    }

    // Переименовать игрока в локальном кэше обеих таблиц; слить дубликаты по лучшему времени.
MainScene.prototype._applyLocalRename = function(oldName, newName) {
        for (const mode of ['normal', 'hardcore']) {
            const src = this.leaderboards[mode] || [];
            const merged = []; // лучшая запись на имя
            for (const raw of src) {
                if (!raw || raw.time <= 0) continue;
                const e = Object.assign({}, raw);
                if (e.name === oldName) e.name = newName;
                const j = merged.findIndex(m => m.name === e.name);
                if (j === -1) merged.push(e);
                else if (e.time > merged[j].time) merged[j] = e;
            }
            merged.sort((a, b) => b.time - a.time);
            const list = merged.slice(0, 10);
            while (list.length < 10) list.push({ name: '', time: 0, day: 0, month: 0, year: 0 });
            this.leaderboards[mode] = list;
            SaveSystem.saveLeaderboard(list, mode === 'hardcore');
        }
    }

    // Изменить громкость на dir*10 (с обёрткой 0..100), применить к аудио и сохранить.
MainScene.prototype._adjustVolume = function(which, dir) {
        const s = this.save;
        if (which === 'sound') {
            s.soundVolume = (s.soundVolume + dir * 10 + 110) % 110;
            this.audio.setMusicVolume(s.soundVolume / 100);
        } else {
            s.effectsVolume = (s.effectsVolume + dir * 10 + 110) % 110;
            this.audio.sfxVolume = s.effectsVolume / 100;
            this.audio.play('sfx_menu_click'); // звуковой предпросмотр громкости SFX
        }
        this.saveGame();
        this.rebuildMenu();
    }
MainScene.prototype._pauseActivate = function() {
        this.audio.play('sfx_menu_click');
        const i = this.selectedPauseIndex;
        if (i === 0) this.setState(GameState.PLAYING);
        else if (i === 1) { this.resetGame(); this.setState(GameState.PLAYING); }
        else if (i === 2) { this.saveGame(); this.setState(GameState.LOBBY); }
    }

MainScene.prototype.onKeyDown = function(e) {
        const st = this.currentState;
        const code = e.code; // 'KeyW' и т.п.
        const up = (code === 'KeyW' || code === 'ArrowUp');
        const down = (code === 'KeyS' || code === 'ArrowDown');
        const left = (code === 'KeyA' || code === 'ArrowLeft');
        const right = (code === 'KeyD' || code === 'ArrowRight');
        const enter = (code === 'Enter' || code === 'Space');
        const esc = (code === 'Escape');

        if (st === GameState.MENU) {
            if (up) { this.selectedMenuIndex = (this.selectedMenuIndex + 2) % 3; this._restyleList(this.selectedMenuIndex); }
            if (down) { this.selectedMenuIndex = (this.selectedMenuIndex + 1) % 3; this._restyleList(this.selectedMenuIndex); }
            if (enter) this._menuActivate();
        } else if (st === GameState.LOBBY) {
            if (up) { this.selectedLobbyIndex = (this.selectedLobbyIndex + 2) % 3; this._restyleList(this.selectedLobbyIndex); }
            if (down) { this.selectedLobbyIndex = (this.selectedLobbyIndex + 1) % 3; this._restyleList(this.selectedLobbyIndex); }
            if (enter) this._lobbyActivate();
            if (esc) { this.saveGame(); this.setState(GameState.MENU); }
        } else if (st === GameState.SHOP) {
            if (up) { this.shop.navigate(-1, 0); this.shop.redraw(); }
            if (down) { this.shop.navigate(1, 0); this.shop.redraw(); }
            if (left) { this.shop.navigate(0, -1); this.shop.redraw(); }
            if (right) { this.shop.navigate(0, 1); this.shop.redraw(); }
            if (enter) { this.shop._buyAndNotify(); this.saveGame(); this.shop.redraw(); }
            if (esc) { this.audio.play('sfx_menu_click'); this.saveGame(); this.setState(GameState.LOBBY); }
        } else if (st === GameState.SETTINGS) {
            if (up) { this.selectedSettingIndex = (this.selectedSettingIndex + 7) % 8; this.rebuildMenu(); }
            if (down) { this.selectedSettingIndex = (this.selectedSettingIndex + 1) % 8; this.rebuildMenu(); }
            if (left && this.selectedSettingIndex === 1) { this.save.currentFpsIndex = (this.save.currentFpsIndex + 4) % 5; this.applyFpsLimit(); this.saveGame(); this.rebuildMenu(); }
            if (right && this.selectedSettingIndex === 1) { this.save.currentFpsIndex = (this.save.currentFpsIndex + 1) % 5; this.applyFpsLimit(); this.saveGame(); this.rebuildMenu(); }
            if (this.selectedSettingIndex === 3) { if (left) this._adjustVolume('sound', -1); if (right) this._adjustVolume('sound', +1); }
            if (this.selectedSettingIndex === 4) { if (left) this._adjustVolume('effects', -1); if (right) this._adjustVolume('effects', +1); }
            if ((left || right) && this.selectedSettingIndex === 5) { this._toggleLanguage(); }
            if (enter) this._settingsActivate();
            if (esc) { this.saveGame(); this.setState(GameState.MENU); }
            // Чит-код 'givecoinz'
            if (e.key && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                this.cheatBuffer = (this.cheatBuffer + e.key.toLowerCase()).slice(-32);
                if (this.cheatBuffer.indexOf('givecoinz') !== -1) {
                    this.save.totalCoins += 500; this.cheatMessage = t('cheat_gave'); this.cheatMessageTimer = 3;
                    this.saveGame(); this.cheatBuffer = ''; this.rebuildMenu();
                }
            }
        } else if (st === GameState.LEADERBOARD) {
            if (left) this._setLbView('normal');
            if (right) this._setLbView('hardcore');
            if (esc || code === 'Enter') this.setState(this.leaderboardFromMenu ? GameState.MENU : GameState.LOBBY);
        } else if (st === GameState.NAME_INPUT) {
            if (code === 'Backspace') { this.nameInput = this.nameInput.slice(0, -1); this._nameError = ''; this.rebuildMenu(); if (e.preventDefault) e.preventDefault(); }
            else if (code === 'Enter' || code === 'Escape') { this._confirmNameInput(); }
            else if (e.key && e.key.length === 1) {
                // Любой печатный символ (вкл. кириллицу), кроме управляющих и DEL.
                const cc = e.key.charCodeAt(0);
                if (cc >= 32 && cc !== 127 && this.nameInput.length < 20) { this.nameInput += e.key; this._nameError = ''; this.rebuildMenu(); }
            }
        } else if (st === GameState.RENAME_INPUT) {
            if (this._renameBusy) { if (e.preventDefault) e.preventDefault(); return; }
            if (code === 'Backspace') { this.renameInput = this.renameInput.slice(0, -1); this._renameError = ''; this.rebuildMenu(); if (e.preventDefault) e.preventDefault(); }
            else if (code === 'Escape') { this.audio.play('sfx_menu_click'); this.setState(GameState.SETTINGS); }
            else if (code === 'Enter') { this._confirmRename(); }
            else if (e.key && e.key.length === 1) {
                // Любой печатный символ (вкл. кириллицу), кроме управляющих и DEL.
                const cc = e.key.charCodeAt(0);
                if (cc >= 32 && cc !== 127 && this.renameInput.length < 20) { this.renameInput += e.key; this._renameError = ''; this.rebuildMenu(); }
            }
        } else if (st === GameState.PLAYING) {
            if (this.isGameOver) {
                if (code === 'KeyR') { this.saveGame(); this.resetGame(); this.rebuildMenu(); }
                if (code === 'KeyQ') { this.saveGame(); this.setState(GameState.LOBBY); }
                if (code === 'KeyL') { this.leaderboardFromMenu = false; this._pendingHighlight = null; this.lbView = 'normal'; this.setState(GameState.LEADERBOARD); }
            } else {
                if (esc) { this.selectedPauseIndex = 0; this.setState(GameState.PAUSED); }
                if (code === 'KeyQ') this.activateAbility(0);
                if (code === 'KeyE') this.activateAbility(1);
                if (code === 'KeyR') this.activateAbility(2);
            }
        } else if (st === GameState.PAUSED) {
            if (esc) this.setState(GameState.PLAYING);
            if (up) { this.selectedPauseIndex = (this.selectedPauseIndex + 2) % 3; this._restyleList(this.selectedPauseIndex); }
            if (down) { this.selectedPauseIndex = (this.selectedPauseIndex + 1) % 3; this._restyleList(this.selectedPauseIndex); }
            if (enter) this._pauseActivate();
        }
    }
