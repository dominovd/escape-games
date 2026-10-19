import rated from './rated.json';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WalkthroughStep {
  title: string; // H2 шага, например "Room 1: The cell"
  hint: string; // показывается первой
  solution: string; // под спойлером
  image?: string;
  /** Cell in the 6 × 4 concept-cover atlas; not a gameplay screenshot. */
  coverIndex?: number; // /images/walkthrough/{slug}/step-1.webp
}

export interface Room {
  title: string;
  /** id игры в escape-kit (game.json id): по нему движок помечает комнату пройденной. */
  gameId?: string;
  /** open: можно играть; soon: показывается с подписью Coming soon. */
  status: 'open' | 'soon';
  /** 16:9 превью комнаты. */
  image?: string;
  embedUrl?: string;
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
  /** 16:9 постер для плеера. */
  poster?: string;
  /** Комнаты игры по порядку. Следующая открывается только после прохождения предыдущей. */
  roomList?: Room[];
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
    walkthrough: { intro: 'Room one is the Great Hall. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The fireplace', hint: 'The knight is holding something, and the fire is still burning.', solution: 'Take the taper from the armor and the poker from the fire tools. Light the taper in the fire and rake the ashes with the poker: you find a brass gear and a charred note.' }, { title: 'The clock', hint: 'The note mentions dinner time.', solution: 'Put the brass gear into the clock face and set the hands to 7:15, a quarter past seven. Take the silver key from behind the pendulum.' }, { title: 'The table', hint: 'The ring has numbers engraved inside.', solution: 'Open the jewelry box with the silver key to get the signet ring. Light the candles with the taper in the order III, I, IV, II, then take the letter that appears.' }, { title: 'The portrait', hint: 'The crest on the frame matches the ring.', solution: 'Press the signet ring to the crest on the portrait frame. Open the safe behind it with the code from the letter, 6139, and take the iron key.' }, { title: 'The gate', hint: 'The iron key fits the gate.', solution: 'Unlock the gate with the iron key and climb the staircase.' }] },
    aspect: '16/9',
  },

  // ───────────── Демо-игры из макета (sample: true) ─────────────
  {
    slug: 'prison-break',
    title: 'Prison Break',
    themes: ['prison', 'hard'],
    difficulty: 'hard',
    minutes: 20,
    rooms: 1,
    moreRoomsComing: true,
    mobile: true,
    added: '2026-09-20',
    featured: true,
    series: { slug: 'prison-break', name: 'Prison Break', part: 1 },
    description: [
      'You wake up in cell 7 with a guard who never looks twice and a morning count you cannot be there for. Turn what you find into tools, crack the footlocker and the door keypad, and get out of the cell. The corridor, the laundry and the watchtower come next.',
    ],
    howToPlay: std.howToPlay,
    controls: std.controls,
    embedUrl: '/play/prison-break/play.html?game=games/prison-break',
    aspect: '16/9',
    walkthrough: { intro: 'Room one is the cell. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The note', hint: 'Prisoners hide things in their mattresses.', solution: 'Search the mattress on the bunk to find a note about the footlocker.' }, { title: 'The footlocker', hint: 'The Good Book on the shelf.', solution: 'Page 13 of the Bible shows a heart, a club and a spade. Set the footlocker to heart, club, spade and take the torn map.' }, { title: 'The vent', hint: 'The bunk has a loose leg.', solution: 'Twist the loose leg off the bunk and pry the vent cover open with it. Take the spoon from the vent.' }, { title: 'The keypad', hint: 'The keypad is out of reach, and the map says where the code is.', solution: 'Combine the bed leg with the spoon and use it on the keypad. The small numbers under the tally marks read 2, 7, 1, 9: enter 2719.' }] },
  },
  { slug: 'cell-block-13', title: 'Cell Block 13', themes: ['prison'], difficulty: 'medium', minutes: 15, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-09-25', featured: true, series: { slug: 'prison-break', name: 'Prison Break', part: 2 }, description: ['The break went wrong and you are back inside, this time in cell 12, right next to the cell nobody leaves. Trade with Joe next door, find out what Rocco hid behind the poster and use his old keycard to get out.'], ...std, embedUrl: '/play/cell-block-13/play.html?game=games/cell-block-13', aspect: '16/9', walkthrough: { intro: 'Room one is cell 12. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'Joe', hint: 'Joe will talk for something sweet.', solution: 'Take the chocolate bar from the food tray and give it to Joe. He hands you a bent wire and tells you about Rocco.' }, { title: 'Rocco\'s stash', hint: 'Look behind the poster.', solution: 'Peel the poster back and scrape the mortar out of the loose bricks with the wire. A tin box is hidden behind them.' }, { title: 'The tin box', hint: 'Rocco counted his days under the bunk.', solution: 'Look under the bunk: 48 marks. Open the tin box with 048 and take the keycard.' }, { title: 'The door', hint: 'The back of the card has four shapes.', solution: 'Use the keycard on the reader, then tap triangle, circle, square, circle.' }] } },
  { slug: 'maximum-security', title: 'Maximum Security', themes: ['prison', 'hard'], difficulty: 'hard', minutes: 25, rooms: 4, mobile: false, added: '2026-10-01', sample: true, series: { slug: 'prison-break', name: 'Prison Break', part: 3 }, description: ['Cameras, laser grids and a warden who changes the codes every hour. The last part of the series asks you to remember clues from both earlier games.'], ...std },
  { slug: 'the-escape-plan', title: 'The Escape Plan', themes: ['prison'], difficulty: 'medium', minutes: 20, rooms: 2, mobile: true, added: '2026-09-10', sample: true, description: ['Somebody drew the perfect escape plan and hid its pieces across the prison library. Put the blueprint back together and follow it to the letter.'], ...std },
  { slug: 'solitary', title: 'Solitary', themes: ['prison'], difficulty: 'medium', minutes: 10, rooms: 1, mobile: true, added: '2026-10-10', description: ['One dark room, one barred window and a message scratched into the wall by the last prisoner. Follow the moonlight, find what the last prisoner hid and read the symbols only a mirror can show.'], ...std, embedUrl: '/play/solitary/play.html?game=games/solitary', aspect: '16/9', walkthrough: { intro: 'Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The message', hint: 'Read the wall.', solution: 'The message says the moon knows the way out and needs a mirror.' }, { title: 'The tile', hint: 'The moonlight falls on one loose tile.', solution: 'Take a spring from the cot and lever up the moonlit tile. Take the mirror shard.' }, { title: 'The symbols', hint: 'Give the moon a mirror.', solution: 'Use the mirror shard on the window. The reflected moonlight shows a moon, a key, a star and an eye on the bare wall.' }, { title: 'The door', hint: 'Four wheels on the bolt.', solution: 'Set the door wheels to moon, key, star, eye.' }] } },
  { slug: 'prison-tunnel', title: 'Prison Tunnel', themes: ['prison', 'hard'], difficulty: 'hard', minutes: 25, rooms: 3, mobile: false, added: '2026-08-28', sample: true, description: ['The tunnel is half dug, the shovel is broken and the guards are getting suspicious. Finish the job and crawl out under the wall.'], ...std },
  { slug: 'the-guard-room', title: 'The Guard Room', themes: ['prison', 'kids'], difficulty: 'easy', minutes: 10, rooms: 1, mobile: true, added: '2026-09-05', description: ['The guards stepped out for lunch and left their room unlocked. Search the jacket, open the key cabinet and find the new door code before they come back. A quick and easy escape, good for a first try at the genre.'], ...std, embedUrl: '/play/the-guard-room/play.html?game=games/the-guard-room', aspect: '16/9', walkthrough: { intro: 'Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The keys', hint: 'Guards keep things in their pockets.', solution: 'Take the small key from the guard jacket and open the key cabinet. Take the key marked EXIT.' }, { title: 'The code', hint: 'Read the note on the monitor.', solution: 'The note says the new code is in the lunchbox. Open the lunchbox on the desk: 2580.' }, { title: 'The door', hint: 'Key first, then the code.', solution: 'Unlock the exit door with the EXIT key and enter 2580 on the keypad.' }] } },
  { slug: 'riot-control', title: 'Riot Control', themes: ['prison'], difficulty: 'medium', minutes: 20, rooms: 3, mobile: true, added: '2026-08-15', sample: true, description: ['The alarms are going off and every door is on lockdown. Use the chaos to slip through the control room and override the gates.'], ...std },

  { slug: 'midnight-manor', title: 'Midnight Manor', themes: ['halloween'], difficulty: 'medium', minutes: 15, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-10-08', featured: true, description: ['The party at Midnight Manor ended at midnight and the guests never left. The first room is the ballroom: follow the masked guest, finish the host\'s waltz and work out which year the doors will open for. The library and the cellar come next.'], ...std, embedUrl: '/play/midnight-manor/play.html?game=games/midnight-manor', aspect: '16/9', walkthrough: { intro: 'Room one is the ballroom. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The mask and the coat', hint: 'Someone dropped something while dancing.', solution: 'Pick up the green mask from the dance floor. Its ribbon says "for the guest in green": search the green coat on the coat rack to get a tiny brass key.' }, { title: 'The piano', hint: 'The gramophone remembers how the waltz begins.', solution: 'Read the record label on the gramophone. Unlock the piano lid with the tiny key and play E, C, G, E. A drawer slides out with an invitation.' }, { title: 'The doors', hint: 'How old was the host, and when was the party?', solution: 'The invitation says the party was the 100th birthday in 1926, and the cake has one hundred candles. The host was born in 1826: enter 1826 on the door keypad.' }] } },
  { slug: 'the-haunted-house', title: 'The Haunted House', themes: ['halloween', 'horror'], difficulty: 'medium', minutes: 15, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-09-30', description: ['Doors slam on their own and the portraits follow you with their eyes. In the parlor, ask the spirit board the right name, wind the old music box and calm the ghost of the house before the front door lets you go.'], ...std, embedUrl: '/play/the-haunted-house/play.html?game=games/the-haunted-house', aspect: '16/9', walkthrough: { intro: 'Room one is the parlor. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The diary', hint: 'The rocking chair moves by itself.', solution: 'Search the rocking chair: a diary lies under the shawl. It mentions a little sister and the three portraits.' }, { title: 'The spirit board', hint: 'The board answers to a name.', solution: 'Spell LILY on the spirit board. A drawer opens in the table with a winding key.' }, { title: 'The music box', hint: 'The ghost needs her lullaby.', solution: 'Use the winding key on the music box on the bookcase. The ghost appears and the cold leaves the door lock.' }, { title: 'The front door', hint: 'Mother, Father and Lily, in that order.', solution: 'The portraits hold a rose, a key and a candle. Set the door dials to rose, key, candle.' }] } },
  { slug: 'witchs-cabin', title: "Witch's Cabin", themes: ['halloween'], difficulty: 'medium', minutes: 10, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-10-05', description: ['Brew the right potion from the ingredients on the shelves and the cabin door will open. Make friends with the cat, find the recipe and add everything in the right order, or start over.'], ...std, embedUrl: '/play/witchs-cabin/play.html?game=games/witchs-cabin', aspect: '16/9', walkthrough: { intro: 'Room one is the witch\'s cabin. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The cat', hint: 'The cat wears something useful and loves fish.', solution: 'Take the dried fish from the shelves and give it to the cat. Take the tiny key from its collar.' }, { title: 'The recipe', hint: 'The spellbook is locked with a small clasp.', solution: 'Open the spellbook with the collar key and tear out the marked page.' }, { title: 'The ingredients', hint: 'The recipe names three things.', solution: 'Take the toadstool from the shelves, the moonwater from the windowsill and the raven feather from the broom.' }, { title: 'The potion', hint: 'Order matters.', solution: 'At the cauldron add toadstool, moonwater, feather. Pour the potion on the rune on the door.' }] } },
  { slug: 'pumpkin-puzzle', title: 'Pumpkin Puzzle', themes: ['halloween', 'kids'], difficulty: 'easy', minutes: 10, rooms: 1, mobile: true, added: '2026-10-12', description: ['A friendly Halloween room full of carved pumpkins, each hiding a piece of the code. Short, colorful and not scary at all.'], ...std, embedUrl: '/play/pumpkin-puzzle/play.html?game=games/pumpkin-puzzle', aspect: '16/9', walkthrough: { intro: 'Every pumpkin hides one number. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'Big and tiny', hint: 'Two pumpkins open without any help.', solution: 'Lift the lid of the big pumpkin: 7. Look at the tiny pumpkin the scarecrow holds: 4.' }, { title: 'Medium and small', hint: 'One lid is stuck, one pumpkin is too dark.', solution: 'Pry the medium pumpkin open with the trowel from the wheelbarrow: 2. Put the lantern from the fence post into the small pumpkin: 9.' }, { title: 'The shed', hint: 'Biggest first, tiniest last.', solution: 'Enter 7294 on the shed lock.' }] } },
  { slug: 'the-cursed-manor', title: 'The Cursed Manor', themes: ['halloween', 'horror', 'hard'], difficulty: 'hard', minutes: 25, rooms: 1, moreRoomsComing: true, mobile: false, added: '2026-09-18', description: ['A family curse, a locked crypt and a study full of Blackwood secrets. Read the family chronicle, work out the order in which four ancestors died and light their candles to open the way to the crypt. One of the hardest Halloween escapes on the site, with more rooms on the way down.'], ...std, embedUrl: '/play/the-cursed-manor/play.html?game=games/the-cursed-manor', aspect: '16/9', walkthrough: { intro: 'Room one is the Blackwood study. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The chronicle', hint: 'One book on the shelf has no dust on it.', solution: 'Take the red Blackwood Chronicle from the bookshelf and read it.' }, { title: 'The ancestors', hint: 'The family tree has dates.', solution: 'Look at all four medallions: Edith 1721 to 1766 (moon), Ambrose 1745 to 1790 (skull), Selina 1690 to 1731 (serpent), Oliver 1702 to 1744 (owl).' }, { title: 'The rose drawer', hint: 'The mantel shows which roses bloom.', solution: 'The mantel says the four corners and the center are in bloom. Press those five roses on the desk drawer to get the matches.' }, { title: 'The candles', hint: 'Light them in the order the ancestors died.', solution: 'Use the matches on the candles and light serpent, owl, moon, skull. Take the crypt key from under the slab.' }, { title: 'The crypt door', hint: 'The curse fell when the first of the four died.', solution: 'Unlock the door with the crypt key, then set the dial to 1731, the year Selina died.' }] } },
  { slug: 'trick-or-escape', title: 'Trick or Escape', themes: ['halloween', 'kids'], difficulty: 'medium', minutes: 10, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-10-11', description: ['You knocked on the wrong door on Halloween night. Trade your way past a sleepy dog, a fortune-teller machine and a skeleton butler with a sweet tooth to get back outside.'], ...std, embedUrl: '/play/trick-or-escape/play.html?game=games/trick-or-escape', aspect: '16/9', walkthrough: { intro: 'Room one is the hallway. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The dog', hint: 'The dog is sleeping on something.', solution: 'Take a biscuit from the treat jar and give it to the dog. Search the cushions for a coin.' }, { title: 'The fortune', hint: 'The fortune teller works for a coin.', solution: 'Put the coin in the fortune-teller machine and read the card.' }, { title: 'The candy', hint: 'The bottom row, third from the left.', solution: 'The rows go A to E from the top. Set the candy machine to E and 3 to get the red lollipop.' }, { title: 'The key', hint: 'The skeleton wants a treat.', solution: 'Give the lollipop to the skeleton butler, take the key and open the front door.' }] } },
  { slug: 'shadow-circus', title: 'Shadow Circus', themes: ['halloween', 'point-and-click'], difficulty: 'medium', minutes: 15, rooms: 1, moreRoomsComing: true, mobile: true, added: '2026-09-27', description: ['The circus came to town for one night only and the tent flap has been laced shut with you inside. Get the old steam calliope playing, wake the brass lion and find the ringmaster\'s keys before the show begins.'], ...std, embedUrl: '/play/shadow-circus/play.html?game=games/shadow-circus', aspect: '16/9', walkthrough: { intro: 'Room one is the big top. Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The crank', hint: 'There is no rabbit in the ringmaster\'s hat.', solution: 'Take the crank handle from the top hat on the podium and read the poster on the left pole.' }, { title: 'The calliope', hint: 'The poster names the colors of the march.', solution: 'Put the crank into the calliope and play red, yellow, red, blue on the pipes.' }, { title: 'The lion and the trunk', hint: 'The brass lion was waiting for music.', solution: 'Take the small key from the lion\'s open mouth and use it on the juggler\'s trunk to get the ringmaster\'s keys.' }, { title: 'The exit', hint: 'The trunk lid shows three juggling pins.', solution: 'Open the padlock on the exit with the ringmaster\'s keys, then set the buckle to star, moon, sun.' }] } },

  { slug: 'the-locked-attic', title: 'The Locked Attic', themes: ['horror', 'kids', 'point-and-click'], difficulty: 'easy', minutes: 15, rooms: 1, mobile: true, added: '2026-09-12', featured: true, description: ['Grandma’s attic is full of old trunks, dusty toys and a door that only opens with the right melody.'], ...std, embedUrl: '/play/the-locked-attic/play.html?game=games/the-locked-attic', aspect: '16/9', walkthrough: { intro: 'Each step starts with a hint; open the solution only if the hint is not enough.', steps: [{ title: 'The mouse', hint: 'The little mouse on the floor seems to want to play.', solution: 'Click the mouse sitting on the floor. It runs into its hole by the trunk and rolls out a tiny key.' }, { title: 'The rocking horse', hint: 'Toys like to hide things.', solution: 'Open the toys and push the rocking horse. A winding key falls out of its mane.' }, { title: 'The music box', hint: 'The tiny key fits the trunk.', solution: 'Open the trunk with the tiny key, then wind the music box with the winding key. The bells inside are painted red, yellow, blue, yellow, green.' }, { title: 'The door', hint: 'Grandma\u2019s door opens to her lullaby.', solution: 'Ring the painted bells on the little door: red, yellow, blue, yellow, green.' }] } },
  { slug: 'escape-the-garage', title: 'Escape the Garage', themes: ['car', 'kids'], difficulty: 'easy', minutes: 10, rooms: 1, mobile: true, added: '2026-09-02', featured: true, sample: true, description: ['The garage door is jammed and the car battery is dead. Fix both with what you find on the workbench.'], ...std },
  { slug: 'forgotten-lab', title: 'Forgotten Lab', themes: ['horror', 'hard'], difficulty: 'hard', minutes: 25, rooms: 4, mobile: false, added: '2026-10-09', featured: true, sample: true, description: ['An abandoned research lab where the last experiment is still running. Shut it down and get out before the doors seal for good.'], ...std },
  { slug: 'clockwork-room', title: 'Clockwork Room', themes: ['point-and-click'], difficulty: 'medium', minutes: 15, rooms: 1, mobile: true, added: '2026-10-07', featured: true, sample: true, description: ['Every gear in the room is connected. Set the clocks to the right time and the mechanism unlocks the door.'], ...std },
  { slug: 'cabin-in-the-woods', title: 'Cabin in the Woods', themes: ['horror', 'christmas'], difficulty: 'easy', minutes: 15, rooms: 2, mobile: true, added: '2026-08-20', featured: true, sample: true, description: ['Snowed in at a lonely cabin with a radio that almost works. Get the signal out before the night falls.'], ...std },
  { slug: 'the-last-door', title: 'The Last Door', themes: ['hard'], difficulty: 'hard', minutes: 20, rooms: 1, mobile: true, added: '2026-08-10', featured: true, sample: true, description: ['Ninety-nine doors are behind you. The last one has the hardest lock of them all.'], ...std },
  { slug: 'lost-in-the-library', title: 'Lost in the Library', themes: ['point-and-click'], difficulty: 'medium', minutes: 20, rooms: 2, mobile: true, added: '2026-08-05', featured: true, sample: true, description: ['The library closed with you inside. The way out is written in the books, if you know which ones to read.'], ...std },
  { slug: 'secret-passage', title: 'Secret Passage', themes: ['kids'], difficulty: 'easy', minutes: 10, rooms: 1, mobile: true, added: '2026-07-30', featured: true, sample: true, description: ['Somewhere in this study is a bookcase that moves. Find the switch and follow the secret passage.'], ...std },
];

