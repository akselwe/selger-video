// Generates narration and phone-call lines with ElevenLabs (eleven_v4, with timestamps).
// Writes public/audio/vo/<id>.mp3 and public/audio/vo/<id>.json (word timings).
// Run: npx tsx scripts/generate-voice.mts [--only id1,id2]
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LINES } from "../src/script";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  throw new Error("ELEVENLABS_API_KEY is missing (put it in .env)");
}

const OUT_DIR = join(process.cwd(), "public", "audio", "vo");
mkdirSync(OUT_DIR, { recursive: true });

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

type Word = { text: string; start: number; end: number };

const toWords = (a: Alignment): Word[] => {
  const words: Word[] = [];
  let current: Word | null = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (current) words.push(current);
      current = null;
      return;
    }
    if (!current) {
      current = { text: "", start: a.character_start_times_seconds[i], end: 0 };
    }
    current.text += ch;
    current.end = a.character_end_times_seconds[i];
  });
  if (current) words.push(current);
  return words;
};

const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1].split(",")
  : null;

for (const line of LINES) {
  if (only && !only.includes(line.id)) continue;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${line.voiceId}/with-timestamps?output_format=${process.env.ELEVEN_FORMAT ?? "mp3_44100_128"}`,
    {
      method: "POST",
      headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: line.tts ?? line.text,
        model_id: "eleven_v4",
        ...(line.seed !== undefined ? { seed: line.seed } : {}),
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`${line.id}: HTTP ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    audio_base64: string;
    alignment: Alignment;
  };
  writeFileSync(join(OUT_DIR, `${line.id}.mp3`), Buffer.from(data.audio_base64, "base64"));
  const words = toWords(data.alignment);
  const duration = data.alignment.character_end_times_seconds.at(-1) ?? 0;
  writeFileSync(
    join(OUT_DIR, `${line.id}.json`),
    JSON.stringify({ id: line.id, text: line.text, duration, words }, null, 2),
  );
  console.log(`${line.id.padEnd(12)} ${duration.toFixed(2)}s  ${line.text}`);
}
