// src/updater.js — авто-апдейтер клиента. Работающая вкладка замечает новый деплой
// (по ASSET_VER в свежем index.html) и перезагружается на него — но ТОЛЬКО находясь
// в меню, чтобы не оборвать забег. Открытые вкладки больше не застревают на старой
// версии при будущих деплоях (сегодняшние старые вкладки не чинит — в них нет этого
// кода). Дизайн: docs/superpowers/specs/2026-06-28-client-auto-updater-design.md

const Updater = {
    pending: false,        // замечена версия новее текущей
    _isAtMenu: null,       // () => bool — игрок в безопасном месте (меню)
    _timer: null,
    CHECK_INTERVAL_MS: 10 * 60 * 1000,  // бэкстоп для всегда-открытых вкладок

    // Число версии (ASSET_VER) из текста index.html; null если не найдено.
    _parseVer(html) {
        const m = /ASSET_VER\s*=\s*['"](\d+)['"]/.exec(html || '');
        return m ? parseInt(m[1], 10) : null;
    },

    // Обновляться ли: remote распарсился, конечное число и СТРОГО больше локального
    // (строгое сравнение = защита от петли перезагрузок).
    _shouldUpdate(html, localVer) {
        const remote = this._parseVer(html);
        return remote !== null && Number.isFinite(remote) && remote > localVer;
    },

    // Перезапросить index.html (no-store + ?cb=ts уникализирует URL → мимо CDN-кэша
    // GitHub Pages) и сверить версию. Любая ошибка/офлайн — молчаливый no-op.
    check() {
        const local = (typeof window !== 'undefined' && window.ASSET_VER) ? (window.ASSET_VER | 0) : 0;
        return fetch('index.html?cb=' + Date.now(), { cache: 'no-store' })
            .then(r => r.ok ? r.text() : Promise.reject(r.status))
            .then(html => { if (this._shouldUpdate(html, local)) this.pending = true; })
            .catch(() => {});
    },

    // Применить обновление, только если оно есть И игрок в безопасном месте (меню).
    // Перезагрузка показывает экран #loader index.html — это и есть визуальный фидбек.
    maybeApply() {
        if (!this.pending) return;
        if (typeof this._isAtMenu === 'function' && !this._isAtMenu()) return;
        try { location.reload(); } catch (e) {}
    },

    // isAtMenu: () => bool. Вешает триггеры: возврат во вкладку + бэкстоп-интервал.
    init(isAtMenu) {
        this._isAtMenu = isAtMenu || null;
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) this.check().then(() => this.maybeApply());
            });
        }
        if (typeof setInterval !== 'undefined') {
            this._timer = setInterval(() => {
                if (typeof document !== 'undefined' && document.hidden) return;
                this.check().then(() => this.maybeApply());
            }, this.CHECK_INTERVAL_MS);
        }
    },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Updater };
