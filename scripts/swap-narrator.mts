// Re-voices the narrator lines with another ElevenLabs voice, fitted to the existing clip lengths
// so the scene timing stays intact (ffmpeg atempo, pitch preserved). Word timings are rescaled.
// The previous files are kept in public/audio/vo-backup/<voiceId>/.
// Run: npx tsx scripts/swap-narrator.mts <voiceId> [--fit id1,id2] [--free id3,id4]
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LINES } from "../src/script";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) throw new Error("ELEVENLABS_API_KEY is missing (put it in .env)");
const FORMAT = process.env.ELEVEN_FORMAT ?? "mp3_44100_128";

const voiceId = process.argv[2];
if (!voiceId) throw new Error("usage: swap-narrator.mts <voiceId> [--fit ids] [--free ids]");
const arg = (flag: string) => (process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1].split(",") : []);
const fit = arg("--fit"); // keep the old duration
const free = arg("--free"); // natural duration (new lines)

const VO_DIR = join(process.cwd(), "public", "audio", "vo");
const TMP = join(process.cwd(), "out", "tmp-voice");
mkdirSync(TMP, { recursive: true });

type Alignment = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
type Word = { text: string; start: number; end: number };

const toWords = (a: Alignment): Word[] => {
  const words: Word[] = [];
  let cur: Word | null = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = { text: "", start: a.character_start_times_seconds[i], end: 0 };
    cur.text += ch;
    cur.end = a.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words;
};

const probe = (file: string) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

for (const id of [...fit, ...free]) {
  const line = LINES.find((l) => l.id === id);
  if (!line) throw new Error(`unknown line ${id}`);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=${FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text: line.tts ?? line.text, model_id: "eleven_v4", ...(line.seed !== undefined ? { seed: line.seed } : {}) }),
  });
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { audio_base64: string; alignment: Alignment };
  const raw = join(TMP, `${id}.mp3`);
  writeFileSync(raw, Buffer.from(data.audio_base64, "base64"));
  let words = toWords(data.alignment);
  const out = join(VO_DIR, `${id}.mp3`);
  const json = join(VO_DIR, `${id}.json`);

  if (existsSync(out)) {
    const backup = join(process.cwd(), "public", "audio", "vo-backup", voiceId);
    mkdirSync(backup, { recursive: true });
    copyFileSync(out, join(backup, `${id}.prev.mp3`));
    if (existsSync(json)) copyFileSync(json, join(backup, `${id}.prev.json`));
  }

  let duration = probe(raw);
  if (fit.includes(id)) {
    const orig = join(process.cwd(), "public", "audio", "vo-backup", voiceId, `${id}.orig.json`);
    if (!existsSync(orig)) copyFileSync(join(process.cwd(), "public", "audio", "vo-backup", voiceId, `${id}.prev.json`), orig);
    const target = (JSON.parse(readFileSync(orig, "utf8")) as { duration: number }).duration;
    const ratio = duration / target; // >1 means the new read is longer and must speed up
    if (ratio < 0.5 || ratio > 2) throw new Error(`${id}: tempo ratio ${ratio.toFixed(2)} out of range`);
    if (ratio <= 1.0) {
      // The new read is shorter: keep its natural pace (never slow a voice down).
      copyFileSync(raw, out);
      console.log(`${id.padEnd(13)} natural ${duration.toFixed(2)}s (was ${target.toFixed(2)}s)`);
      writeFileSync(json, JSON.stringify({ id, text: line.text, duration, words }, null, 2));
      continue;
    }
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-filter:a", `atempo=${ratio.toFixed(4)}`, "-b:a", "192k", out]);
    words = words.map((w) => ({ ...w, start: w.start / ratio, end: w.end / ratio }));
    duration = target;
    console.log(`${id.padEnd(13)} fitted ×${ratio.toFixed(3)} → ${target.toFixed(2)}s`);
  } else {
    copyFileSync(raw, out);
    console.log(`${id.padEnd(13)} natural ${duration.toFixed(2)}s`);
  }
  writeFileSync(json, JSON.stringify({ id, text: line.text, duration, words }, null, 2));
}
