import { Audio, Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp } from "../ui/anim";
import { Grade } from "../ui/Grade";
import { Label } from "../ui/kit";
import { prog } from "./s7-9/common";
import { UnderTheHood } from "./UnderTheHood";

export type DemoSlotProps = {
  // Screen recording of Kris's live demo. A file in public/ ("demo.mp4") or a full URL.
  readonly src?: string;
};

const SCREEN_W = 1280;
const SCREEN_H = 720; // 16:9
const BAR = 40;

// Part 1 of Kris's demo: real footage of Kris picking up Teo's call. Plays full screen first.
const PART1 = "demo/kris-part1.mp4";
const PART1_SECONDS = 10.5;
const APP = "demo/app-walkthrough.mp4";
const APP_SECONDS = 18.5;
export const SPONSORS_SECONDS = 8;
const APP_FULL = "demo/app-full-fast.mp4";
const APP_FULL_SECONDS = 42;

const Part1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = Math.round(PART1_SECONDS * fps);
  const fade = Math.min(interpolate(frame, [0, 6], [0, 1], clamp), interpolate(frame, [end - 8, end], [1, 0], clamp));
  const tag = interpolate(frame, [10, 22, end - 40, end - 28], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.void, opacity: fade }}>
      <Video src={staticFile(PART1)} objectFit="cover" style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", left: 80, bottom: 90, opacity: tag, transform: `translateY(${(1 - tag) * 12}px)`, display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderRadius: 14, background: "rgba(12,13,16,0.78)", border: `1.5px solid ${C.line}` }}>
        <span style={{ width: 12, height: 12, borderRadius: 6, background: C.danger, boxShadow: `0 0 12px ${C.danger}` }} />
        <Label size={22} color={C.ink}>
          Live demo · Kris
        </Label>
      </div>
    </AbsoluteFill>
  );
};

// Part 2: Kris goes through the Selger app (phone screen recording, portrait).
const AppWalkthrough: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = Math.round(APP_SECONDS * fps);
  const fade = Math.min(interpolate(frame, [0, 8], [0, 1], clamp), interpolate(frame, [end - 8, end], [1, 0], clamp));
  return (
    <AbsoluteFill style={{ backgroundColor: C.void, opacity: fade }}>
      <AbsoluteFill style={{ filter: "blur(60px) brightness(0.35)", transform: "scale(1.2)" }}>
        <Video src={staticFile(APP)} objectFit="cover" muted style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 380, width: 640 }}>
        <Label size={24} color={C.agent}>
          Live demo · the Selger app
        </Label>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 76, lineHeight: 1.05, letterSpacing: "-0.03em", color: C.ink, marginTop: 12 }}>
          One place for everything you sell
        </div>
      </div>
      <div style={{ position: "absolute", left: 1060, top: 40, width: 460, height: 1000, borderRadius: 56, overflow: "hidden", border: `10px solid #1c1e22`, boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 120px rgba(45,73,201,0.25)" }}>
        <Video src={staticFile(APP)} objectFit="cover" style={{ width: "100%", height: "100%" }} />
      </div>
    </AbsoluteFill>
  );
};

