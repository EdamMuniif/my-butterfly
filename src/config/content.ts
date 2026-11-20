/* ------------------------------------------------------------------
   Everything personal lives in this file: words, colours, assets.
   Edit the text here; no other file needs to change.
------------------------------------------------------------------- */

export const CONTENT = {
  title: 'A Little Blue Garden',
  subtitle: 'Every butterfly found its way here. So did I.',

  scene1: {
    greeting: 'Hey, my butterfly 🦋',
    lines: ["I know it's been a while…", 'But I made you a little something.'],
    cta: 'Enter Your Garden 🩵',
  },

  scene2: {
    lines: [
      "Some days feel a little longer when you're not around.",
      "And some journeys feel special because of who's waiting at the end.",
      "Today, I'm on my way to see you.",
      "And I couldn't arrive without bringing you something.",
    ],
    cta: 'Follow the Butterfly',
  },

  scene3: {
    lines: ['Some flowers are beautiful…', 'But this one carries something special.'],
    prompt: 'Touch the rose.',
    reveal: "If I could give you a flower for every moment I've missed you, you'd have an entire garden.",
    cta: "There's More…",
  },

  scene4: {
    hint: 'Tap a butterfly',
    counter: (found: number, total: number) => `${found} of ${total} found`,
    close: 'Keep looking',
    butterflies: [
      { title: 'The Smile', text: 'One of my favorite things is seeing you smile.', kind: 'azure' },
      { title: 'The Distance', text: "No matter how much time passes between our meetings, I'm always excited to see you again.", kind: 'sky' },
      { title: 'The Little Things', text: "It's the little moments with you that become my favorite memories.", kind: 'royal' },
    ] as { title: string; text: string; kind: BfKind }[],
    done: 'One last little surprise…',
    cta: 'Open Your Letter 💌',
  },

  scene5: {
    sealHint: 'Tap the seal',
    envelopeLabel: 'For you',
    greeting: 'To my butterfly,',
    letter: [
      "It's been a while since I last saw you.",
      'And today, on my way to meet you, I wanted to do something a little different.',
      "I know this isn't a real garden, and these aren't flowers you can hold.",
      "But I wanted to make you something that's just yours.",
      'A little place filled with the things you love.',
      'Blue skies, beautiful roses, and butterflies.',
      'Something you can open whenever you want to smile.',
      "I'm really happy that I get to see you again today.",
      "And of all the places I could be going, I'm happiest that this journey ends with you.",
    ],
    closing: 'See you soon, my butterfly. 🩵',
    signoff: 'Made with love, just for you.',
    cta: 'Make the Garden Bloom ✨',
    final: "The best part of today isn't this gift. It's seeing you again.",
    replay: 'Replay',
  },

  qr: {
    title: 'A Little Surprise For You 🦋',
    sub: 'Scan to enter your garden.',
  },
};

export const COLORS = {
  navy: '#050C1E',
  ocean: '#102A56',
  royal: '#2864C5',
  sky: '#9BD9FF',
  ice: '#D6F2FF',
  gold: '#E9C998',
};

/* Assets: processed from /reference by tools/process_images.py */
// Absolute URL: CSS custom properties (used for butterfly wings) would
// otherwise resolve a relative path against the stylesheet's folder.
export const IMG = (file: string) => new URL(`images/${file}`, new URL(import.meta.env.BASE_URL, document.baseURI)).href;

export type BfKind = 'azure' | 'sky' | 'royal' | 'indigo';
export const BUTTERFLIES: Record<BfKind, { src: string; ar: number }> = {
  azure: { src: 'bf-azure.webp', ar: 328 / 420 },
  sky: { src: 'bf-sky.webp', ar: 331 / 420 },
  royal: { src: 'bf-royal.webp', ar: 295 / 420 },
  indigo: { src: 'bf-indigo.webp', ar: 320 / 420 },
};

export const ROSES = {
  stem: 'rose-stem.webp',
  stemBlur: 'rose-stem-blur.webp',
  open: 'rose-open.webp',
  openBlur: 'rose-open-blur.webp',
  stemAR: 651 / 945,
  openAR: 635 / 602,
  /* where the open rose sits over the stemmed bud, % of the stem box */
  openBox: { left: -4.9, top: -7, width: 97 },
  /* rose spiral centre: in the stem image, and in the open image */
  stemSpiral: { x: 46.1, y: 14.8 },
  openSpiral: { x: 52.6, y: 34.4 },
};

export const PRELOAD = [
  ...Object.values(BUTTERFLIES).map((b) => b.src),
  ROSES.stem, ROSES.stemBlur, ROSES.open, ROSES.openBlur,
];
