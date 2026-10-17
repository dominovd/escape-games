export const SITE = {
  name: 'Escape Games',
  // Короткое описание для title/OG главной
  tagline: 'Free Online Escape Games',
  description:
    'Find your next escape: locked rooms, haunted houses and prison puzzles. Browse free browser games by theme, difficulty and playing time.',
  contactEmail: 'info@playescapegames.com',
  // Хаб публикуется, только если в нем не меньше игр, чем здесь
  minGamesPerHub: 6,
  // Включить, когда подключите рекламную сеть: появятся слоты с зарезервированной высотой
  adsEnabled: false,
  // Сколько дней игра считается новой (бейдж NEW)
  newBadgeDays: 30,
  // Статистика игр (Supabase, проект statusworld, схема games). Ключ публичный, писать можно только через функции eg_*.
  stats: {
    supabaseUrl: 'https://iicyztrfiicvonqshmuo.supabase.co',
    supabaseKey: 'sb_publishable_eB7f_fUfpFn2LlDtPoypYw_1oDDXry4',
  },
  // Счетчики показываются только после порога, чтобы не светить «3 plays»
  minPlaysToShow: 10,
  minVotesToShow: 5,
  // Website ID из cloud.umami.is. Пусто = Umami не подключается.
  umamiWebsiteId: '',
};
