# Безопасность таблицы рекордов (Supabase)

Общая таблица рекордов работает через Supabase REST/RPC. Публичный `anon`-ключ
лежит в [src/config.js](src/config.js) — **так и задумано**: ключ публичный по дизайну,
он не является секретом. Безопасность держится не на ключе, а на:

1. **RLS-политиках** (Row Level Security) таблицы `leaderboard`.
2. **Серверной валидации** внутри RPC-функций `submit_score` и `rename_player`.

> ⚠️ Клиентская фильтрация ника (длина ≤ 20, только печатные символы — см.
> `onKeyDown` в [src/scene_ui.js](src/scene_ui.js)) — это удобство, **а не граница
> безопасности**. Имея публичный `anon`-ключ, кто угодно может вызвать RPC напрямую
> с произвольными `name`/`time`. Поэтому всё перечисленное ниже **обязано**
> проверяться на сервере.

## Что должно быть настроено на стороне Supabase

### 1. RLS
- На таблице `leaderboard` включить RLS.
- Запретить прямой `INSERT`/`UPDATE`/`DELETE` под ролью `anon`.
- Разрешить `anon` только `SELECT` (для топа) — и запись исключительно через
  `SECURITY DEFINER`-функции `submit_score` / `rename_player`.

### 2. Валидация в `submit_score`
RPC обязан, как минимум:
- **Ограничить время сверху** разумным потолком (рекорд не может превышать,
  например, нескольких часов) — отсекает явную накрутку `time`.
- **Проверить, что `time` — конечное неотрицательное число** (не `NaN`/`Infinity`).
- **Санитизировать имя**: обрезать длину, убрать управляющие символы и переводы строк.
- **Хранить одну запись на игрока в режиме** (`name + mode`), оставляя лучшее время.
- **Ограничить частоту вызовов** (rate limit) — чтобы нельзя было залить таблицу.

### 3. Валидация в `rename_player`
- Те же проверки имени, что и выше.
- Слияние записей по лучшему времени при коллизии нового имени (уже учтено клиентом
  как fallback, но решающее слово — за сервером).

## Пример усиленной `submit_score` (PL/pgSQL)

```sql
create or replace function submit_score(p_name text, p_time numeric, p_mode text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_mode text;
begin
  -- режим — из белого списка
  v_mode := case when p_mode = 'hardcore' then 'hardcore' else 'normal' end;

  -- время: конечное, в разумных пределах (0..6 часов)
  if p_time is null or p_time <> p_time /* NaN */ or p_time < 0 or p_time > 21600 then
    raise exception 'invalid time';
  end if;

  -- имя: убрать управляющие символы/переводы строк, обрезать длину
  v_name := regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]', '', 'g');
  v_name := btrim(v_name);
  if v_name = '' then v_name := 'Anonymous'; end if;
  v_name := left(v_name, 20);

  -- одна запись на игрока в режиме, хранит лучшее время
  insert into leaderboard (name, mode, time, created_at)
  values (v_name, v_mode, p_time, now())
  on conflict (name, mode)
  do update set time = greatest(leaderboard.time, excluded.time),
                created_at = case when excluded.time > leaderboard.time
                                  then now() else leaderboard.created_at end;
end;
$$;
```

(Для `on conflict (name, mode)` нужен уникальный индекс на `(name, mode)`.)

Rate limiting удобнее всего вынести на уровень Supabase Edge Functions или сетевого
прокси; в самой RPC можно дополнительно ограничивать частоту по таблице-журналу.

