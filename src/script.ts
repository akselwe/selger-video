// The spoken script. `text` is what captions show; `tts` (optional) is what the voice reads.
export const VOICES = {
  narrator: "TX3LPaxmHKxFdv7VOQHJ", // Liam: energetic, young American (was Brian nPczCjzI2devNBz1zQrb)
  teo: "cjVigY5qzO86Huf0OWal", // Eric: smooth, trustworthy. Teo, the Selger agent on the phone
  kris: "iP95p4xoKVk53GoZ742B", // Chris: casual, down-to-earth. Kris, the seller
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
    id: "s7-teo",
    voiceId: VOICES.teo,
    text: "Hi Kris, it's Teo. A buyer is asking if the chair has been in a home with pets. Has it?",
    seed: 5,
  },
  { id: "s7-kris", voiceId: VOICES.kris, text: "No, no pets.", seed: 5 },
  { id: "s7-bye", voiceId: VOICES.teo, text: "Perfect, thanks. Bye.", seed: 5 },
  {
    id: "s8-sold",
    voiceId: VOICES.narrator,
    text: "Sold. Delisted everywhere else. You just drop it in the mailbox.",
    seed: 7,
  },
  { id: "s9-punch", voiceId: VOICES.narrator, text: "Selger. Point. Shoot. Sold.", seed: 7 },
  // After the hook video: Teo calls Kris on stage.
  {
    id: "t1-teo",
    voiceId: VOICES.teo,
    text: "Hey Kris, it's your Selger agent, Teo. Let's show these folks that this actually works, and isn't just a wannabe-fancy AI video.",
    seed: 5,
  },
  // The problem intro: said as the word slams onto the screen.
  { id: "b1-boring", voiceId: VOICES.narrator, text: "Boring.", seed: 7 },
  // After the live demo: the punchline again, in the past tense.
  { id: "r1-recap", voiceId: VOICES.narrator, text: "Pointed. Shot. Sold.", seed: 7 },
  // Outro after the live demo, in three beats so it can breathe: question, integrate, invitation.
  { id: "o1a-outro", voiceId: VOICES.narrator, text: "Not sold yet?", seed: 7 },
  {
    id: "o1b-outro",
    voiceId: VOICES.narrator,
    text: "Integrate it with our MCP in ChatGPT or Claude.",
    tts: "Integrate it with our M.C.P. in Chat G.P.T. or Claude.",
    seed: 7,
  },
  { id: "o1c-outro", voiceId: VOICES.narrator, text: "And give it a try.", seed: 7 },
  // (Single-line version, kept for reference.)
  {
    id: "o1-outro",
    voiceId: VOICES.narrator,
    text: "Not sold yet? Integrate it with our MCP in ChatGPT or Claude, and give it a try.",
    tts: "Not sold yet? ... Integrate it with our M.C.P. in Chat G.P.T. or Claude ... and give it a try.",
    seed: 7,
  },
];