// Игры с собственным артом: обложка 800x600, постер 16:9 и превью комнат в /images/games/.
const realArt: Record<string, { gameId: string; room1: string; room2?: string }> = {
  'castle-of-secrets': { gameId: 'hall', room1: 'The Great Hall', room2: 'The Grand Staircase' },
  'midnight-manor': { gameId: 'ballroom', room1: 'The Ballroom', room2: 'The Library' },
  'the-haunted-house': { gameId: 'parlor', room1: 'The Parlor', room2: 'The Upstairs Hall' },
  'witchs-cabin': { gameId: 'cabin', room1: "The Witch's Cabin", room2: 'The Moonlit Forest' },
  'pumpkin-puzzle': { gameId: 'patch', room1: 'The Pumpkin Patch' },
  'trick-or-escape': { gameId: 'hallway', room1: 'The Hallway', room2: 'The Kitchen' },
  'the-cursed-manor': { gameId: 'study', room1: 'The Study', room2: 'The Crypt' },
  'shadow-circus': { gameId: 'bigtop', room1: 'The Big Top', room2: 'The Wagon Yard' },
  'prison-break': { gameId: 'cell', room1: 'Cell 7', room2: 'The Corridor' },
  'cell-block-13': { gameId: 'cell12', room1: 'Cell 12', room2: 'Cell 13' },
  'solitary': { gameId: 'solitary', room1: 'Solitary' },
  'the-guard-room': { gameId: 'guardroom', room1: 'The Guard Room' },
  'the-locked-attic': { gameId: 'attic', room1: 'The Attic' },
};

