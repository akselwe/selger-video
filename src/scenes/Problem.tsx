import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp } from "../ui/anim";
import { Label } from "../ui/kit";
import { FilmScene } from "./s1-3/FilmSet";

// The problem, before the hook video: an oak chair forgotten in the corner while buyer messages
// pile up and you type the same reply again and again. Then a hard cut to "Boring."
const CUT = Math.round(7.6 * 30); // 228: hard cut to black
const BORING = Math.round(7.65 * 30); // 230: "Boring." + sound

type Msg = { at: number; from: string; text: string; buzz?: boolean; scam?: boolean };
const MSGS: Msg[] = [
  { at: 0.45, from: "FINN", text: "Is it still available?" },
  { at: 1.55, from: "FINN", text: "Can you send more pictures?" },
  { at: 2.45, from: "Tise", text: "Would you take 300 kr?" },
  { at: 3.15, from: "FINN", text: "Lowest price?", buzz: true },
  { at: 3.75, from: "eBay", text: "Does it ship to Germany?" },
  { at: 4.3, from: "FINN", text: "Is it still available?" },
  { at: 4.75, from: "FINN", text: "Can you deliver to Bergen tomorrow?" },
  { at: 5.15, from: "FINN", text: "Hello??", buzz: true },
  { at: 5.5, from: "FINN", text: "On my way. 10 min." },
  { at: 5.85, from: "FINN", text: "Is it still available?" },
  { at: 6.15, from: "FINN", text: "Sorry, found another one." },
  { at: 6.45, from: "Unknown", text: "Pay here: finn-pay.link", scam: true, buzz: true },
  { at: 6.7, from: "FINN", text: "Is it still available?" },
  { at: 6.92, from: "Tise", text: "250 kr, final offer." },
  { at: 7.1, from: "FINN", text: "Still available?" },
  { at: 7.27, from: "FINN", text: "Is it still available?" },
  { at: 7.42, from: "eBay", text: "Is this still for sale?" },
];
const UNREAD = [3, 5, 8, 10, 13, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 47];

// Your replies, typed slowly (the last one never gets sent).
const REPLIES = [
  { start: 0.9, end: 2.0, text: "Yes, still available." },
  { start: 3.3, end: 4.1, text: "Yes, still available." },
  { start: 4.95, end: 5.6, text: "Yes, it’s still available." },
  { start: 6.75, end: 7.9, text: "Yes, it’s still available." },
];

const BANNER_H = 124;
const BANNER_GAP = 14;

