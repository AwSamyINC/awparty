-- AwParty — лёгкая аналитика (своя, на Supabase).
-- Применить ОДИН РАЗ: Supabase → SQL Editor → вставить блок «СХЕМА» → Run.
-- Клиент шлёт сюда события из src/analytics.js (write-only, без персоналки).

-- ─────────────────────────── СХЕМА (выполнить один раз) ───────────────────────────

create table if not exists public.analytics_events (
    id          bigint generated always as identity primary key,
    cid         text,                                   -- случайный анонимный id браузера
    event       text not null,                          -- session_start | run_start | run_end
    props       jsonb not null default '{}'::jsonb,     -- доп. поля события
    created_at  timestamptz not null default now()
);

create index if not exists analytics_events_event_created_idx
    on public.analytics_events (event, created_at);
create index if not exists analytics_events_cid_idx
    on public.analytics_events (cid);

alter table public.analytics_events enable row level security;

-- Аноним (publishable-ключ из config.js) может ТОЛЬКО вставлять.
-- SELECT/UPDATE/DELETE для anon запрещены → данные write-only.
-- Читаешь их сам из дашборда (service_role обходит RLS).
drop policy if exists analytics_anon_insert on public.analytics_events;
create policy analytics_anon_insert
    on public.analytics_events for insert
    to anon
    with check (true);


-- ─────────────────────────── ЗАПРОСЫ (смотреть цифры) ───────────────────────────

-- (1) ЗАХОДЫ: сессии и уникальные игроки по дням (последние 30 дней)
select
    date_trunc('day', created_at)::date as day,
    count(*)                            as sessions,
    count(distinct cid)                 as unique_players
from public.analytics_events
where event = 'session_start'
  and created_at > now() - interval '30 days'
group by 1
order by 1 desc;

-- (2) УДЕРЖАНИЕ: в скольких разных днях заходил игрок (1 = зашёл и ушёл; >1 = вернулся)
with player_days as (
    select cid, count(distinct date_trunc('day', created_at)) as days_active
    from public.analytics_events
    where event = 'session_start'
    group by cid
)
select days_active, count(*) as players
from player_days
group by days_active
order by days_active;

-- (3) ВОРОНКА: загрузил → начал забег → прошёл/умер (последние 30 дней)
select
    count(*) filter (where event = 'session_start')                           as sessions,
    count(*) filter (where event = 'run_start')                               as runs_started,
    count(*) filter (where event = 'run_end' and props->>'outcome' = 'clear') as runs_cleared,
    count(*) filter (where event = 'run_end' and props->>'outcome' = 'death') as runs_died
from public.analytics_events
where created_at > now() - interval '30 days';

-- (4) ДО КУДА ДОХОДЯТ: разбивка финалов забега по главе/фазе/исходу
select
    (props->>'chapter')                     as chapter,
    (props->>'phase')                       as phase_reached,
    (props->>'outcome')                     as outcome,
    count(*)                                as runs,
    round(avg((props->>'time')::numeric))   as avg_time_sec,
    round(avg((props->>'score')::numeric))  as avg_score
from public.analytics_events
where event = 'run_end'
group by 1, 2, 3
order by 1, 2, 3;
