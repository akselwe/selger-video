// Single source of truth for the timeline, in seconds. Scenes play back to back.
export const FPS = 30;

export const SCENES = [
  { id: "hook", start: 0.0, end: 3.6 },
  { id: "film", start: 3.6, end: 7.3 },
  { id: "see", start: 7.3, end: 13.0 },
  { id: "price", start: 13.0, end: 18.3 },
  { id: "list", start: 18.3, end: 22.4 },
  { id: "negotiate", start: 22.4, end: 37.4 },
  { id: "call", start: 37.4, end: 48.2 },
  { id: "sold", start: 48.2, end: 53.6 },
  { id: "punch", start: 53.6, end: 59.5 },
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
  "s7-call": 38.7,
  "s7-reply": 46.4,
  "s8-sold": 48.5,
  "s9-punch": 54.2,
};

// Sound effects: absolute start time in seconds.
export const SFX_AT: { id: string; at: number; volume?: number }[] = [
  { id: "marker", at: 0.35, volume: 0.7 },
  { id: "shutter", at: 5.2, volume: 0.8 },
  { id: "burst", at: 7.35, volume: 0.9 },
  { id: "lock", at: 16.9, volume: 0.6 },
  { id: "riser", at: 18.3, volume: 0.7 },
  { id: "pop", at: 24.2, volume: 0.5 },
  { id: "pop", at: 26.0, volume: 0.5 },
  { id: "pop", at: 27.9, volume: 0.5 },
  { id: "pop", at: 29.8, volume: 0.5 },
  { id: "shatter", at: 35.0, volume: 0.8 },
  { id: "ring", at: 37.45, volume: 0.8 },
  { id: "chime", at: 48.25, volume: 0.8 },
  { id: "collapse", at: 53.5, volume: 0.8 },
  { id: "boom", at: 56.8, volume: 1.0 },
];

export const sec = (s: number) => Math.round(s * FPS);
export const sceneFrames = (id: SceneId) => {
  const s = SCENES.find((x) => x.id === id)!;
  return { from: sec(s.start), durationInFrames: sec(s.end) - sec(s.start) };
};
