// The spoken script. `text` is what captions show; `tts` (optional) is what the voice reads.
export const VOICES = {
  narrator: "nPczCjzI2devNBz1zQrb", // Brian: deep, resonant
  selger: "EXAVITQu4vr4xnSDxMaL", // Sarah: mature, reassuring
  seller: "iP95p4xoKVk53GoZ742B", // Chris: casual, down-to-earth
} as const;

export type Line = {
  id: string;
  voiceId: string;
  text: string;
  tts?: string;
  seed?: number;
};

export const LINES: Line[] = [
  { id: "s1-hook", voiceId: VOICES.narrator, text: "Selling your old stuff is a second job.", seed: 7 },
  { id: "s2-film", voiceId: VOICES.narrator, text: "Meet Selger. Just film what you want to sell.", seed: 7 },
  {
    id: "s3-see",
    voiceId: VOICES.narrator,
    text: "It picks the sharpest frames, cleans up the photos, and finds the exact model.",
    seed: 7,
  },
  {
    id: "s4-price",
    voiceId: VOICES.narrator,
    text: "It checks what it's really worth. You set the floor. It aims higher.",
    seed: 7,
  },
  {
    id: "s5-list",
    voiceId: VOICES.narrator,
    text: "Then it lists everywhere. Even where there's no API.",
    tts: "Then it lists everywhere. Even where there's no A.P.I.",
    seed: 7,
  },
  {
    id: "s6-negotiate",
    voiceId: VOICES.narrator,
    text: "Buyers come in from every channel. Selger negotiates with all of them at once. It anchors high, concedes slowly, and never goes below your floor.",
    seed: 7,
  },
  {
    id: "s6-scam",
    voiceId: VOICES.narrator,
    text: "Scams? Caught before you ever see them.",
    seed: 7,
  },
  {
    id: "s7-call",
    voiceId: VOICES.selger,
    text: "Hi, it's Selger. Ola offers 1,650, shipped. That's just under your target. Should I take it?",
    tts: "Hi, it's Selger. Ola offers sixteen-fifty, shipped. That's just under your target. Should I take it?",
    seed: 3,
  },
  { id: "s7-reply", voiceId: VOICES.seller, text: "Yeah, take it.", seed: 3 },
  {
    id: "s8-sold",
    voiceId: VOICES.narrator,
    text: "Sold. Delisted everywhere else. You just drop it in the mailbox.",
    seed: 7,
  },
  { id: "s9-punch", voiceId: VOICES.narrator, text: "Selger. Point. Shoot. Sold.", seed: 7 },
];
