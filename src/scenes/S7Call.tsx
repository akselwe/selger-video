import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, SANS } from "../theme";
import { clamp } from "../ui/anim";
import { AgentMark, Card, Label } from "../ui/kit";
import { VO_AT } from "../timing";
import { CallBackdrop, Words, clipWords, useVoice, type VoiceClip } from "./s7-9/call";
import { CheckGlyph, at, lerp, prog } from "./s7-9/common";
import { PHONE_H, PHONE_W, Phone, shapeBars } from "./s7-9/Phone";

// Scene 7: a buyer asks something the knowledge sheet can't answer, so Teo (the Selger agent)
// phones Kris, gets the answer and carries on by itself. Frame 0 = 37.0 s (342 frames).
const F = at(37.0);
const RING = F(37.05); // 2
const ANSWER = 22; // Kris picks up
const TEO_AT = F(VO_AT["s7-teo"]); // 27
const KRIS_AT = F(VO_AT["s7-kris"]); // 219: "No, no pets."
const BYE_AT = F(VO_AT["s7-bye"]); // 278: "Perfect, thanks. Bye."
const TICK = KRIS_AT + 8; // the knowledge-sheet row fills in
const REPLIED = BYE_AT + 12; // the reply to Ola N. goes out
const END_AT = 330; // call ends
const DUR = 342;

const CLIPS: VoiceClip[] = [
  { id: "s7-teo", at: TEO_AT, who: "agent" },
  { id: "s7-kris", at: KRIS_AT, who: "you" },
  { id: "s7-bye", at: BYE_AT, who: "agent" },
];

const teoWords = clipWords("s7-teo", TEO_AT, { hl: (i) => i >= 15 && i <= 17 }); // "home with pets."
const krisWords = clipWords("s7-kris", KRIS_AT);
const byeWords = clipWords("s7-bye", BYE_AT);

// ---------- live transcript ----------
const Speaker: React.FC<{ frame: number; at: number; who: "agent" | "you"; name: string; children: React.ReactNode; first?: boolean }> = ({
  frame,
  at: start,
  who,
  name,
  children,
  first,
}) => {
  const p = prog(frame, start - 5, 10);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 10}px)`, marginTop: first ? 0 : 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: SANS,
          fontSize: 24,
          fontWeight: 600,
          color: who === "agent" ? C.agent : C.ink2,
          marginBottom: 6,
        }}
      >
        {who === "agent" ? <AgentMark size={12} /> : null}
        {name}
      </div>
      {children}
    </div>
  );
};

const Transcript: React.FC<{ frame: number }> = ({ frame }) => {
  const live = frame < END_AT;
  const blink = 0.55 + 0.45 * Math.sin(frame * 0.25);
  return (
    <Card width={540} style={{ padding: 32, height: 540 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label size={24}>Call · ElevenLabs Agents</Label>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            background: live ? C.agent : C.ink2,
            opacity: live ? blink : 1,
            boxShadow: live ? `0 0 10px ${C.agent}` : "none",
          }}
        />
      </div>
      <div style={{ height: 1.5, background: C.line, margin: "22px 0 22px" }} />
      <Speaker frame={frame} at={TEO_AT} who="agent" name="Teo" first>
        <Words words={teoWords} frame={frame} activeColor={C.agent} size={30} soft />
      </Speaker>
      <Speaker frame={frame} at={KRIS_AT} who="you" name="Kris">
        <Words words={krisWords} frame={frame} activeColor={C.ink} size={30} />
      </Speaker>
      <Speaker frame={frame} at={BYE_AT} who="agent" name="Teo">
        <Words words={byeWords} frame={frame} activeColor={C.agent} size={30} />
      </Speaker>
    </Card>
  );
};

// ---------- buyer question card ----------
const Spinner: React.FC<{ frame: number; size?: number }> = ({ frame, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${frame * 9}deg)`, flex: "none" }}>
    <circle cx={12} cy={12} r={9} fill="none" stroke={C.agentSoft} strokeWidth={2.6} />
    <path d="M 12 3 A 9 9 0 0 1 21 12" fill="none" stroke={C.agent} strokeWidth={2.6} strokeLinecap="round" />
  </svg>
);

