// Scene 7: the phone that rings. A CSS phone with real depth (frame, glass, sheen), driven by `frame`.
import React from "react";
import { Easing, interpolate } from "remotion";
import { C, MONO, SANS } from "../../theme";
import { clamp } from "../../ui/anim";
import { AgentMark } from "../../ui/kit";
import { Handset, lerp, prog } from "./common";

export const PHONE_W = 420;
export const PHONE_H = 860;

type Props = {
  readonly frame: number;
  readonly answerAt: number; // frame the call is picked up
  readonly endAt: number; // frame the call ends
  readonly bars: number[]; // 0..1 per bar
  readonly speaker: "agent" | "you" | null;
  readonly level: number; // 0..1 current voice level
  readonly name?: string; // caller name, e.g. "Teo"
  readonly subtitle?: string; // e.g. "Selger agent"
  readonly context?: string; // small line while ringing
  readonly agentLabel?: string; // e.g. "Teo is speaking"
};

const Avatar: React.FC<{ frame: number; size: number; ringing: number; level: number }> = ({ frame, size, ringing, level }) => {
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.22);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* ripples while ringing */}
      {[0, 1, 2].map((k) => {
        const p = (((frame + k * 12) % 36) / 36) * ringing;
        if (ringing <= 0.01) return null;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px solid ${C.agent}`,
              transform: `scale(${1 + p * 0.9})`,
              opacity: (1 - p) * 0.55 * ringing,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 40%, #2a3a6b 0%, ${C.agentSoft} 55%, #121a33 100%)`,
          border: `1.5px solid #2b3a66`,
          boxShadow: `0 0 ${30 + level * 60}px rgba(139,170,255,${0.18 + level * 0.35}), inset 0 2px 0 rgba(255,255,255,0.06)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ transform: `scale(${1 + pulse * 0.06 * ringing + level * 0.14})` }}>
          <AgentMark size={size * 0.3} />
        </div>
      </div>
    </div>
  );
};

const RoundButton: React.FC<{ bg: string; size?: number; children: React.ReactNode; label?: string; scale?: number; glow?: string }> = ({
  bg,
  size = 104,
  children,
  label,
  scale = 1,
  glow,
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        boxShadow: glow ? `0 0 40px ${glow}` : "0 10px 30px rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </div>
    {label ? <div style={{ fontFamily: SANS, fontSize: 24, color: C.ink2 }}>{label}</div> : null}
  </div>
);

export const Phone: React.FC<Props> = ({
  frame,
  answerAt,
  endAt,
  bars,
  speaker,
  level,
  name = "Teo",
  subtitle = "Selger agent",
  context = "Calling about your chair",
  agentLabel = "Teo is speaking",
}) => {
  const onCall = prog(frame, answerAt, 14);
  const ringing = 1 - prog(frame, answerAt - 4, 8);
  const ended = prog(frame, endAt + 3, 10);
  // Accept button press just before the call is answered.
  const press = interpolate(frame, [answerAt - 8, answerAt - 4, answerAt], [1, 0.88, 1], clamp);
  const secs = Math.max(0, Math.floor((frame - answerAt) / 30));
  const timer = `0:${String(secs).padStart(2, "0")}`;
  const sheen = interpolate(frame, [0, 340], [-60, 140]);
  const avatarSize = lerp(170, 120, onCall);
  const avatarTop = lerp(186, 150, onCall);
  const nameTop = avatarTop + avatarSize + 34;
  const waveColor = speaker === "you" ? C.ink : C.agent;

  return (
    <div
      style={{
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 72,
        padding: 13,
        background: "linear-gradient(150deg, #3a3e45 0%, #1a1c20 18%, #0d0e11 55%, #23262b 100%)",
        boxShadow:
          "0 60px 120px rgba(0,0,0,0.7), 0 0 0 1.5px #4a4e56, inset 0 0 0 1.5px rgba(255,255,255,0.08), 0 0 140px rgba(45,73,201,0.25)",
        position: "relative",
      }}
    >
      {/* side buttons */}
      <div style={{ position: "absolute", left: -4, top: 190, width: 4, height: 70, borderRadius: 2, background: "#2c2f35" }} />
      <div style={{ position: "absolute", left: -4, top: 280, width: 4, height: 70, borderRadius: 2, background: "#2c2f35" }} />
      <div style={{ position: "absolute", right: -4, top: 230, width: 4, height: 110, borderRadius: 2, background: "#2c2f35" }} />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 60,
          overflow: "hidden",
          background: `radial-gradient(ellipse at 50% 18%, rgba(45,73,201,${0.32 + level * 0.25}) 0%, rgba(12,13,16,0) 60%), linear-gradient(180deg, #0f1218 0%, ${C.sunken} 100%)`,
          color: C.ink,
          fontFamily: SANS,
        }}
      >
        {/* dynamic island */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: 126,
            height: 36,
            borderRadius: 18,
            background: "#000",
          }}
        />
        {/* avatar */}
        <div style={{ position: "absolute", top: avatarTop, left: "50%", transform: "translateX(-50%)" }}>
          <Avatar frame={frame} size={avatarSize} ringing={ringing} level={level} />
        </div>
        {/* name + state */}
        <div style={{ position: "absolute", top: nameTop, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: "-0.02em" }}>{name}</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 600, color: C.agent, marginTop: 2 }}>
            {subtitle}
          </div>
          <div style={{ position: "relative", height: 36, marginTop: 6 }}>
            <div style={{ position: "absolute", width: "100%", fontSize: 26, color: C.ink2, opacity: 1 - onCall }}>
              Incoming call
            </div>
            <div
              style={{
                position: "absolute",
                width: "100%",
                fontFamily: MONO,
                fontSize: 26,
                color: C.ink2,
                opacity: onCall * (1 - prog(frame, endAt, 4)),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {timer}
            </div>
            <div style={{ position: "absolute", width: "100%", fontSize: 26, color: C.ink2, opacity: ended }}>
              Call ended · {timer}
            </div>
          </div>
        </div>
        {/* ringing: context line */}
        <div
          style={{
            position: "absolute",
            top: 556,
            width: "100%",
            textAlign: "center",
            fontSize: 24,
            color: C.ink2,
            opacity: 1 - onCall,
          }}
        >
          {context}
        </div>
        {/* on call: live waveform */}
        <div
          style={{
            position: "absolute",
            top: 440,
            left: 0,
            width: "100%",
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: onCall * (1 - ended),
          }}
        >
          {bars.map((b, i) => {
            const h = 8 + b * 160;
            return (
              <div
                key={i}
                style={{
                  width: 6,
                  height: h,
                  borderRadius: 3,
                  background: waveColor,
                  opacity: 0.45 + b * 0.55,
                  boxShadow: speaker === "agent" && b > 0.3 ? `0 0 12px rgba(139,170,255,0.6)` : "none",
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            top: 642,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            fontSize: 24,
            color: speaker === "you" ? C.ink : C.agent,
            opacity: onCall * (speaker ? 1 : 0.0) * (1 - ended),
          }}
        >
          {speaker === "agent" ? <AgentMark size={12} /> : null}
          {speaker === "you" ? "You" : agentLabel}
        </div>
        {/* buttons */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            width: "100%",
            display: "flex",
            justifyContent: "space-around",
            padding: "0 40px",
            opacity: 1 - onCall,
          }}
        >
          <RoundButton bg={C.danger} label="Decline">
            <Handset size={42} color={C.ink} rotate={135} />
          </RoundButton>
          <RoundButton bg={C.ink} label="Accept" scale={press}>
            <Handset size={42} color={C.surface} />
          </RoundButton>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 56,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            opacity: onCall * (1 - ended),
          }}
        >
          <RoundButton bg={C.danger} size={92}>
            <Handset size={38} color={C.ink} rotate={135} />
          </RoundButton>
        </div>
        {/* glass sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(115deg, rgba(255,255,255,0) ${sheen}%, rgba(255,255,255,0.05) ${sheen + 12}%, rgba(255,255,255,0) ${sheen + 26}%)`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

// Map spectrum bins to a symmetric bar shape (loudest in the middle).
export const shapeBars = (bins: number[], n: number, frame: number, idle: number) => {
  const half = Math.ceil(n / 2);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const d = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2); // 0 centre .. 1 edge
    const bi = Math.min(bins.length - 1, Math.floor(d * Math.min(bins.length - 1, half)));
    const v = bins.length ? bins[bi] : 0;
    const envelope = Easing.out(Easing.quad)(1 - d * 0.75);
    const breathe = (0.06 + 0.04 * Math.sin(frame * 0.18 + i * 0.7)) * idle;
    out.push(Math.min(1, Math.max(breathe, v * envelope)));
  }
  return out;
};
