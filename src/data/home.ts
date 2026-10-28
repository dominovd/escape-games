import copy from './copy.json';
import type { FaqItem } from './themes';

export interface HomeSection { h2: string; paragraphs: string[] }
export interface HomeCopy {
  /** Строка под H1. */
  sub: string;
  /** Текстовый блок под сеткой: две колонки. */
  columns: HomeSection[][];
  faq: FaqItem[];
}

const defaults: HomeCopy = {
  sub: 'A locked door. A few hidden clues. Can you find your way out?',
  columns: [
    [
      {
        h2: 'One room. Plenty of secrets.',
        paragraphs: [
          'A drawer that won’t open. A note tucked behind a painting. A key with no obvious lock. Escape games ask you to make sense of little details like these until you find a way out. Some clues are easy to spot; others only make sense when you return to them later.',
          'Browse the rooms above and see what catches your eye. Each card gives you a difficulty level and a rough playing time, so you can choose a quick puzzle for a break or something longer to settle into. Available games run in your browser, with no download or account needed. You’ll see “Coming soon” on games that aren’t ready yet.',
        ],
      },
      {
        h2: 'Start by looking around',
        paragraphs: [
          'Click or tap to explore the room. Check the shelves, open the drawers and read any notes you find. In many games, you can collect objects and use them somewhere else: a small screwdriver might open a panel, while a pattern on the wall could be the code for a lock.',
          'You don’t have to work everything out in order. If a puzzle isn’t making sense, leave it for a moment and try another part of the room. A clue you haven’t found yet may be all you’re missing.',
        ],
      },
    ],
    [
      {
        h2: 'What kind of room are you in the mood for?',
        paragraphs: [
          'Start with a Halloween room for creaky doors, candlelit halls and a little mystery. Prison escapes swap the haunted house for locked cells and a route to freedom. If you’d rather take your time, look for an easy room; if you enjoy keeping track of several clues at once, try one marked hard.',
        ],
      },
      {
        h2: 'Playing on your phone?',
        paragraphs: [
          'Check the controls on the game page before you start. “Mouse & touch” means you can play with your fingers on a phone or tablet. “Best with a mouse” is your cue to use a computer. Turning your phone sideways can also make a wider room easier to explore.',
        ],
      },
      {
        h2: 'A little help when you need it',
        paragraphs: [
          'A good hint can get you moving again without giving everything away. Where a walkthrough is available, you can read a hint first and leave the full solution closed. There’s no need to spoil the next puzzle just because this one has you stuck.',
        ],
      },
    ],
  ],
  faq: [
    { q: 'Are these escape games free?', a: 'Yes. You won’t need to pay or create an account. Available games open right in your browser; those still in development are marked Coming soon.' },
    { q: 'Can I play escape games on my phone?', a: 'Look for “Mouse & touch” on the game page. Those games support phones and tablets. For games marked “Best with a mouse,” use a computer.' },
    { q: 'What if I get stuck?', a: 'If a game has a walkthrough, you’ll find a link on its page. Start with the hint and open the solution only if you still need help.' },
    { q: 'Is my progress saved?', a: 'Saving depends on the game. Check its own menu for a save or continue option before closing the tab.' },
  ],
};

/** Переписанные тексты из copy.json (scripts/rewrite-copy.mjs) имеют приоритет над defaults. */
const override = (copy as unknown as { home?: Partial<HomeCopy> }).home ?? {};
export const home: HomeCopy = { ...defaults, ...override };
