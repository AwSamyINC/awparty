
// Лёгкая аналитика на своём Supabase (без сторонних сервисов и SDK).
// Структура 1:1 как у CloudSave / RemoteLeaderboard: fetch к /rest/v1/...,
// тот же anon-ключ, тихий фолбэк если Supabase не сконфигурен.
// Только write-only: аноним может INSERT в таблицу analytics_events, читать нельзя.
// Приватность: шлём лишь случайный cid (без ника и какой-либо персоналки).
const Analytics = {
    configured() { return !!(SUPABASE_URL && SUPABASE_ANON_KEY); },

    _headers() {
        return {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
        };
    },

    // Стабильный анонимный id браузера — нужен для удержания (один и тот же
    // игрок в разные дни). Случайный uuid в localStorage, без персоналки.
    _cid() {
        try {
            let id = localStorage.getItem('awparty_cid');
            if (!id) {
                id = (window.crypto && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                        const r = Math.random() * 16 | 0;
                        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                    });
                localStorage.setItem('awparty_cid', id);
            }
            return id;
        } catch (e) { return 'no-storage'; }
    },

    // Fire-and-forget: ошибки глотаются, аналитика НИКОГДА не влияет на игру.
    track(event, props) {
        if (!this.configured() || !event) return;
        try {
            fetch(SUPABASE_URL + '/rest/v1/analytics_events', {
                method: 'POST',
                headers: Object.assign(this._headers(), { 'Prefer': 'return=minimal' }),
                body: JSON.stringify({ cid: this._cid(), event: event, props: props || {} }),
            }).catch(function () {});
        } catch (e) { /* never throw from analytics */ }
    },
};
