// Single source of truth for the timeline, in seconds. Scenes play back to back.
export const FPS = 30;

export const SCENES = [
  { id: "hook", start: 0.0, end: 3.6 },
  { id: "film", start: 3.6, end: 7.3 },
  { id: "see", start: 7.3, end: 13.0 },
  { id: "price", start: 13.0, end: 18.3 },
  { id: "list", start: 18.3, end: 22.4 },
  { id: "negotiate", start: 22.4, end: 37.0 },
  { id: "call", start: 37.0, end: 48.4 },
  { id: "sold", start: 48.4, end: 56.6 },
  { id: "punch", start: 56.6, end: 62.5 },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

export const TOTAL_SECONDS = SCENES[SCENES.length - 1].end;

// When each spoken line starts (absolute seconds). Durations come from the audio files.
export const VO_AT: Record<string, number> = {
  "s1-hook": 0.6,
  "s2-film": 3.75,
  "s3-see": 7.45,
  "s4-price": 13.15,
  "s5-list": 18.45,
  "s6-negotiate": 22.7,
  "s6-scam": 33.4,
  "s7-teo": 37.9,
  "s7-kris": 44.3,
  "s7-bye": 46.25,
  "s8-sold": 48.6,
  "s9-punch": 57.2,
};

// Sound effects: absolute start time in seconds.
export const SFX_AT: { id: string; at: number; volume?: number }[] = [
  { id: "marker", at: 0.35, volume: 0.7 },
  { id: "swish", at: 3.5, volume: 0.6 },
  { id: "swish", at: 12.9, volume: 0.6 },
  { id: "swish", at: 22.3, volume: 0.7 },
  { id: "shutter", at: 5.2, volume: 0.8 },
  { id: "burst", at: 7.35, volume: 0.9 },
  { id: "lock", at: 16.25, volume: 0.6 },
  { id: "riser", at: 18.3, volume: 0.7 },
  { id: "pop", at: 24.2, volume: 0.5 },
  { id: "pop", at: 26.0, volume: 0.5 },
  { id: "pop", at: 27.9, volume: 0.5 },
  { id: "pop", at: 29.8, volume: 0.5 },
  { id: "shatter", at: 35.0, volume: 0.8 },
  { id: "ring", at: 37.05, volume: 0.8 },
  { id: "chime", at: 48.45, volume: 0.8 },
  { id: "collapse", at: 56.5, volume: 0.8 },
  { id: "boom", at: 59.8, volume: 0.9 },
];

export const sec = (s: number) => Math.round(s * FPS);
export const sceneFrames = (id: SceneId) => {
  const s = SCENES.find((x) => x.id === id)!;
  return { from: sec(s.start), durationInFrames: sec(s.end) - sec(s.start) };
};

// After the hook video: the transition call (Teo calls Kris on stage) and the live demo slot.
export const TRANSITION = { ringAt: 0.1, teoAt: 1.3, seconds: 10.4 } as const;
export const DEMO_SECONDS = 97;

// Before the hook video: the problem (a boring chair in a corner, buyer messages piling up), then "Boring."
// Self-contained composition with its own audio. Keep the whole presentation at 3 minutes or less.
export const PROBLEM_SECONDS = 9.5;