const MsgIcon: React.FC = () => (
  <div
    style={{
      width: 58,
      height: 58,
      borderRadius: 15,
      background: C.line,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width={30} height={30} viewBox="0 0 24 24">
      <path
        d="M4 5.5 h16 a1.5 1.5 0 0 1 1.5 1.5 v9 a1.5 1.5 0 0 1 -1.5 1.5 h-9 l-4.5 3.5 v-3.5 h-2.5 a1.5 1.5 0 0 1 -1.5 -1.5 v-9 a1.5 1.5 0 0 1 1.5 -1.5 z"
        fill="none"
        stroke={C.ink}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const Banner: React.FC<{ readonly m: Msg }> = ({ m }) => (
  <div
    style={{
      width: 660,
      height: BANNER_H,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      gap: 20,
      padding: "0 26px 0 22px",
      borderRadius: 28,
      background: "rgba(26,28,31,0.94)",
      border: `1.5px solid ${C.line}`,
      boxShadow: "0 18px 50px rgba(0,0,0,0.5)",
      fontFamily: SANS,
    }}
  >
    <MsgIcon />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: m.scam ? C.danger : C.ink }}>{m.from}</span>
        <span style={{ fontSize: 26, color: C.ink2 }}>now</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 30, fontWeight: 500, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {m.text}
      </div>
    </div>
  </div>
);

const fmtTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / 30;

  if (frame >= CUT) {
    // ---- "Boring." ----
    const f = frame - BORING;
    const slam = interpolate(f, [0, 5], [1.22, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const vis = f >= 0 ? 1 : 0;
    const shake = f >= 0 ? Math.sin(f * 2.7) * 9 * Math.max(0, 1 - f / 8) : 0;
    const swipe = interpolate(f, [7, 19], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1) });
    const out = interpolate(frame, [durationInFrames - 4, durationInFrames], [1, 0], clamp);
    return (
      <AbsoluteFill style={{ backgroundColor: C.void, justifyContent: "center", alignItems: "center" }}>
        <Sequence from={BORING} layout="none">
          <Audio src={staticFile("audio/sfx/boring.mp3")} volume={0.85} />
        </Sequence>
        {/* The narrator says it as the word lands. */}
        <Sequence from={BORING + 2} layout="none">
          <Audio src={staticFile("audio/vo/b1-boring.mp3")} volume={1} />
        </Sequence>
        <div style={{ opacity: vis * out, transform: `translate(${shake}px, ${shake * 0.4}px) scale(${slam})`, position: "relative" }}>
          <svg
            viewBox="0 0 600 40"
            preserveAspectRatio="none"
            style={{ position: "absolute", left: -10, bottom: -26, width: "calc(100% + 20px)", height: 52, overflow: "visible" }}
          >
            <path
              d="M 8 24 C 90 16, 200 27, 320 19 S 520 18, 592 14"
              pathLength={1}
              fill="none"
              stroke={C.mark}
              strokeWidth={30}
              strokeLinecap="round"
              strokeDasharray="1 1"
              strokeDashoffset={1 - swipe}
              opacity={swipe > 0 ? 1 : 0}
            />
          </svg>
          <div
            style={{
              position: "relative",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 300,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: C.ink,
              paddingBottom: 30,
            }}
          >
            Boring.
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---- The boring corner ----
  const fadeIn = interpolate(frame, [0, 6], [0, 1], clamp);
  const shown = MSGS.map((m) => interpolate(t, [m.at, m.at + 0.22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const lastIdx = MSGS.reduce((acc, m, i) => (t >= m.at ? i : acc), -1);
  const unread = lastIdx >= 0 ? UNREAD[lastIdx] : 0;
  const badgePop = lastIdx >= 0 ? interpolate(t, [MSGS[lastIdx].at, MSGS[lastIdx].at + 0.12], [1.25, 1], clamp) : 1;
  const minutes = interpolate(t, [0, 7.6], [18 * 60 + 2, 23 * 60 + 47], { ...clamp, easing: Easing.in(Easing.quad) });

  // Current reply in the composer.
  const reply = REPLIES.find((r) => t >= r.start - 0.25 && t < r.end + 0.45);
  let typed = "";
  let sent = 0;
  if (reply) {
    const p = interpolate(t, [reply.start, reply.end], [0, 1], clamp);
    typed = reply.text.slice(0, Math.round(p * reply.text.length));
    sent = interpolate(t, [reply.end + 0.1, reply.end + 0.4], [0, 1], clamp);
  }
  const composerIn = interpolate(t, [0.6, 0.85], [0, 1], clamp);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      {/* Sound: a clock ticking, a ping for every message, a few buzzes. All of it stops at the cut. */}
      <Sequence durationInFrames={CUT} layout="none">
        <Audio src={staticFile("audio/sfx/tick.mp3")} volume={0.28} />
      </Sequence>
      {MSGS.map((m, i) => {
        const from = Math.round(m.at * 30);
        return (
          <React.Fragment key={i}>
            <Sequence from={from} durationInFrames={Math.min(15, CUT - from)} layout="none">
              <Audio src={staticFile("audio/sfx/ping.mp3")} volume={0.35 + ((i * 7) % 6) * 0.05} />
            </Sequence>
            {m.buzz ? (
              <Sequence from={from} durationInFrames={Math.min(21, CUT - from)} layout="none">
                <Audio src={staticFile("audio/sfx/buzz.mp3")} volume={0.5} />
              </Sequence>
            ) : null}
          </React.Fragment>
        );
      })}

      <AbsoluteFill style={{ opacity: fadeIn }}>
        {/* Locked-off, flat, slightly desaturated: a dull photo of a chair nobody uses. */}
        <AbsoluteFill style={{ filter: "saturate(0.55) brightness(0.9)" }}>
          <FilmScene
            cam={{ angle: 0, dist: 1, height: 1, from: [0.6, 2.7, 6.2], at: [-3.6, 1.45, -1.6], shake: 0 }}
            roomBlur={0}
            chairPos={[-5.3, -1.15]}
            chairYaw={0.55}
          />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(7,8,10,0) 50%, rgba(7,8,10,0.55) 100%)" }} />

        {/* Clock: the evening slipping away */}
        <div style={{ position: "absolute", left: 96, top: 100 }}>
          <Label size={26}>Tuesday</Label>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 76, color: C.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {fmtTime(minutes).split(":")[0]}
            <span style={{ margin: "0 -0.04em", position: "relative", top: "-0.06em" }}>:</span>
            {fmtTime(minutes).split(":")[1]}
          </div>
        </div>

        {/* Notification stack, top-right */}
        {lastIdx >= 0 ? (
          <div style={{ position: "absolute", right: 84, top: 100, display: "flex", alignItems: "center", gap: 14, fontFamily: SANS, fontSize: 28, fontWeight: 600, color: C.ink }}>
            Messages
            <span
              style={{
                minWidth: 52,
                padding: "2px 14px",
                borderRadius: 22,
                background: C.mark,
                color: C.onMark,
                fontFamily: MONO,
                fontSize: 28,
                textAlign: "center",
                transform: `scale(${badgePop})`,
                display: "inline-block",
              }}
            >
              {unread}
            </span>
          </div>
        ) : null}
        {MSGS.map((m, i) => {
          if (shown[i] <= 0) return null;
          // Slot = how many newer banners have arrived (fractional while they slide in).
          const slot = shown.slice(i + 1).reduce((a, b) => a + b, 0);
          const y = 168 + slot * (BANNER_H + BANNER_GAP) - (1 - shown[i]) * 50;
          const op = shown[i] * interpolate(slot, [4.2, 5.2], [1, 0], clamp) * (1 - Math.min(slot, 4) * 0.06);
          if (op <= 0.001) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                right: 84,
                top: y,
                opacity: op,
                transform: `scale(${(0.96 + 0.04 * shown[i]) * (1 - Math.min(slot, 5) * 0.012)})`,
                transformOrigin: "right top",
              }}
            >
              <Banner m={m} />
            </div>
          );
        })}

        {/* Your reply, typed (again) */}
        <div style={{ position: "absolute", left: 96, bottom: 96, width: 720, opacity: composerIn }}>
          <Label size={24}>Reply to buyer</Label>
          <div
            style={{
              marginTop: 12,
              height: 84,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 18px 0 28px",
              borderRadius: 42,
              background: C.surface,
              border: `1.5px solid ${C.lineStrong}`,
              fontFamily: SANS,
              fontSize: 34,
              color: C.ink,
            }}
          >
            <span style={{ opacity: 1 - sent, transform: `translateY(${-sent * 24}px)`, display: "inline-block", whiteSpace: "nowrap" }}>
              {typed}
              <span style={{ display: "inline-block", width: 3, height: 38, marginLeft: 3, verticalAlign: "-6px", background: C.ink, opacity: cursorOn && sent === 0 ? 1 : 0 }} />
            </span>
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                background: typed.length > 0 ? C.ink : C.line,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width={26} height={26} viewBox="0 0 24 24">
                <path d="M12 19 V6 M6 11.5 L12 5.5 L18 11.5" fill="none" stroke={C.void} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
