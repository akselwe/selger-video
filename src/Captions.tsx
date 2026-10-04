import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, SANS } from "./theme";
import { VO_AT } from "./timing";
import { VO } from "./vo";

// Narration captions: words appear as they are spoken; key words get the highlighter.
// The phone call and the punchline are captioned inside their own scenes.
const CAPTIONED = ["s2-film", "s3-see", "s4-price", "s5-list", "s6-negotiate", "s6-scam", "s8-sold"];

const HIGHLIGHT: Record<string, string[]> = {
  "s1-hook": ["second", "job."],
  "s2-film": ["film"],
  "s3-see": ["exact", "model."],
  "s4-price": ["floor."],
  "s5-list": ["everywhere.", "no", "A.P.I."],
  "s6-negotiate": ["all", "at", "once.", "never"],
  "s6-scam": ["Caught"],
  "s8-sold": ["Sold."],
};

// Split long lines into caption chunks: break after sentence punctuation, at most 9 words,
// and never leave a short orphan chunk at the end.
const chunk = (words: { text: string }[]) => {
  const out: number[][] = [];
  let cur: number[] = [];
  words.forEach((w, i) => {
    cur.push(i);
    const sentenceEnd = /[.?!]$/.test(w.text);
    const comma = /,$/.test(w.text);
    if ((sentenceEnd && cur.length >= 2) || (comma && cur.length >= 5) || cur.length >= 9) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) {
    if (cur.length < 3 && out.length) out[out.length - 1].push(...cur);
    else out.push(cur);
  }
  return out;
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  for (const id of CAPTIONED) {
    const clip = VO[id];
    const at = VO_AT[id];
    if (t < at - 0.05 || t > at + clip.duration + 0.4) continue;
    const groups = chunk(clip.words);
    const local = t - at;
    // Active group: the last one whose first word has started.
    let gi = 0;
    groups.forEach((g, i) => {
      if (local >= clip.words[g[0]].start - 0.05) gi = i;
    });
    const group = groups[gi];
    const groupEnd = clip.words[group[group.length - 1]].end;
    const isLast = gi === groups.length - 1;
    const opacity = isLast
      ? interpolate(local, [groupEnd + 0.15, groupEnd + 0.4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1;
    const hl = HIGHLIGHT[id] ?? [];
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 92, pointerEvents: "none" }}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 46,
            letterSpacing: "-0.01em",
            color: C.ink,
            textAlign: "center",
            maxWidth: 1500,
            opacity,
            textShadow: "0 2px 18px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)",
          }}
        >
          {group.map((wi) => {
            const w = clip.words[wi];
            const shown = local >= w.start - 0.04;
            const appear = interpolate(local, [w.start - 0.04, w.start + 0.08], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const marked = hl.includes(w.text);
            return (
              <span
                key={wi}
                style={{
                  opacity: shown ? appear : 0,
                  display: "inline-block",
                  marginRight: 12,
                  padding: marked ? "0 8px" : 0,
                  borderRadius: 4,
                  background: marked ? C.mark : "transparent",
                  color: marked ? C.onMark : C.ink,
                  textShadow: marked ? "none" : undefined,
                }}
              >
                {w.text === "A.P.I." ? "API." : w.text}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }
  return null;
};
