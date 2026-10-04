import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SANS } from "../theme";
import { clamp, pop } from "../ui/anim";
import { AgentMark, Label } from "../ui/kit";
import { FilmScene, filmCam } from "./s1-3/FilmSet";
import { Phone, QUOTE, TranscriptChip } from "./s1-3/Phone";
import { edgeFade, lerp, local, wordFrame } from "./s1-3/util";

// Scene 2: "Meet Selger. Just film what you want to sell."
// Hero shot of the oak chair, the Selger wordmark, then a phone slides in and films it.
const START = 3.6;
export const SHUTTER = local(5.2, START); // 48

// Handheld sway shared with scene 3 (absolute seconds in, so the cut matches).
export const sway = (tAbs: number) => ({
  dx: Math.sin(tAbs * 1.1) * 10 + Math.sin(tAbs * 2.3) * 3,
  dy: Math.cos(tAbs * 0.9) * 7,
  rotZ: Math.sin(tAbs * 0.8) * 1.2,
  rotY: -6 + Math.sin(tAbs * 0.6) * 3,
  rotX: 3 + Math.cos(tAbs * 0.7) * 1.5,
});

export const TRANSCRIPT_START = 58;
export const transcriptWords = (f: number) => Math.max(0, (f - TRANSCRIPT_START) / 4.4);

// The tucked-away lockup (top-left), as it ends scene 2. Scene 3 fades it out.
export const BrandSmall: React.FC = () => (
  <div style={{ transform: `scale(${0.36 * 1.02})`, transformOrigin: "left top", display: "flex", alignItems: "center", gap: 34 }}>
    <AgentMark size={92} />
    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 176, letterSpacing: "-0.045em", lineHeight: 1, color: C.ink, paddingBottom: 8 }}>
      Selger
    </div>
  </div>
);

export const S2Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const tAbs = START + frame / 30;
  const fade = edgeFade(frame, durationInFrames, 6, 0);

  // Brand lockup: big on the left, then tucks into the top-left corner.
  const meet = wordFrame("s2-film", 0, START);
  const selger = wordFrame("s2-film", 1, START);
  const markPop = pop(frame, meet + 1, fps, 12);
  const wordReveal = interpolate(frame, [selger - 4, selger + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tuck = interpolate(frame, [26, 48], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const subtitle = interpolate(frame, [selger + 6, selger + 14], [0, 1], clamp) * (1 - tuck);
  const brandX = lerp(120, 96, tuck);
  const brandY = lerp(430, 104, tuck);
  const brandScale = lerp(0.86, 0.36, tuck) * interpolate(frame, [0, 34], [0.97, 1.02], clamp);

  // Phone enters from below as "Just film" is spoken.
  const enterP = interpolate(frame, [31, 53], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const s = sway(tAbs);
  const flash = interpolate(frame, [SHUTTER, SHUTTER + 1, SHUTTER + 10], [0, 0.9, 0], clamp);
  const bump = interpolate(frame, [SHUTTER, SHUTTER + 3, SHUTTER + 12], [1, 0.985, 1], clamp);
  const recSecs = 2 + (frame - 30) / 30;

  // Transcript chip.
  const chipIn = interpolate(frame, [52, 64], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <AbsoluteFill style={{ opacity: fade }}>
        <FilmScene cam={filmCam(tAbs)} />

        {/* Darken the left of frame while the big wordmark is up. */}
        <AbsoluteFill
          style={{ background: "linear-gradient(90deg, rgba(7,8,10,0.82) 0%, rgba(7,8,10,0.45) 38%, rgba(7,8,10,0) 62%)", opacity: 1 - tuck * 0.85 }}
        />

        {/* Whole-frame shutter flash (subtle). */}
        <AbsoluteFill style={{ background: C.ink, opacity: flash * 0.12 }} />

        <Phone
          dx={s.dx}
          dy={s.dy + (1 - enterP) * 900}
          rotX={s.rotX + (1 - enterP) * 26}
          rotY={s.rotY + (1 - enterP) * -18}
          rotZ={s.rotZ + (1 - enterP) * 8}
          scale={bump}
          opacity={interpolate(enterP, [0, 0.15], [0, 1], clamp)}
          mask={enterP}
          flash={flash}
          rec={recSecs}
          focus={interpolate(frame, [SHUTTER - 3, SHUTTER + 30], [0, 1], clamp)}
        />

        {/* Transcript of what the seller says while filming. */}
        <div style={{ position: "absolute", inset: 0, perspective: 1400 }}>
          <div
            style={{
              position: "absolute",
              left: 1226,
              top: 300,
              opacity: chipIn,
              transform: `translate3d(${(1 - chipIn) * 60 + Math.sin(tAbs * 0.7) * 6}px, ${Math.cos(tAbs * 0.9) * 6}px, 0) rotateY(${-16 + Math.sin(tAbs * 0.5) * 2}deg)`,
              transformOrigin: "left center",
            }}
          >
            <TranscriptChip shown={Math.min(QUOTE.length, transcriptWords(frame))} t={tAbs} />
          </div>
        </div>

        {/* Brand lockup */}
        <div
          style={{
            position: "absolute",
            left: brandX,
            top: brandY,
            transform: `scale(${brandScale})`,
            transformOrigin: "left top",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
            <div style={{ transform: `scale(${markPop})`, display: "flex" }}>
              <AgentMark size={92} />
            </div>
            <div
              style={{
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 176,
                letterSpacing: "-0.045em",
                lineHeight: 1,
                color: C.ink,
                clipPath: `inset(-20% ${(1 - wordReveal) * 100}% -20% 0)`,
                transform: `translateX(${(1 - wordReveal) * -24}px)`,
                paddingBottom: 8,
              }}
            >
              Selger
            </div>
          </div>
          <div style={{ marginTop: 22, marginLeft: 128, opacity: subtitle }}>
            <Label size={28}>Your AI selling agent</Label>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
