export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WalkthroughStep {
  title: string; // H2 шага, например "Room 1: The cell"
  hint: string; // показывается первой
  solution: string; // под спойлером
  image?: string;
  /** Cell in the 6 × 4 concept-cover atlas; not a gameplay screenshot. */
  coverIndex?: number; // /images/walkthrough/{slug}/step-1.webp
}

export interface Game {
  slug: string;
  title: string;
  /** Темы (slug из themes.ts). Первая тема = основная: хлебные крошки и H1. */
  themes: string[];
  difficulty: Difficulty;
  minutes: number; // среднее время прохождения
  rooms: number;
  /** Игра пополняется новыми комнатами: на странице появляется отметка «more rooms coming». */
  moreRoomsComing?: boolean;
  mobile: boolean; // работает на тач-устройствах
  added: string; // YYYY-MM-DD
  featured?: boolean; // попадает в «Featured» на главной
  /** Демо-данные из макета: страница получает noindex и не попадает в sitemap. Удалить перед запуском. */
  sample?: boolean;
  /** Уникальное описание, абзацы. Не копировать с порталов-дистрибьюторов. */
  description: string[];
  howToPlay: string[];
  controls: string;
  /** URL web-билда игры. Свой билд кладите в public/play/{slug}/ → '/play/{slug}/'. Нет URL = «Coming soon». */
  embedUrl?: string;
  aspect?: '16/9' | '4/3';
  /** Обложка 800x600 (4:3), WebP. Нет файла = цветной плейсхолдер. */
  image?: string;
  /** Cell in the 6 × 4 concept-cover atlas; not a gameplay screenshot. */
  coverIndex?: number;
  screenshots?: { src: string; alt: string }[];
  series?: { slug: string; name: string; part: number };
  walkthrough?: { intro: string; steps: WalkthroughStep[] };
  faq?: { q: string; a: string }[];
}

const std = {
  howToPlay: [
    'Click or tap around the room to take a closer look. Pick up anything that might be useful.',
    'Select an item from your inventory, then try it where you think it belongs.',
    'Keep an eye out for numbers, symbols and patterns. They may help you open a lock elsewhere.',
  ],
  controls: 'Mouse or touch. No keyboard needed.',
};

