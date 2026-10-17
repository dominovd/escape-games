-- Запросы к статистике игр. Supabase → проект statusworld → SQL Editor.
-- Данные: games.stats (счетчики), games.votes (лайки), games.events (все события из игр).

-- 1. Рейтинг игр: игры, прохождения, доля дошедших до конца, лайки
select slug, plays, completions,
       round(100.0 * completions / nullif(plays, 0)) as completion_pct,
       likes, dislikes,
       round(100.0 * likes / nullif(likes + dislikes, 0)) as liked_pct
from games.stats
order by plays desc;

-- 2. Воронка по игре за 30 дней: сколько уникальных игроков дошли до каждого шага
select event, count(distinct visitor) as players
from games.events
where slug = 'castle-of-secrets' and created_at > now() - interval '30 days'
  and event in ('play_click', 'game_start', 'puzzle_open', 'puzzle_solve', 'game_complete')
group by event
order by players desc;

-- 3. Сложность пазлов: сколько открыли, решили, сколько ошибок на игрока
select puzzle,
       count(distinct visitor) filter (where event = 'puzzle_open')  as opened,
       count(distinct visitor) filter (where event = 'puzzle_solve') as solved,
       round(count(*) filter (where event = 'puzzle_fail')::numeric
             / nullif(count(distinct visitor) filter (where event = 'puzzle_open'), 0), 1) as fails_per_player
from games.events
where slug = 'castle-of-secrets' and event like 'puzzle_%'
group by puzzle
order by fails_per_player desc nulls last;

-- 4. Где берут подсказки (detail = сцена, в которой нажали Hint)
select puzzle as scene, count(*) as hints, count(distinct visitor) as players
from games.events
where slug = 'castle-of-secrets' and event = 'hint_used'
group by puzzle
order by hints desc;

-- 5. Время прохождения в минутах (медиана и 80-й перцентиль) для плашки «~N min»
select room,
       round((percentile_cont(0.5) within group (order by ms) / 60000)::numeric, 1) as median_min,
       round((percentile_cont(0.8) within group (order by ms) / 60000)::numeric, 1) as p80_min,
       count(*) as completions
from games.events
where slug = 'castle-of-secrets' and event = 'game_complete' and ms is not null
group by room;

-- 6. Дальше каких сцен игроки не заходят (последняя открытая сцена у тех, кто не прошел игру)
with last_scene as (
  select distinct on (visitor) visitor, puzzle as scene
  from games.events
  where slug = 'castle-of-secrets' and event = 'scene'
  order by visitor, created_at desc
)
select scene, count(*) as players_stopped_here
from last_scene l
where not exists (select 1 from games.events e
                  where e.visitor = l.visitor and e.slug = 'castle-of-secrets' and e.event = 'game_complete')
group by scene
order by players_stopped_here desc;

-- 7. Игры по дням
select date_trunc('day', created_at)::date as day, slug, count(*) as plays
from games.events
where event = 'play_click' and created_at > now() - interval '30 days'
group by 1, 2
order by 1 desc, 3 desc;