// Atlas cells follow catalog order. Replace with individual game art when available.
// Playable games: difficulty and time come from scripts/rate-games.mjs (worked out from game.json), not by hand.
const ratings = rated as Record<string, { difficulty: Difficulty; minutes: number }>;
games.forEach((game) => {
  const r = ratings[game.slug];
  if (!r) return;
  game.difficulty = r.difficulty; game.minutes = r.minutes;
  // The "Hard" theme page lists exactly the games rated hard.
  game.themes = game.themes.filter((t) => t !== 'hard');
  if (r.difficulty === 'hard') game.themes.push('hard');
});

games.forEach((game, coverIndex) => {
  const art = realArt[game.slug];
  if (art) {
    game.image = `/images/games/${game.slug}.webp`;
    game.poster = `/images/games/${game.slug}-poster.webp`;
    game.roomList = [
      { title: art.room1, gameId: art.gameId, status: 'open', image: game.poster, embedUrl: game.embedUrl },
      ...(art.room2 ? [{ title: art.room2, status: 'soon' as const, image: `/images/games/${game.slug}-room2.webp` }] : []),
    ];
    return;
  }
  game.image = '/images/escape-covers-v1.png';
  game.coverIndex = coverIndex;
});

export const gameBySlug = (slug: string) => games.find((g) => g.slug === slug);