export const games: Game[] = [
  // ───────────── Реальная игра ─────────────
  {
    slug: 'castle-of-secrets',
    title: 'Castle of Secrets',
    themes: ['halloween', 'horror'],
    difficulty: 'medium',
    minutes: 20,
    rooms: 1,
    moreRoomsComing: true,
    mobile: true,
    added: '2026-10-14',
    featured: true,
    description: [
      'Castle of Secrets is a Halloween escape game currently in development. The game is not available to play yet; check back for the finished version.',
    ],
    howToPlay: std.howToPlay,
    controls: std.controls,
    embedUrl: '/play/castle-of-secrets/play.html?game=games/hall',
    aspect: '16/9',
  },

  // ───────────── Демо-игры из макета (sample: true) ─────────────
  {
    slug: 'prison-break',
    title: 'Prison Break',
    themes: ['prison', 'hard'],
    difficulty: 'hard',
    minutes: 25,
    rooms: 4,
    mobile: true,
    added: '2026-09-20',
    featured: true,
    sample: true,
    series: { slug: 'prison-break', name: 'Prison Break', part: 1 },
    description: [
      'You wake up in a cold cell with a bent spoon, a torn map and a guard who never looks twice. Turn small finds into tools, map the guard schedule and reach the watchtower before the morning count.',
    ],
    howToPlay: std.howToPlay,
    controls: std.controls,
    walkthrough: {
      intro: 'Prison Break has four rooms: the cell, the corridor, the laundry and the watchtower. Each step starts with a hint; open the solution only if the hint is not enough.',
      steps: [
        { title: 'Room 1: The cell', hint: 'The bed is not as solid as it looks.', solution: 'Pull the loose leg off the bed frame and use it to pry the vent cover open. Take the spoon from inside the vent.' },
        { title: 'Room 2: The corridor', hint: 'Count the lights that blink.', solution: 'The lights blink 3, 1, 4. Enter 314 on the keypad by the gate.' },
        { title: 'Room 3: The laundry', hint: 'Guards wear uniforms for a reason.', solution: 'Combine the spoon with the sewing kit to cut the tag off the guard uniform in the dryer, then put it on.' },
        { title: 'Room 4: The watchtower', hint: 'The map in your inventory has marks on it.', solution: 'Match the marks on the torn map to the floodlight switches: left, right, middle. The gate opens.' },
      ],
    },
  },
  { slug: 'cell-block-13', title: 'Cell Block 13', themes: ['prison'], difficulty: 'medium', minutes: 20, rooms: 3, mobile: true, added: '2026-09-25', featured: true, sample: true, series: { slug: 'prison-break', name: 'Prison Break', part: 2 }, description: ['The break went wrong and you are back inside, this time in the block nobody leaves. Trade with the inmate next door, find out why cell 13 is always empty and use its secret to get out.'], ...std },
  { slug: 'maximum-security', title: 'Maximum Security', themes: ['prison', 'hard'], difficulty: 'hard', minutes: 25, rooms: 4, mobile: false, added: '2026-10-01', sample: true, series: { slug: 'prison-break', name: 'Prison Break', part: 3 }, description: ['Cameras, laser grids and a warden who changes the codes every hour. The last part of the series asks you to remember clues from both earlier games.'], ...std },
  { slug: 'the-escape-plan', title: 'The Escape Plan', themes: ['prison'], difficulty: 'medium', minutes: 20, rooms: 2, mobile: true, added: '2026-09-10', sample: true, description: ['Somebody drew the perfect escape plan and hid its pieces across the prison library. Put the blueprint back together and follow it to the letter.'], ...std },
  { slug: 'solitary', title: 'Solitary', themes: ['prison'], difficulty: 'medium', minutes: 15, rooms: 1, mobile: true, added: '2026-10-10', sample: true, description: ['One dark room, one barred window and a message scratched into the wall by the last prisoner. A short single-room escape built around one clever puzzle chain.'], ...std },
  { slug: 'prison-tunnel', title: 'Prison Tunnel', themes: ['prison', 'hard'], difficulty: 'hard', minutes: 25, rooms: 3, mobile: false, added: '2026-08-28', sample: true, description: ['The tunnel is half dug, the shovel is broken and the guards are getting suspicious. Finish the job and crawl out under the wall.'], ...std },
  { slug: 'the-guard-room', title: 'The Guard Room', themes: ['prison', 'kids'], difficulty: 'easy', minutes: 10, rooms: 1, mobile: true, added: '2026-09-05', sample: true, description: ['The guards stepped out for lunch and left their room unlocked. A quick and easy escape, good for a first try at the genre.'], ...std },
  { slug: 'riot-control', title: 'Riot Control', themes: ['prison'], difficulty: 'medium', minutes: 20, rooms: 3, mobile: true, added: '2026-08-15', sample: true, description: ['The alarms are going off and every door is on lockdown. Use the chaos to slip through the control room and override the gates.'], ...std },

  { slug: 'midnight-manor', title: 'Midnight Manor', themes: ['halloween'], difficulty: 'medium', minutes: 15, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-10-08', featured: true, sample: true, description: ['The party at Midnight Manor ended at midnight and the guests never left. The first room is the ballroom: follow the masked guest, finish the host\'s waltz and work out which year the doors will open for. The library and the cellar come next.'], ...std, embedUrl: '/play/midnight-manor/play.html?game=games/midnight-manor', aspect: '16/9', walkthrough: { intro: 'Room one is the ballroom. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The mask and the coat', hint: 'Someone dropped something while dancing.', solution: 'Pick up the green mask from the dance floor. Its ribbon says "for the guest in green": search the green coat on the coat rack to get a tiny brass key.' }, { title: 'The piano', hint: 'The gramophone remembers how the waltz begins.', solution: 'Read the record label on the gramophone. Unlock the piano lid with the tiny key and play E, C, G, E. A drawer slides out with an invitation.' }, { title: 'The doors', hint: 'How old was the host, and when was the party?', solution: 'The invitation says the party was the 100th birthday in 1926, and the cake has one hundred candles. The host was born in 1826: enter 1826 on the door keypad.' }] } },
  { slug: 'the-haunted-house', title: 'The Haunted House', themes: ['halloween', 'horror'], difficulty: 'medium', minutes: 15, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-09-30', sample: true, description: ['Doors slam on their own and the portraits follow you with their eyes. In the parlor, ask the spirit board the right name, wind the old music box and calm the ghost of the house before the front door lets you go.'], ...std, embedUrl: '/play/the-haunted-house/play.html?game=games/the-haunted-house', aspect: '16/9', walkthrough: { intro: 'Room one is the parlor. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The diary', hint: 'The rocking chair moves by itself.', solution: 'Search the rocking chair: a diary lies under the shawl. It mentions a little sister and the three portraits.' }, { title: 'The spirit board', hint: 'The board answers to a name.', solution: 'Spell LILY on the spirit board. A drawer opens in the table with a winding key.' }, { title: 'The music box', hint: 'The ghost needs her lullaby.', solution: 'Use the winding key on the music box on the bookcase. The ghost appears and the cold leaves the door lock.' }, { title: 'The front door', hint: 'Mother, Father and Lily, in that order.', solution: 'The portraits hold a rose, a key and a candle. Set the door dials to rose, key, candle.' }] } },
  { slug: 'witchs-cabin', title: "Witch's Cabin", themes: ['halloween'], difficulty: 'medium', minutes: 10, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-10-05', sample: true, description: ['Brew the right potion from the ingredients on the shelves and the cabin door will open. Make friends with the cat, find the recipe and add everything in the right order, or start over.'], ...std, embedUrl: '/play/witchs-cabin/play.html?game=games/witchs-cabin', aspect: '16/9', walkthrough: { intro: 'Room one is the witch\'s cabin. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The cat', hint: 'The cat wears something useful and loves fish.', solution: 'Take the dried fish from the shelves and give it to the cat. Take the tiny key from its collar.' }, { title: 'The recipe', hint: 'The spellbook is locked with a small clasp.', solution: 'Open the spellbook with the collar key and tear out the marked page.' }, { title: 'The ingredients', hint: 'The recipe names three things.', solution: 'Take the toadstool from the shelves, the moonwater from the windowsill and the raven feather from the broom.' }, { title: 'The potion', hint: 'Order matters.', solution: 'At the cauldron add toadstool, moonwater, feather. Pour the potion on the rune on the door.' }] } },
  { slug: 'pumpkin-puzzle', title: 'Pumpkin Puzzle', themes: ['halloween', 'kids'], difficulty: 'easy', minutes: 10, rooms: 1, mobile: true, added: '2026-10-12', sample: true, description: ['A friendly Halloween room full of carved pumpkins, each hiding a piece of the code. Short, colorful and not scary at all.'], ...std, embedUrl: '/play/pumpkin-puzzle/play.html?game=games/pumpkin-puzzle', aspect: '16/9', walkthrough: { intro: 'Every pumpkin hides one number. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'Big and tiny', hint: 'Two pumpkins open without any help.', solution: 'Lift the lid of the big pumpkin: 7. Look at the tiny pumpkin the scarecrow holds: 4.' }, { title: 'Medium and small', hint: 'One lid is stuck, one pumpkin is too dark.', solution: 'Pry the medium pumpkin open with the trowel from the wheelbarrow: 2. Put the lantern from the fence post into the small pumpkin: 9.' }, { title: 'The shed', hint: 'Biggest first, tiniest last.', solution: 'Enter 7294 on the shed lock.' }] } },
  { slug: 'the-cursed-manor', title: 'The Cursed Manor', themes: ['halloween', 'horror', 'hard'], difficulty: 'hard', minutes: 25, rooms: 5, mobile: false, added: '2026-09-18', sample: true, description: ['A family curse, a locked crypt and five rooms of puzzles that get darker as you go. One of the longest Halloween escapes on the site.'], ...std },
  { slug: 'trick-or-escape', title: 'Trick or Escape', themes: ['halloween', 'kids'], difficulty: 'medium', minutes: 10, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-10-11', sample: true, description: ['You knocked on the wrong door on Halloween night. Trade your way past a sleepy dog, a fortune-teller machine and a skeleton butler with a sweet tooth to get back outside.'], ...std, embedUrl: '/play/trick-or-escape/play.html?game=games/trick-or-escape', aspect: '16/9', walkthrough: { intro: 'Room one is the hallway. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The dog', hint: 'The dog is sleeping on something.', solution: 'Take a biscuit from the treat jar and give it to the dog. Search the cushions for a coin.' }, { title: 'The fortune', hint: 'The fortune teller works for a coin.', solution: 'Put the coin in the fortune-teller machine and read the card.' }, { title: 'The candy', hint: 'The bottom row, third from the left.', solution: 'The rows go A to E from the top. Set the candy machine to E and 3 to get the red lollipop.' }, { title: 'The key', hint: 'The skeleton wants a treat.', solution: 'Give the lollipop to the skeleton butler, take the key and open the front door.' }] } },
  { slug: 'shadow-circus', title: 'Shadow Circus', themes: ['halloween', 'point-and-click'], difficulty: 'medium', minutes: 20, rooms: 3, mobile: true, added: '2026-09-27', sample: true, description: ['The circus came to town for one night only and you are locked inside the big top. Find the ringmaster’s keys before the show begins.'], ...std },

  { slug: 'the-locked-attic', title: 'The Locked Attic', themes: ['horror', 'kids', 'point-and-click'], difficulty: 'easy', minutes: 15, rooms: 1, mobile: true, added: '2026-09-12', featured: true, sample: true, description: ['Grandma’s attic is full of old trunks, dusty toys and a door that only opens with the right melody.'], ...std },
  { slug: 'escape-the-garage', title: 'Escape the Garage', themes: ['car', 'kids'], difficulty: 'easy', minutes: 10, rooms: 1, mobile: true, added: '2026-09-02', featured: true, sample: true, description: ['The garage door is jammed and the car battery is dead. Fix both with what you find on the workbench.'], ...std },
  { slug: 'forgotten-lab', title: 'Forgotten Lab', themes: ['horror', 'hard'], difficulty: 'hard', minutes: 25, rooms: 4, mobile: false, added: '2026-10-09', featured: true, sample: true, description: ['An abandoned research lab where the last experiment is still running. Shut it down and get out before the doors seal for good.'], ...std },
  { slug: 'clockwork-room', title: 'Clockwork Room', themes: ['point-and-click'], difficulty: 'medium', minutes: 15, rooms: 1, mobile: true, added: '2026-10-07', featured: true, sample: true, description: ['Every gear in the room is connected. Set the clocks to the right time and the mechanism unlocks the door.'], ...std },
  { slug: 'cabin-in-the-woods', title: 'Cabin in the Woods', themes: ['horror', 'christmas'], difficulty: 'easy', minutes: 15, rooms: 2, mobile: true, added: '2026-08-20', featured: true, sample: true, description: ['Snowed in at a lonely cabin with a radio that almost works. Get the signal out before the night falls.'], ...std },
  { slug: 'the-last-door', title: 'The Last Door', themes: ['hard'], difficulty: 'hard', minutes: 20, rooms: 1, mobile: true, added: '2026-08-10', featured: true, sample: true, description: ['Ninety-nine doors are behind you. The last one has the hardest lock of them all.'], ...std },
  { slug: 'lost-in-the-library', title: 'Lost in the Library', themes: ['point-and-click'], difficulty: 'medium', minutes: 20, rooms: 2, mobile: true, added: '2026-08-05', featured: true, sample: true, description: ['The library closed with you inside. The way out is written in the books, if you know which ones to read.'], ...std },
  { slug: 'secret-passage', title: 'Secret Passage', themes: ['kids'], difficulty: 'easy', minutes: 10, rooms: 1, mobile: true, added: '2026-07-30', featured: true, sample: true, description: ['Somewhere in this study is a bookcase that moves. Find the switch and follow the secret passage.'], ...std },
];

// Atlas cells follow catalog order. Replace with individual game art when available.
games.forEach((game, coverIndex) => {
  game.image = '/images/escape-covers-v1.png';
  game.coverIndex = coverIndex;
});

export const gameBySlug = (slug: string) => games.find((g) => g.slug === slug);