const SheetRow: React.FC<{ k: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ k, children, style }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 46, fontFamily: SANS, fontSize: 26, ...style }}>
    <span style={{ color: C.ink2 }}>{k}</span>
    {children}
  </div>
);

const StatusLine: React.FC<{ frame: number; show: number; done?: boolean; children: React.ReactNode }> = ({ frame, show, done, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      fontFamily: SANS,
      fontSize: 27,
      lineHeight: 1.32,
      fontWeight: 500,
      color: C.agent,
      opacity: show,
      transform: `translateY(${(1 - show) * 8}px)`,
    }}
  >
    <div style={{ marginTop: 4 }}>{done ? <AgentMark size={16} /> : <Spinner frame={frame} />}</div>
    <div>{children}</div>
  </div>
);

const QuestionCard: React.FC<{ frame: number }> = ({ frame }) => {
  const tick = prog(frame, TICK, 12);
  const flash = interpolate(frame, [TICK, TICK + 4, TICK + 30], [0, 1, 0], clamp);
  const note = prog(frame, TICK + 8, 10);
  const s1 = interpolate(frame, [TEO_AT + 4, TEO_AT + 12, TICK - 2, TICK + 4], [0, 1, 1, 0], clamp);
  const s2 = interpolate(frame, [TICK + 6, TICK + 14, REPLIED - 4, REPLIED + 2], [0, 1, 1, 0], clamp);
  const s3 = prog(frame, REPLIED + 2, 12);
  const working = frame < REPLIED;
  const glow = working ? 0.35 + 0.2 * Math.sin(frame * 0.12) : 0.35 * (1 - prog(frame, REPLIED, 20));
  const sent = interpolate(frame, [REPLIED + 2, REPLIED + 6, REPLIED + 30], [0, 1, 0], clamp);
  return (
    <Card
      width={540}
      style={{
        padding: 32,
        height: 584,
        borderColor: mixBorder(glow),
        boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 ${40 + sent * 40}px rgba(139,170,255,${glow * 0.25 + sent * 0.25})`,
      }}
    >
      <Label size={24}>Question · FINN · Ola N.</Label>
      <div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 600, lineHeight: 1.22, color: C.ink, marginTop: 18, letterSpacing: "-0.01em" }}>
        “Has it been in a home with pets?”
      </div>
      <div style={{ marginTop: 22, background: C.sunken, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "14px 20px 12px" }}>
        <Label size={24}>Knowledge sheet</Label>
        <div style={{ marginTop: 6 }}>
          <SheetRow k="Model">
            <span style={{ color: C.ink }}>HAY AAC22, oak</span>
          </SheetRow>
          <div style={{ height: 1.5, background: C.line }} />
          <SheetRow k="Condition">
            <span style={{ color: C.ink }}>Good, small scratch</span>
          </SheetRow>
          <div style={{ height: 1.5, background: C.line }} />
          <SheetRow
            k="Pets in home"
            style={{ background: `rgba(139,170,255,${flash * 0.16})`, margin: "0 -20px", padding: "0 20px" }}
          >
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", minWidth: 150, justifyContent: "flex-end" }}>
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  color: C.ink2,
                  borderBottom: `2px dashed ${C.lineStrong}`,
                  opacity: 1 - tick,
                }}
              >
                Not known
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.ink, fontWeight: 600, opacity: tick, transform: `scale(${lerp(1.3, 1, tick)})`, transformOrigin: "100% 50%" }}>
                <CheckGlyph size={26} draw={prog(frame, TICK + 2, 10)} />
                No
              </span>
            </span>
          </SheetRow>
          <div style={{ textAlign: "right", fontFamily: SANS, fontSize: 24, color: C.ink2, height: 30, opacity: note }}>from Kris, by phone</div>
        </div>
      </div>
      <div style={{ position: "relative", marginTop: 22, height: 80 }}>
        <StatusLine frame={frame} show={s1}>
          Not in the knowledge sheet. Asking Kris.
        </StatusLine>
        <StatusLine frame={frame} show={s2}>
          Replying to Ola N.
        </StatusLine>
        <StatusLine frame={frame} show={s3} done>
          Replied to Ola N.: “No pets. It's from a pet-free home.”
        </StatusLine>
      </div>
    </Card>
  );
};
const mixBorder = (g: number) => `rgba(139,170,255,${0.18 + g * 0.45})`;

export const S7Call: React.FC = () => {
  const frame = useCurrentFrame();
  const { bins, speaker, level } = useVoice(frame, CLIPS);
  const bars = shapeBars(bins, 31, frame, frame >= ANSWER ? 1 : 0);

  // Phone rises into frame at the ring, then floats.
  const rise = interpolate(frame, [0, 26], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const buzz = frame < ANSWER - 4 && frame >= RING && frame < RING + 14 ? Math.sin(frame * 2.4) * 2.5 : 0;
  const phoneY = lerp(820, 0, rise) + Math.sin(frame / 40) * 4;
  const phoneRX = lerp(32, 5, rise) + Math.sin(frame / 55) * 1.2;
  const phoneRY = Math.sin(frame / 70) * 3;

  // Side cards fly in from depth once Teo starts talking.
  const qIn = prog(frame, TEO_AT + 2, 26);
  const tIn = prog(frame, TEO_AT + 12, 26);
  const push = interpolate(frame, [0, DUR], [0.985, 1.03]);
  const sceneFade = Math.min(interpolate(frame, [0, 6], [0, 1], clamp), interpolate(frame, [DUR - 6, DUR], [1, 0], clamp));

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <AbsoluteFill style={{ opacity: sceneFade }}>
        <CallBackdrop frame={frame} level={level} answerAt={ANSWER} ringAt={RING} />
        <AbsoluteFill style={{ perspective: 1900, perspectiveOrigin: "50% 45%", transform: `scale(${push})` }}>
          {/* transcript, left */}
          <div
            style={{
              position: "absolute",
              left: 160,
              top: 540,
              height: 0,
              display: "flex",
              alignItems: "center",
              opacity: tIn,
              transform: `translateX(${(1 - tIn) * -120}px) translateZ(${lerp(-500, 0, tIn)}px) rotateY(${lerp(38, 7, tIn) + Math.sin(frame / 80) * 1.2}deg)`,
              transformOrigin: "100% 50%",
            }}
          >
            <Transcript frame={frame} />
          </div>
          {/* phone, centre */}
          <div
            style={{
              position: "absolute",
              left: 960 - PHONE_W / 2,
              top: 540 - PHONE_H / 2 + 8,
              transform: `translateX(${buzz}px) translateY(${phoneY}px) rotateX(${phoneRX}deg) rotateY(${phoneRY}deg)`,
              transformOrigin: "50% 100%",
            }}
          >
            <Phone frame={frame} answerAt={ANSWER} endAt={END_AT} bars={bars} speaker={speaker} level={level} />
          </div>
          {/* buyer question, right */}
          <div
            style={{
              position: "absolute",
              left: 1220,
              top: 540,
              height: 0,
              display: "flex",
              alignItems: "center",
              opacity: qIn,
              transform: `translateX(${(1 - qIn) * 120}px) translateZ(${lerp(-500, 0, qIn)}px) rotateY(${lerp(-38, -7, qIn) - Math.sin(frame / 80) * 1.2}deg)`,
              transformOrigin: "0% 50%",
            }}
          >
            <QuestionCard frame={frame} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