// Part 3: the whole sale in the app, sped up about 4.8×, with a music bed.
const AppFullFast: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = Math.round(APP_FULL_SECONDS * fps);
  const fade = Math.min(interpolate(frame, [0, 8], [0, 1], clamp), interpolate(frame, [end - 8, end], [1, 0], clamp));
  const music = Math.min(interpolate(frame, [0, 20], [0, 0.32], clamp), interpolate(frame, [end - 30, end], [0.32, 0], clamp));
  const steps = ["Film the item", "Selger identifies and prices it", "Listings go out everywhere", "Buyers handled, deal closed"];
  const step = Math.min(steps.length - 1, Math.floor((frame / end) * steps.length));
  return (
    <AbsoluteFill style={{ backgroundColor: C.void, opacity: fade }}>
      <Audio src={staticFile("audio/music/bed-fast.mp3")} trimBefore={Math.round(9 * fps)} volume={music} />
      <AbsoluteFill style={{ filter: "blur(60px) brightness(0.32)", transform: "scale(1.2)" }}>
        <Video src={staticFile(APP_FULL)} objectFit="cover" muted style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 330, width: 760 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Label size={24} color={C.agent}>
            Live demo · the whole sale
          </Label>
          <span style={{ fontFamily: MONO, fontSize: 20, color: C.onMark, background: C.mark, padding: "3px 10px", borderRadius: 6 }}>4.8× speed</span>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 76, lineHeight: 1.05, letterSpacing: "-0.03em", color: C.ink, marginTop: 14 }}>
          From video to sold, in one app
        </div>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((t, i) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: SANS, fontSize: 32, color: i === step ? C.ink : i < step ? C.ink2 : C.line, transition: "none" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: i <= step ? C.agent : C.line, boxShadow: i === step ? `0 0 14px ${C.agent}` : undefined }} />
              {t}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: 1060, top: 40, width: 460, height: 1000, borderRadius: 56, overflow: "hidden", border: "10px solid #1c1e22", boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 120px rgba(45,73,201,0.25)" }}>
        <Video src={staticFile(APP_FULL)} objectFit="cover" muted style={{ width: "100%", height: "100%" }} />
      </div>
    </AbsoluteFill>
  );
};

// (old static list, replaced by the animated UnderTheHood scene)
const SPONSORS: [string, string][] = [
  ["ElevenLabs", "Teo's voice, phone calls and transcripts"],
  ["Mastra", "The agent brain and workflows"],
  ["Exa", "Market research and price comparables"],
  ["Kernel", "Cloud browser that lists on FINN"],
  ["Neon", "Database for items, offers and buyers"],
  ["AgentMail", "The agent's own inbox for buyers"],
  ["Fly.io Sprites", "Sandboxes for video processing"],
  ["Executor", "Tool gateway for every integration"],
  ["assistant-ui", "The chat app you sell from"],
  ["CodeRabbit", "Reviews every line we ship"],
];
export const UnderTheHoodOld: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = Math.round(SPONSORS_SECONDS * fps);
  const fade = Math.min(interpolate(frame, [0, 8], [0, 1], clamp), interpolate(frame, [end - 8, end], [1, 0], clamp));
  return (
    <AbsoluteFill style={{ backgroundColor: C.void, opacity: fade, padding: "110px 140px" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(45,73,201,0.25) 0%, rgba(7,8,10,0) 60%)" }} />
      <Label size={24} color={C.agent}>
        Under the hood
      </Label>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 72, letterSpacing: "-0.03em", color: C.ink, marginTop: 10 }}>
        Ten tools, one agent
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 60px", marginTop: 46 }}>
        {SPONSORS.map(([name, what], i) => {
          const a = interpolate(frame, [8 + i * 4, 18 + i * 4], [0, 1], clamp);
          return (
            <div key={name} style={{ opacity: a, transform: `translateY(${(1 - a) * 14}px)`, display: "flex", alignItems: "baseline", gap: 18, borderBottom: `1.5px solid ${C.line}`, paddingBottom: 14 }}>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, color: C.ink, minWidth: 250 }}>{name}</span>
              <span style={{ fontFamily: SANS, fontSize: 28, color: C.ink2 }}>{what}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const DemoSlot: React.FC<DemoSlotProps> = () => {
  const { fps } = useVideoConfig();
  const p1 = Math.round(PART1_SECONDS * fps);
  const p2 = Math.round(APP_SECONDS * fps);
  const p3 = Math.round(SPONSORS_SECONDS * fps);
  const p4 = Math.round(APP_FULL_SECONDS * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <Sequence durationInFrames={p1} name="Kris demo, part 1">
        <Part1 />
      </Sequence>
      <Sequence from={p1} durationInFrames={p2} name="App walkthrough">
        <AppWalkthrough />
      </Sequence>
      <Sequence from={p1 + p2} durationInFrames={p4} name="Whole sale, sped up">
        <AppFullFast />
      </Sequence>
      <Sequence from={p1 + p2 + p4} durationInFrames={p3} name="Under the hood">
        <UnderTheHood />
      </Sequence>
    </AbsoluteFill>
  );
};

// Placeholder for a future demo segment (unused now). Pass `src` to play a recording in the frame.
export const DemoPlaceholder: React.FC<DemoSlotProps> = ({ src }) => {
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
