export interface FaqItem {
  q: string;
  a: string;
}

export interface Theme {
  slug: string; // URL: /{slug}-escape-games/
  name: string; // короткое имя для плиток и меню
  h1: string;
  title: string; // <title>
  metaDescription: string;
  intro: string; // 1-2 предложения над сеткой
  body: { h2: string; text: string }[]; // текст под сеткой
  faq?: FaqItem[];
  accent: string; // цвет темы
  icon: 'prison' | 'skull' | 'pumpkin' | 'snow' | 'car' | 'kids' | 'trophy' | 'cursor';
  seasonal?: boolean;
}

export const themes: Theme[] = [
  {
    slug: 'halloween',
    name: 'Halloween',
    h1: 'Halloween Escape Games',
    title: 'Halloween Escape Games: Play Free Online',
    metaDescription:
      'Free Halloween escape games you can play in your browser: haunted houses, witch cabins, cursed manors and pumpkin puzzles. No downloads, no sign-up.',
    intro:
      'The candles are lit, the door has shut behind you, and something upstairs is creaking. Pick a room and see what’s waiting inside.',
    body: [
      {
        h2: 'What makes a good Halloween escape game',
        text:
          'A portrait that seems to be watching you. A potion recipe with an ingredient missing. A locked door at the end of a candlelit hall. Halloween rooms give familiar puzzles a spooky twist. Search each scene and see which details belong together.',
      },
      {
        h2: 'Easy, medium and hard Halloween escapes',
        text:
          'Want a quick puzzle before bed, or something to spend the evening on? Use the difficulty and playing time filters to narrow the list. If a room has a walkthrough, try the hint first; you can leave the solution closed until you need it.',
      },
    ],
    faq: [
      { q: 'Are these Halloween escape games free?', a: 'Yes, available games are free and run in your browser. Games still in development are marked Coming soon.' },
      { q: 'Are they scary?', a: 'Expect haunted houses, dimly lit rooms and a spooky atmosphere. The tone varies by game, so check the description before you play.' },
    ],
    accent: '#ff7a1a',
    icon: 'pumpkin',
    seasonal: true,
  },
  {
    slug: 'prison',
    name: 'Prison',
    h1: 'Prison Escape Games',
    title: 'Prison Escape Games: Break Out Online for Free',
    metaDescription:
      'Free prison escape games online: plan the break, dig tunnels, pick locks and slip past the guards. Play in your browser on PC or mobile.',
    intro:
      'The cell door is locked, but there must be a way out. Search for useful objects and work out your next move.',
    body: [
      {
        h2: 'How prison escape games work',
        text:
          'Start with what you can reach. A loose fitting, an old note or something left under the bed could be useful. These rooms are about spotting opportunities in an unpromising place, then working out how to use them. Some escapes stay inside one cell; others take you through several parts of the prison.',
      },
      {
        h2: 'Play the prison break series in order',
        text:
          'Following the Prison Break story? Start with the first part and use the next-room link on each game page to continue. The series page keeps the chapters together so you can find your place.',
      },
    ],
    faq: [
      { q: 'Can I play prison escape games on my phone?', a: 'Look for “Mouse & touch” on the game page. If it says “Best with a mouse,” use a computer instead.' },
      { q: 'Is my progress saved?', a: 'It depends on the game. Check its menu for a save or continue option before closing the tab.' },
    ],
    accent: '#9aa7b5',
    icon: 'prison',
  },
  {
    slug: 'horror',
    name: 'Horror',
    h1: 'Horror Escape Games',
    title: 'Horror Escape Games: Free Scary Escape Rooms Online',
    metaDescription:
      'Free horror escape games online: abandoned labs, dark cabins and haunted rooms. Find the clues and get out. Play in your browser.',
    intro: 'Something feels wrong about this place. Look closely, follow the clues and try to keep your nerve.',
    body: [
      {
        h2: 'Scary escape rooms you can play online',
        text:
          'It’s harder to concentrate on a lock when you’re wondering what made that noise. Horror rooms add unease to the puzzle: deserted buildings, strange equipment and clues to what happened before you arrived. Check each description to find a setting you’re comfortable with.',
      },
    ],
    accent: '#7ee36b',
    icon: 'skull',
  },
  {
    slug: 'christmas',
    name: 'Christmas',
    h1: 'Christmas Escape Games',
    title: 'Christmas Escape Games: Free Holiday Escape Rooms Online',
    metaDescription:
      'Free Christmas escape games online: snowy cabins, Santa’s workshop and locked holiday rooms. Play in your browser, no sign-up.',
    intro: 'Snow outside, a locked door inside, and a few holiday surprises to work out. Settle in for a Christmas puzzle.',
    body: [
      {
        h2: 'Holiday escape rooms for the whole family',
        text:
          'Put on something warm and try a holiday room. Look among the decorations, gifts and workshop shelves for clues. You can take turns spotting details or work through the puzzle together.',
      },
    ],
    accent: '#4fc3f7',
    icon: 'snow',
    seasonal: true,
  },
  {
    slug: 'car',
    name: 'Car',
    h1: 'Escape the Car Games',
    title: 'Escape the Car Games: Free Online Car Escape',
    metaDescription: 'Free escape the car games online: locked cars, garages and parking lots. Find the keys and drive out.',
    intro: 'Locked in a car or a garage? Find the keys, open the gate and drive out.',
    body: [
      {
        h2: 'Car and garage escape games',
        text:
          'The keys have to be somewhere. Check the glovebox, look around the garage and see what you can do with the tools you find. A familiar setting can still hide a surprisingly tricky puzzle.',
      },
    ],
    accent: '#ffc83d',
    icon: 'car',
  },
  {
    slug: 'kids',
    name: 'Kids',
    h1: 'Escape Games for Kids',
    title: 'Escape Games for Kids: Easy Free Escape Rooms Online',
    metaDescription: 'Easy, friendly escape games for kids. Simple puzzles, no scary content, free to play in the browser.',
    intro: 'Start with a smaller puzzle: colorful rooms, simple clues and a gentler challenge.',
    body: [
      {
        h2: 'Easy escape rooms for younger players',
        text:
          'An easy room is a good place to learn how escape puzzles work. Look for matching colors, familiar shapes and objects that fit together. An adult can help read the clues or offer a small hint when needed; check each game description before choosing a room.',
      },
    ],
    accent: '#5ee08a',
    icon: 'kids',
  },
  {
    slug: 'hard',
    name: 'Hard',
    h1: 'Hard Escape Games',
    title: 'Hard Escape Games: Difficult Escape Rooms Online',
    metaDescription: 'The hardest free escape games online: multi-step puzzles, hidden objects and long chains of clues.',
    intro: 'Ready for something trickier? These rooms ask you to connect more clues and look a little closer.',
    body: [
      {
        h2: 'Difficult escape rooms for experienced players',
        text:
          'Keep a note of anything that looks useful, even if it doesn’t make sense yet. Harder rooms often ask you to connect details from different places. If you hit a dead end, revisit an earlier scene with what you’ve learned.',
      },
    ],
    accent: '#ff5a4f',
    icon: 'trophy',
  },
  {
    slug: 'point-and-click',
    name: 'Point & Click',
    h1: 'Point and Click Escape Games',
    title: 'Point and Click Escape Games: Free Online',
    metaDescription: 'Free point and click escape games: explore each scene with your mouse or finger, collect items and solve puzzles.',
    intro: 'Take your time, explore each scene and see what you can find. A small detail might open up the next room.',
    body: [
      {
        h2: 'Classic point and click room escapes',
        text:
          'No complicated controls to learn: just explore, collect useful objects and try things out. Check a drawer, read a note, then return to that lock you couldn’t open. The fun is in slowly seeing how the room fits together.',
      },
    ],
    accent: '#c792ea',
    icon: 'cursor',
  },
];

export const themeBySlug = (slug: string) => themes.find((t) => t.slug === slug);
