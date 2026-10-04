// Generates the music bed (ElevenLabs Music, composition plan matched to the timeline)
// and the sound effects (ElevenLabs sound generation).
// Run: npx tsx scripts/generate-music-sfx.mts [music|sfx] [--only id1,id2]
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SCENES } from "../src/timing";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) throw new Error("ELEVENLABS_API_KEY is missing (put it in .env)");
const FORMAT = process.env.ELEVEN_FORMAT ?? "mp3_44100_128";

const what = process.argv[2] ?? "all";
const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1].split(",")
  : null;

const post = async (url: string, body: unknown) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
};

const ms = (id: string) => {
  const s = SCENES.find((x) => x.id === id)!;
  return Math.round((s.end - s.start) * 1000);
};

if (what === "all" || what === "music") {
  const dir = join(process.cwd(), "public", "audio", "music");
  mkdirSync(dir, { recursive: true });
  const base = ["fast tempo electronic", "128 bpm", "driving", "energetic tech launch trailer", "punchy drums", "pulsing synth bass", "instrumental", "high production value"];
  const noVocals = ["vocals", "singing", "choir", "lyrics", "speech", "slow", "ambient intro"];
  const chunks = [
    { text: "[Instrumental]", durationMs: ms("hook"), positiveStyles: ["ticking hi-hats", "tense riser", "sub bass pulse", "128 bpm"], negativeStyles: noVocals },
    { text: "[Instrumental]", durationMs: ms("film") + ms("see"), positiveStyles: ["kick drum enters immediately", "fast arpeggiated synth", "128 bpm", "momentum"], negativeStyles: noVocals },
    { text: "[Instrumental]", durationMs: ms("price") + ms("list"), positiveStyles: ["full drums", "rolling bassline", "rising energy", "128 bpm"], negativeStyles: noVocals },
    { text: "[Instrumental]", durationMs: ms("negotiate"), positiveStyles: ["peak energy drop", "driving four on the floor", "big synth stabs", "fast", "intense", "128 bpm"], negativeStyles: noVocals },
    { text: "[Instrumental]", durationMs: ms("call"), positiveStyles: ["filtered groove", "kick and hats keep going", "lighter", "128 bpm"], negativeStyles: [...noVocals, "silence"] },
    { text: "[Instrumental]", durationMs: ms("sold"), positiveStyles: ["snare roll build", "rising", "triumphant", "128 bpm"], negativeStyles: noVocals },
    { text: "[Instrumental]", durationMs: ms("punch"), positiveStyles: ["one huge final hit", "cinematic impact", "short reverb tail"], negativeStyles: noVocals },
  ];
  const audio = await post(`https://api.elevenlabs.io/v1/music?output_format=${FORMAT}`, {
    model_id: "music_v2_5",
    composition_plan: {
      chunks: chunks.map((c, i) => ({
        // Text is sung as lyrics, so only an instrumental marker goes here; the mood lives in the styles.
        text: c.text,
        duration_ms: c.durationMs,
        positive_styles: i === 0 ? [...base, ...c.positiveStyles] : c.positiveStyles,
        negative_styles: c.negativeStyles,
        context_adherence: "high",
      })),
    },
  });
  writeFileSync(join(dir, process.env.MUSIC_OUT ?? "bed.mp3"), audio);
  console.log(`music: bed.mp3 ${(audio.length / 1024).toFixed(0)} kB`);
}

const SFX: { id: string; text: string; duration: number; influence?: number }[] = [
  { id: "marker", text: "A felt-tip highlighter pen drawing one quick stroke on paper, close up, dry", duration: 0.8 },
  { id: "shutter", text: "Modern smartphone camera shutter click, crisp, close", duration: 0.6 },
  { id: "burst", text: "Cinematic whoosh with a glassy shimmer, many small objects flying past the camera", duration: 1.4 },
  { id: "lock", text: "Small solid metallic lock click, satisfying UI sound", duration: 0.6 },
  { id: "riser", text: "Short cinematic swoosh riser that ends in a soft punch, three objects flying away", duration: 1.6 },
  { id: "pop", text: "Soft deep UI notification pop, short and clean, modern app", duration: 0.5 },
  { id: "shatter", text: "Glass panel shattering into small pieces, crisp, cinematic, short", duration: 1.2 },
  { id: "ring", text: "Modern smartphone ringtone, two short soft melodic rings, clean", duration: 1.4 },
  { id: "chime", text: "Bright satisfying success chime, cash register meets modern UI, short", duration: 1.0 },
  { id: "collapse", text: "Reverse whoosh sucking everything into one point, rising, ends abruptly", duration: 1.6 },
  { id: "boom", text: "Deep cinematic sub boom impact with a long dark tail, trailer logo hit", duration: 3.0 },
  { id: "swish", text: "Very fast clean whoosh swish for a video transition cut, short and punchy", duration: 0.5 },
  { id: "ping", text: "Single smartphone message notification ping, short, slightly annoying, close", duration: 0.5 },
  { id: "buzz", text: "Phone vibrating on a wooden table, one short double buzz", duration: 0.7 },
  { id: "tick", text: "Slow wall clock ticking in a quiet empty room, dull and boring", duration: 9.5, influence: 0.7 },
  { id: "boring", text: "Abrupt record scratch stop followed by one deep dull bass thud, comedic", duration: 1.4 },
  { id: "parcel", text: "Cardboard parcel dropped into a metal mailbox, soft thud and lid clank", duration: 1.0 },
  { id: "deliver", text: "Soft positive delivery confirmation chime, modern UI", duration: 0.8 },
];

if (what === "all" || what === "sfx") {
  const dir = join(process.cwd(), "public", "audio", "sfx");
  mkdirSync(dir, { recursive: true });
  for (const s of SFX) {
    if (only && !only.includes(s.id)) continue;
    const audio = await post(`https://api.elevenlabs.io/v1/sound-generation?output_format=${FORMAT}`, {
      text: s.text,
      duration_seconds: s.duration,
      prompt_influence: s.influence ?? 0.6,
      model_id: "eleven_text_to_sound_v2",
    });
    writeFileSync(join(dir, `${s.id}.mp3`), audio);
    console.log(`sfx: ${s.id}.mp3 ${(audio.length / 1024).toFixed(0)} kB`);
  }
}
