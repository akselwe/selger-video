import React from "react";
import { C, MONO, SANS } from "../../theme";
import { AgentMark, Label } from "../../ui/kit";

// Phone geometry on the 1920×1080 frame (centred, clear of the caption band).
export const PHONE = { w: 400, h: 812, cx: 960, top: 64, bezel: 13, radius: 58 };

type PhoneProps = {
  readonly dx?: number;
  readonly dy?: number;
  readonly rotX?: number;
  readonly rotY?: number;
  readonly rotZ?: number;
  readonly scale?: number;
  readonly opacity?: number;
  readonly mask?: number; // 0..1 how much the world outside the screen is dimmed
  readonly flash?: number; // 0..1 shutter flash on the screen
  readonly rec?: number; // seconds shown on the REC timer
  readonly uiOpacity?: number;
  readonly focus?: number; // 0..1: focus square snapping onto the subject
  readonly children?: React.ReactNode;
};

// A phone in front of the 3D set: thin bezel, transparent screen (the 3D chair shows through)
// and a camera viewfinder UI on top.
export const Phone: React.FC<PhoneProps> = ({
  dx = 0,
  dy = 0,
  rotX = 0,
  rotY = 0,
  rotZ = 0,
  scale = 1,
  opacity = 1,
  mask = 0,
  flash = 0,
  rec = 0,
  uiOpacity = 1,
  focus = 0,
  children,
}) => {
  const { w, h, cx, top, bezel, radius } = PHONE;
  const sr = radius - bezel;
  const secs = Math.max(0, Math.floor(rec));
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1600, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top,
          width: w,
          height: h,
          opacity,
          transform: `translate(${dx}px, ${dy}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Screen: transparent window, the world outside it is dimmed. */}
        <div
          style={{
            position: "absolute",
            left: bezel,
            top: bezel,
            right: bezel,
            bottom: bezel,
            borderRadius: sr,
            boxShadow: `0 0 0 3000px rgba(7,8,10,${0.62 * mask})`,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(235,237,239,0.09) 0%, rgba(235,237,239,0.02) 38%, rgba(235,237,239,0) 39%)" }} />
          <div style={{ position: "absolute", inset: 0, background: C.ink, opacity: flash }} />
          <div style={{ position: "absolute", inset: 0, opacity: uiOpacity }}>
            {/* Top bar: REC + timer */}
            <div style={{ position: "absolute", top: 34, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 14px",
                  borderRadius: 10,
                  background: "rgba(7,8,10,0.55)",
                  fontFamily: MONO,
                  fontSize: 24,
                  color: C.ink,
                  letterSpacing: "0.04em",
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: 7, background: C.danger, opacity: secs % 2 === 0 || rec % 1 < 0.6 ? 1 : 0.35 }} />
                REC 0:0{secs}
              </div>
            </div>
            {/* Lens vignette */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 75% 60% at 50% 48%, rgba(7,8,10,0) 55%, rgba(7,8,10,0.42) 100%)" }} />
            {/* Bottom controls band */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260, background: "linear-gradient(rgba(7,8,10,0), rgba(7,8,10,0.6) 45%)" }} />
            {/* Focus square snapping onto the chair, with the exposure sun */}
            {focus > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "45%",
                  width: 150,
                  height: 150,
                  marginLeft: -75,
                  marginTop: -75,
                  border: `2px solid ${C.mark}`,
                  opacity: Math.min(1, focus * 3) * (0.55 + 0.45 * Math.max(0, 1 - (focus - 0.4) * 2)),
                  transform: `scale(${1 + Math.max(0, 1 - focus * 3) * 0.6})`,
                }}
              >
                <svg width={34} height={150} style={{ position: "absolute", right: -46, top: 0 }}>
                  <line x1={17} y1={0} x2={17} y2={52} stroke={C.mark} strokeWidth={1.5} />
                  <line x1={17} y1={98} x2={17} y2={150} stroke={C.mark} strokeWidth={1.5} />
                  <circle cx={17} cy={75} r={7} fill="none" stroke={C.mark} strokeWidth={2} />
                  {Array.from({ length: 8 }, (_, i) => {
                    const a = (i / 8) * Math.PI * 2;
                    return (
                      <line
                        key={i}
                        x1={17 + Math.cos(a) * 11}
                        y1={75 + Math.sin(a) * 11}
                        x2={17 + Math.cos(a) * 15}
                        y2={75 + Math.sin(a) * 15}
                        stroke={C.mark}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
              </div>
            ) : null}
            {/* Camera modes */}
            <div style={{ position: "absolute", bottom: 148, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 30, fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
              <span style={{ color: C.ink2 }}>SLO-MO</span>
              <span style={{ color: C.mark }}>VIDEO</span>
              <span style={{ color: C.ink2 }}>PHOTO</span>
            </div>
            {/* Record button */}
            <div
              style={{
                position: "absolute",
                bottom: 44,
                left: "50%",
                marginLeft: -40,
                width: 80,
                height: 80,
                borderRadius: 40,
                border: `5px solid ${C.ink}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 7, background: C.danger }} />
            </div>
            {children}
          </div>
        </div>
        {/* Bezel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            border: `${bezel}px solid ${C.sunken}`,
            boxShadow: `inset 0 0 0 1.5px ${C.lineStrong}, 0 0 0 1.5px ${C.line}, 0 40px 90px rgba(0,0,0,0.6)`,
          }}
        />
        {/* Dynamic island */}
        <div style={{ position: "absolute", top: bezel + 12, left: "50%", marginLeft: -52, width: 104, height: 30, borderRadius: 15, background: "#050608" }} />
        {/* Side button glint */}
        <div style={{ position: "absolute", right: -4, top: 190, width: 4, height: 96, borderRadius: 2, background: C.line }} />
      </div>
    </div>
  );
};

// The seller's own words, transcribed live while filming.
export const QUOTE = ["“Bought", "it", "in", "2022.", "Small", "scratch", "on", "the", "leg.”"];

export const TranscriptChip: React.FC<{
  readonly shown: number; // words visible (fractional = fading in)
  readonly t: number; // seconds, drives the waveform
  readonly style?: React.CSSProperties;
}> = ({ shown, t, style }) => (
  <div
    style={{
      width: 600,
      background: C.surface,
      border: `1.5px solid ${C.lineStrong}`,
      borderRadius: 18,
      padding: "24px 28px 28px",
      boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
      ...style,
    }}
  >
    <Label size={24}>Transcript · ElevenLabs Scribe</Label>
    <div
      style={{
        marginTop: 16,
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: 36,
        lineHeight: 1.3,
        color: C.ink,
        letterSpacing: "-0.01em",
        minHeight: 94,
      }}
    >
      {QUOTE.map((w, i) => {
        const o = Math.max(0, Math.min(1, shown - i));
        return (
          <span key={i} style={{ opacity: o, display: "inline-block", marginRight: 10, transform: `translateY(${(1 - o) * 8}px)` }}>
            {w}
          </span>
        );
      })}
    </div>
    <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontSize: 24, color: C.agent }}>
        <AgentMark size={12} />
        Selger is listening
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: 28 }}>
        {Array.from({ length: 9 }, (_, i) => {
          const live = shown < QUOTE.length ? 1 : 0.25;
          const hgt = 6 + live * Math.abs(Math.sin(t * 9 + i * 1.3)) * 22 * (0.5 + 0.5 * Math.abs(Math.sin(i * 2.1 + t * 3)));
          return <div key={i} style={{ width: 4, height: hgt, borderRadius: 2, background: C.agent }} />;
        })}
      </div>
    </div>
  </div>
);
