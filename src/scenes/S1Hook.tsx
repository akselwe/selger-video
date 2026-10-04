import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SANS } from "../theme";
import { clamp } from "../ui/anim";
import { edgeFade, wordFrame } from "./s1-3/util";

// Scene 1: "Selling your old stuff is a second job."
// The line lights up word by word over a slow drift of selling chores coming out of the dark.

const CHORES: { text: string; badge?: string }[] = [
  { text: "Take photos" },
  { text: "Write the ad" },
  { text: "“Is it still available?”", badge: "12" },
  { text: "Haggle" },
  { text: "No-shows" },
  { text: "Scam messages", badge: "3" },
  { text: "Shipping" },
];

// 28 chips: every chore four times, scattered through depth.
const CHIPS = Array.from({ length: 28 }, (_, i) => {
  const r = (k: string) => random(`s1-${k}-${i}`);
  const side = i % 2 === 0 ? -1 : 1;
  return {
    chore: CHORES[i % CHORES.length],
    x: side * (180 + r("x") * 900),
    y: (r("y") - 0.5) * 1150,
    z: -3600 + (i / 28) * 3500 + r("z") * 300,
    rotY: (r("ry") - 0.5) * 40 - side * 12,
    rotX: (r("rx") - 0.5) * 16,
    rotZ: (r("rz") - 0.5) * 8,
    speed: 330 + r("s") * 160, // px per second toward the camera
    bob: r("b") * Math.PI * 2,
  };
});

const Chip: React.FC<{ readonly text: string; readonly badge?: string }> = ({ text, badge }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "18px 28px 18px 22px",
      background: C.surface,
      border: `2px solid ${C.line}`,
      borderRadius: 16,
      fontFamily: SANS,
      fontWeight: 500,
      fontSize: 38,
      color: C.ink2,
      whiteSpace: "nowrap",
      boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
    }}
  >
    <span style={{ width: 26, height: 26, borderRadius: 6, border: `2.5px solid ${C.lineStrong}`, flexShrink: 0 }} />
    {text}
    {badge ? (
      <span
        style={{
          minWidth: 40,
          height: 40,
          borderRadius: 20,
          background: C.line,
          color: C.ink,
          fontSize: 24,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 10px",
        }}
      >
        {badge}
      </span>
    ) : null}
  </div>
);

const LINES = [
  ["Selling", "your", "old", "stuff"],
  ["is", "a", "second", "job."],
];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / 30;
  const fade = edgeFade(frame, durationInFrames, 6, 7);

  // Camera drift for the chip field.
  const camRotY = interpolate(frame, [0, durationInFrames], [-7, 5]);
  const camRotX = interpolate(frame, [0, durationInFrames], [4, -2]);
  const push = interpolate(frame, [0, durationInFrames], [0, 260], { easing: Easing.in(Easing.quad) });

  // Headline: a slow push-in.
  const textScale = interpolate(frame, [0, durationInFrames], [0.985, 1.03]);
  const ghost = interpolate(frame, [2, 10], [0, 0.07], clamp);

  // Highlighter stroke: starts on the marker sound (0.35 s), lands as "job." is spoken.
  const jobFrame = wordFrame("s1-hook", 7, 0);
  const stroke = interpolate(frame, [10.5, jobFrame + 4], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.5, 0, 0.25, 1),
  });

  let wi = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.void, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: fade }}>
        {/* Deep chip field */}
        <AbsoluteFill style={{ perspective: 1100, perspectiveOrigin: "50% 48%" }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transformStyle: "preserve-3d",
              transform: `translateZ(${push}px) rotateX(${camRotX}deg) rotateY(${camRotY}deg)`,
            }}
          >
            {CHIPS.map((c, i) => {
              const z = c.z + c.speed * t;
              // Fade in from the far dark, fade out before passing the lens.
              const op =
                interpolate(z, [-3400, -2200], [0, 1], clamp) * interpolate(z, [-200, 350], [1, 0], clamp);
              // Out of focus everywhere except a thin band, deeper = softer.
              const blur = interpolate(Math.abs(z + 1100), [0, 1800], [1.6, 9], clamp);
              const bob = Math.sin(t * 1.3 + c.bob) * 10;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: `translate(-50%, -50%) translate3d(${c.x}px, ${c.y + bob}px, ${z}px) rotateY(${c.rotY}deg) rotateX(${c.rotX}deg) rotateZ(${c.rotZ + Math.sin(t * 0.8 + c.bob) * 1.5}deg)`,
                    opacity: op * 0.62,
                    filter: `blur(${blur}px)`,
                  }}
                >
                  <Chip text={c.chore.text} badge={c.chore.badge} />
                </div>
              );
            })}
          </div>
        </AbsoluteFill>

        {/* Dark pool behind the headline so it always reads. */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 40% 26% at 50% 50%, ${C.void}f0 0%, ${C.void}b0 50%, rgba(7,8,10,0) 100%)`,
          }}
        />

        {/* Headline */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              transform: `scale(${textScale})`,
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 100,
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              color: C.ink,
              textAlign: "center",
            }}
          >
            {LINES.map((line, li) => (
              <div key={li} style={{ display: "flex", justifyContent: "center", gap: "0.26em" }}>
                {li === 1 ? (
                  <>
                    <Word text={line[0]} start={wordFrame("s1-hook", wi++, 0)} frame={frame} ghost={ghost} />
                    <span style={{ position: "relative", display: "inline-flex", gap: "0.26em" }}>
                      {/* Marker stroke under "a second job." */}
                      <svg
                        viewBox="0 0 600 40"
                        preserveAspectRatio="none"
                        style={{ position: "absolute", left: -14, bottom: -22, width: "calc(100% + 32px)", height: 40, overflow: "visible" }}
                      >
                        <path
                          d="M 8 24 C 90 16, 200 27, 320 19 S 520 18, 592 14"
                          pathLength={1}
                          fill="none"
                          stroke={C.mark}
                          strokeWidth={24}
                          strokeLinecap="round"
                          strokeDasharray="1 1"
                          strokeDashoffset={1 - stroke}
                          opacity={stroke > 0 ? 0.96 : 0}
                        />
                      </svg>
                      {line.slice(1).map((w) => (
                        <Word key={w} text={w} start={wordFrame("s1-hook", wi++, 0)} frame={frame} ghost={ghost} />
                      ))}
                    </span>
                  </>
                ) : (
                  line.map((w) => <Word key={w} text={w} start={wordFrame("s1-hook", wi++, 0)} frame={frame} ghost={ghost} />)
                )}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Word: React.FC<{ readonly text: string; readonly start: number; readonly frame: number; readonly ghost: number }> = ({
  text,
  start,
  frame,
  ghost,
}) => {
  const p = interpolate(frame, [start - 2, start + 5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        opacity: ghost + (1 - ghost) * p,
        transform: `translateY(${(1 - p) * 16}px)`,
        filter: p > 0 && p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
      }}
    >
      {text}
    </span>
  );
};
