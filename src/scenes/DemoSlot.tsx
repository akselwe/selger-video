import { Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp } from "../ui/anim";
import { Grade } from "../ui/Grade";
import { Label } from "../ui/kit";
import { prog } from "./s7-9/common";

export type DemoSlotProps = {
  // Screen recording of Kris's live demo. A file in public/ ("demo.mp4") or a full URL.
  readonly src?: string;
};

const SCREEN_W = 1280;
const SCREEN_H = 720; // 16:9
const BAR = 40;

// Placeholder for the live demo screen recording. Pass `src` to play the recording in the frame.
export const DemoSlot: React.FC<DemoSlotProps> = ({ src }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = Math.min(interpolate(frame, [0, 10], [0, 1], clamp), interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp));
  const head = prog(frame, 4, 18);
  const win = prog(frame, 10, 24);
  const blink = 0.55 + 0.45 * Math.sin(frame * 0.2);
  const float = Math.sin(frame / 60) * 3;
  const sweep = ((frame * 0.35) % 160) - 30;
  const glowX = 50 + Math.sin(frame / 90) * 8;
  const resolved = src ? (/^(https?:)?\/\//.test(src) || src.startsWith("/") ? src : staticFile(src)) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: C.void, opacity: fade }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${glowX}% 62%, rgba(45,73,201,0.28) 0%, rgba(7,8,10,0) 60%)`,
        }}
      />
      {/* header */}
      <div style={{ position: "absolute", left: 320, top: 96, opacity: head, transform: `translateY(${(1 - head) * 14}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: C.agent, opacity: blink, boxShadow: `0 0 12px ${C.agent}` }} />
          <Label size={24} color={C.agent}>
            Live demo
          </Label>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 84, lineHeight: 1.05, letterSpacing: "-0.03em", color: C.ink, marginTop: 8 }}>
          Kris shows Selger, live
        </div>
      </div>
      {/* the screen */}
      <div
        style={{
          position: "absolute",
          left: (1920 - SCREEN_W) / 2,
          top: 262,
          width: SCREEN_W,
          height: SCREEN_H + BAR,
          borderRadius: 18,
          overflow: "hidden",
          background: C.surface,
          border: `1.5px solid ${C.lineStrong}`,
          boxShadow: "0 40px 120px rgba(0,0,0,0.65), 0 0 120px rgba(45,73,201,0.18)",
          opacity: win,
          transform: `translateY(${(1 - win) * 30 + float}px) scale(${0.96 + win * 0.04})`,
        }}
      >
        <div style={{ height: BAR, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: `1.5px solid ${C.line}` }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: C.line }} />
          ))}
        </div>
        <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, background: C.sunken }}>
          {resolved ? (
            <Video src={resolved} objectFit="contain" style={{ width: "100%", height: "100%" }} />
          ) : (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(110deg, rgba(139,170,255,0) ${sweep}%, rgba(139,170,255,0.06) ${sweep + 10}%, rgba(139,170,255,0) ${sweep + 20}%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                }}
              >
                <div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 500, color: C.ink2 }}>Screen recording goes here</div>
                <div style={{ fontFamily: MONO, fontSize: 24, color: C.lineStrong, letterSpacing: "0.04em" }}>16:9 · 1920 × 1080</div>
              </div>
            </>
          )}
        </div>
      </div>
      <Grade />
    </AbsoluteFill>
  );
};
