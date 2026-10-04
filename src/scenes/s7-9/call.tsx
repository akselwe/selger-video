// Shared call pieces (scene 7 and the on-stage Transition): live voice analysis, word-by-word
// transcript and the 3D backdrop.
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React from "react";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import { Glow } from "../../three/Glow";
import { Stage } from "../../three/Stage";
import { C, SANS } from "../../theme";
import { clamp } from "../../ui/anim";
import { VO } from "../../vo";
import { Dust, Ripple, lerp, prog } from "./common";

export type VoiceClip = { readonly id: string; readonly at: number; readonly who: "agent" | "you" };

// Spectrum of whichever clip is playing at `frame`, plus who is speaking and a 0..1 level.
// `clips` must have a fixed length per component (one audio-data hook per clip).
export const useVoice = (frame: number, clips: readonly VoiceClip[]) => {
  const { fps } = useVideoConfig();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const data = clips.map((c) => useAudioData(staticFile(`audio/vo/${c.id}.mp3`)));
  let bins: number[] = [];
  let speaker: "agent" | "you" | null = null;
  clips.forEach((c, i) => {
    const d = data[i];
    const end = c.at + Math.round(VO[c.id].duration * fps);
    if (frame >= c.at && frame < end + 2) speaker = c.who;
    const f = frame - c.at;
    if (!d || f < 0 || f > d.durationInSeconds * fps || bins.length) return;
    const raw = visualizeAudio({ fps, frame: f, audioData: d, numberOfSamples: 64 });
    // Speech peaks around -15…-30 dB in the low bins, silence sits below -75 dB.
    bins = raw.slice(0, 28).map((v) => {
      const db = 20 * Math.log10(Math.max(v, 1e-6));
      return Math.min(1, Math.max(0, (db + 64) / 46)) ** 1.3;
    });
  });
  const level = bins.length ? bins.slice(0, 16).reduce((s, v) => s + v, 0) / 16 : 0;
  return { bins, speaker: speaker as "agent" | "you" | null, level };
};

// ---------- word-by-word transcript ----------
export type TWord = { readonly text: string; readonly f: number; readonly hl?: boolean };

export const clipWords = (id: string, at: number, opts: { hl?: (i: number) => boolean } = {}): TWord[] =>
  VO[id].words.map((w, i) => ({ text: w.text, f: at + Math.round(w.start * 30), hl: opts.hl?.(i) }));

// Hex colour mix (a -> b by t).
export const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map((k) => parseInt(b.slice(k, k + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",")})`;
};

export const Words: React.FC<{
  words: TWord[];
  frame: number;
  activeColor: string;
  size?: number;
  color?: string;
  weight?: number;
  soft?: boolean; // soft highlight (mark text on mark-soft) instead of the full highlighter
}> = ({ words, frame, activeColor, size = 32, color = C.ink, weight = 500, soft }) => (
  <div style={{ fontFamily: SANS, fontSize: size, lineHeight: 1.36, fontWeight: weight, color, letterSpacing: "-0.01em" }}>
    {words.map((w, i) => {
      const o = interpolate(frame, [w.f - 2, w.f + 3], [0, 1], clamp);
      const fresh = interpolate(frame, [w.f, w.f + 10], [1, 0], clamp);
      const hl = w.hl ? prog(frame, w.f, 8) : 0;
      const nextHl = words[i + 1]?.hl ?? false;
      return (
        <span
          key={i}
          style={{
            opacity: o,
            display: "inline-block",
            transform: `translateY(${(1 - o) * 8}px)`,
            filter: o < 1 ? `blur(${(1 - o) * 4}px)` : undefined,
            color: hl > 0 ? (soft ? C.mark : hl > 0.5 ? C.onMark : C.ink) : fresh > 0.01 ? mix(activeColor, color, 1 - fresh) : color,
            backgroundImage: w.hl ? `linear-gradient(${soft ? C.markSoft : C.mark}, ${soft ? C.markSoft : C.mark})` : undefined,
            backgroundSize: `${hl * 100}% 100%`,
            backgroundRepeat: "no-repeat",
            padding: w.hl ? "0 0.13em" : "0",
            margin: w.hl ? (nextHl ? "0" : "0 0.13em 0 0") : "0 0.26em 0 0",
          }}
        >
          {w.text}
        </span>
      );
    })}
  </div>
);

// ---------- 3D backdrop for a call ----------
export const CallBackdrop: React.FC<{
  frame: number;
  level: number;
  answerAt: number;
  ringAt: number;
  seed?: string;
  x?: number; // horizontal offset of the light and ripples (world units)
}> = ({ frame, level, answerAt, ringAt, seed = "s7", x = 0 }) => {
  const rise = prog(frame, 0, 30);
  const ring = 1 - prog(frame, answerAt, 20);
  return (
    <Stage camera={{ position: [0, 0, 8] }} fog={[6, 22]}>
      <group position={[0, 0, frame * 0.004]} rotation={[0, Math.sin(frame / 120) * 0.04, 0]}>
        <Glow position={[x, 0.2, -3]} size={9 + level * 2} opacity={(0.2 + level * 0.25) * rise} color={C.agentDeep} />
        <Glow position={[x, 0.6, -2]} size={4.5} opacity={(0.12 + level * 0.3 + ring * 0.12) * rise} color={C.agent} />
        {[0, 12, 24].map((s) => (
          <Ripple key={s} progress={(frame - ringAt - s) / 46} from={1.3} to={4.6} position={[x * 1.3, 0.1, -2.4]} opacity={0.22} width={0.03} />
        ))}
        <Dust frame={frame} seed={seed} count={70} speed={0.003} opacity={0.7 * interpolate(frame, [0, 12], [0, 1], clamp)} />
      </group>
    </Stage>
  );
};
