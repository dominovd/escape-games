# Escape Games (Astro)

Статический сайт онлайн escape-игр с хабами по интересам. Astro 7, без фреймворков и внешних шрифтов/CDN.

## Запуск

```bash
npm install
npm run dev      # http://localhost:4322
npm run build    # результат в dist/
```

## Структура URL

| Страница | URL | Файл |
|---|---|---|
| Главная | `/` | `src/pages/index.astro` |
| Все игры | `/escape-room-games/` (+ `/2/`, `/3/`) | `src/pages/escape-room-games/[...page].astro` |
| Хаб темы | `/{theme}-escape-games/` | `src/pages/[hub]/[...page].astro` |
| Игра | `/games/{slug}/` | `src/pages/games/[slug]/index.astro` |
| Прохождение | `/games/{slug}/walkthrough/` | `src/pages/games/[slug]/walkthrough.astro` |
| Серия | `/series/{slug}/` | `src/pages/series/[slug].astro` |
| Новые | `/new/` | `src/pages/new.astro` |
| Поиск (noindex) | `/search/?q=` | `src/pages/search.astro` |

## Контент

Весь контент лежит в трех файлах:

- `src/data/games.ts`: игры. Поля описаны в интерфейсе `Game`.
- `src/data/themes.ts`: темы (хабы), их H1, title, тексты, FAQ и цвет акцента.
- `src/data/site.ts`: название, почта, `minGamesPerHub`, `adsEnabled`, `newBadgeDays`.

**Хаб публикуется автоматически**, когда в теме набирается `minGamesPerHub` игр (по умолчанию 6). Только живые хабы попадают в меню, плитки, блоки на главной, футер и sitemap.

### Демо-игры

Все игры, кроме Castle of Secrets, взяты из макета и помечены `sample: true`. Такие страницы получают `noindex` и не попадают в sitemap. Хабы, где только демо-игры, тоже закрыты. Перед запуском удалите демо-игры или замените их реальными и уберите `sample`.

### Добавить игру

1. Web-билд (Godot: Export → Web) положить в `public/play/{slug}/`, в объекте игры указать `embedUrl: '/play/{slug}/'`.
2. Обложку 800×600 (4:3, WebP) положить в `public/images/games/{slug}.webp`, указать `image: '/images/games/{slug}.webp'`. Без картинки рисуется цветной плейсхолдер в цвете темы.
3. Скриншоты 16:9: `screenshots: [{ src, alt }]`.
4. Прохождение: `walkthrough: { intro, steps: [{ title, hint, solution, image? }] }`. Страница появится автоматически, на карточке появится ссылка Walkthrough.
5. Серия: `series: { slug, name, part }`. Появятся страница серии и блок «Next room».

Описание (`description`) должно быть уникальным, 80–150 слов на игру.

### Godot web-билд на Vercel

Godot 4 web-экспорт с потоками требует заголовков COOP/COEP. Если экспортируете с Thread Support, добавьте в `vercel.json` для `/play/(.*)` заголовки `Cross-Origin-Opener-Policy: same-origin` и `Cross-Origin-Embedder-Policy: require-corp`. Без потоков (рекомендуется для web) заголовки не нужны.

## Реклама

`adsEnabled: true` в `src/data/site.ts` включает слоты с зарезервированной высотой (после первой сетки, между тематическими блоками, на игре и прохождении). Код сети вставляется в `src/components/AdSlot.astro`.

Если будет хаб Kids, на нем нужна только неперсонализированная реклама и аналитика без идентификаторов (COPPA).

## Деплой: GitHub + Vercel

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
```

В Vercel: Add New → Project → импорт репозитория. Framework определится как Astro автоматически.
В Settings → Environment Variables добавить `SITE_URL` = `https://playescapegames.com` (от него строятся canonical, OG и sitemap). Затем Settings → Domains → подключить домен.

После деплоя отправить `https://playescapegames.com/sitemap-index.xml` в Google Search Console.

## TODO перед запуском

- [ ] Задать `SITE_URL` и поменять `SITE.contactEmail`.
- [ ] Удалить или заменить демо-игры (`sample: true`).
- [ ] Описание Castle of Secrets в `games.ts` и его билд в `public/play/castle-of-secrets/`.
- [ ] Обложки игр и `public/og-default.png` (1200×630) в финальном стиле.
- [ ] Тексты About, Privacy, Terms.
