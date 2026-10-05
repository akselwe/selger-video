import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import o1a from "../../public/audio/vo/o1a-outro.json";
import o1b from "../../public/audio/vo/o1b-outro.json";
import o1c from "../../public/audio/vo/o1c-outro.json";
import { C, MONO, SANS } from "../theme";
import { OUTRO_SECONDS, sec } from "../timing";
import { clamp } from "../ui/anim";
import { Grade } from "../ui/Grade";
import { AgentMark, Label, Status } from "../ui/kit";
import { CheckGlyph, lerp, prog } from "./s7-9/common";

// After the demo: Selger is also an MCP server, so you can run a sale from ChatGPT or Claude.
// Self-contained: own narration (three lines), music bed and captions. 14 s = 420 frames.
const DUR = sec(OUTRO_SECONDS);
type Clip = { id: string; duration: number; words: { text: string; start: number }[] };
const LINES = [
  { clip: o1a as Clip, at: sec(0.5) }, // "Not sold yet?"
  { clip: o1b as Clip, at: sec(2.4) }, // "Integrate it with our MCP in ChatGPT or Claude."
  { clip: o1c as Clip, at: sec(11.2) }, // "And give it a try."
];
const wf = (line: number, text: string) => {
  const { clip, at } = LINES[line];
  const w = clip.words.find((x) => x.text === text);
  if (!w) throw new Error(`${text} not in ${clip.id}`);
  return at + Math.round(w.start * 30);
};
const lineEnd = (line: number) => LINES[line].at + Math.round(LINES[line].clip.duration * 30);

const TITLE = ["Not", "sold", "yet?"].map((t) => wf(0, t)); // 15, 25, 37
const INTEGRATE = wf(1, "Integrate"); // 72
const MCP = wf(1, "M.C.P."); // 101
const GPT = wf(1, "G.P.T."); // 137
const CLAUDE = wf(1, "Claude."); // 168
const MID = INTEGRATE - 6; // title moves to the corner, the chat picker comes in
const CHAT_IN = lineEnd(1) + 2; // 189: a calm, readable chat sequence
const ATTACH = CHAT_IN + 14;
const SENT = ATTACH + 16;
const TOOL = SENT + 20;
const CARD = TOOL + 26;
const LISTED = CARD + 34;
const END_CARD = sec(11.0); // 330
const DUCKS = LINES.map((_, i) => [LINES[i].at, lineEnd(i)] as const);

const TOOLS = ["startSale", "getItemStatus", "answerMissingDetail", "setPriceRules", "getOffers", "approveListings", "decideOnOffer"];
const CHATS = [
  { name: "ChatGPT", at: GPT },
  { name: "Claude", at: CLAUDE },
  { name: "Claude Code", at: -1 },
];

// Narration as captions (line 2 only; the title and the end card carry the other lines).
// The TTS spellings become "MCP" and "ChatGPT".
const capWords = LINES[1].clip.words.map((w) => {
  const f = LINES[1].at + Math.round(w.start * 30);
  if (w.text === "G.P.T.") return { text: "GPT", f, join: false, hl: false };
  if (w.text === "M.C.P.") return { text: "MCP", f, join: false, hl: true };
  return { text: w.text, f, join: w.text === "Chat", hl: false };
});

const musicVolume = (f: number) => {
  const duck = Math.max(...DUCKS.map(([a, b]) => interpolate(f, [a - 6, a, b, b + 10], [0, 1, 1, 0], clamp)));
  const fade = Math.min(interpolate(f, [0, 12], [0, 1], clamp), interpolate(f, [DUR - 40, DUR - 2], [1, 0], clamp));
  return lerp(0.25, 0.12, duck) * fade;
};

const Captions: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < INTEGRATE - 2 || frame >= CHAT_IN + 20) return null;
  const out = interpolate(frame, [CHAT_IN + 6, CHAT_IN + 20], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 92, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 46, color: C.ink, textShadow: "0 2px 18px rgba(0,0,0,0.9)", opacity: out }}>
      {capWords.map((w, i) => {
        const o = interpolate(frame, [w.f - 2, w.f + 3], [0, 1], clamp);
        return (
          <span
            key={i}
            style={{
              opacity: o,
              display: "inline-block",
              marginRight: w.join ? 0 : 12,
              padding: w.hl ? "0 8px" : 0,
              borderRadius: 4,
              background: w.hl ? C.mark : "transparent",
              color: w.hl ? C.onMark : C.ink,
              textShadow: w.hl ? "none" : undefined,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

const Spinner: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={26} height={26} viewBox="0 0 24 24" style={{ transform: `rotate(${frame * 10}deg)` }}>
    <circle cx={12} cy={12} r={9} fill="none" stroke={C.agentSoft} strokeWidth={2.6} />
    <path d="M 12 3 A 9 9 0 0 1 21 12" fill="none" stroke={C.agent} strokeWidth={2.6} strokeLinecap="round" />
  </svg>
);

const ChatWindow: React.FC<{ frame: number }> = ({ frame }) => {
  const attach = prog(frame, ATTACH, 10);
  const sent = prog(frame, SENT, 10);
  const tool = prog(frame, TOOL, 10);
  const done = prog(frame, CARD - 2, 6);
  const card = prog(frame, CARD, 12);
  const listed = frame >= LISTED;
  return (
    <div
      style={{
        width: 940,
        height: 400,
        borderRadius: 20,
        background: C.surface,
        border: `1.5px solid ${C.lineStrong}`,
        boxShadow: "0 30px 90px rgba(0,0,0,0.6), 0 0 80px rgba(45,73,201,0.15)",
        overflow: "hidden",
        fontFamily: SANS,
      }}
    >
      <div style={{ height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", borderBottom: `1.5px solid ${C.line}` }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: C.ink }}>New chat</span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: C.agent }}>
          <AgentMark size={10} /> Selger MCP connected
        </span>
      </div>
      <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* you */}
        <div style={{ alignSelf: "flex-end", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <span style={{ opacity: attach, transform: `translateY(${(1 - attach) * 14}px)`, fontFamily: MONO, fontSize: 24, color: C.ink, background: C.sunken, border: `1.5px solid ${C.line}`, borderRadius: 10, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <svg width={16} height={16} viewBox="0 0 16 16">
              <path d="M 4 2 L 13 8 L 4 14 Z" fill={C.ink2} />
            </svg>
            chair.mov
          </span>
          <span style={{ opacity: sent, transform: `translateY(${(1 - sent) * 14}px)`, fontSize: 30, color: C.ink, background: C.sunken, border: `1.5px solid ${C.line}`, borderRadius: 16, padding: "12px 20px" }}>Sell this</span>
        </div>
        {/* tool call receipt */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: tool, transform: `translateY(${(1 - tool) * 12}px)` }}>
          {done > 0.5 ? <CheckGlyph size={26} color={C.agent} draw={done} /> : <Spinner frame={frame} />}
          <span style={{ fontFamily: MONO, fontSize: 26, color: C.agent }}>startSale</span>
          <span style={{ fontFamily: MONO, fontSize: 24, color: C.ink2 }}>· Selger MCP</span>
        </div>
        {/* live item card */}
        <div
          style={{
            opacity: card,
            transform: `translateY(${(1 - card) * 16}px) scale(${lerp(0.97, 1, card)})`,
            transformOrigin: "0% 0%",
            width: 600,
            background: C.sunken,
            border: `1.5px solid ${listed ? "#3b4f8a" : C.line}`,
            borderRadius: 14,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 10, background: `linear-gradient(160deg, ${C.oak}, #8a6a4a)`, flex: "none" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 30, fontWeight: 600, color: C.ink }}>About A Chair</div>
            <div style={{ fontSize: 24, color: C.ink2, marginTop: 2 }}>HAY AAC22, oak</div>
          </div>
          <div style={{ position: "relative", width: 150, height: 34 }}>
            <span style={{ position: "absolute", right: 0, opacity: listed ? 0 : 1 }}>
              <Status kind="draft" size={28} />
            </span>
            <span style={{ position: "absolute", right: 0, opacity: listed ? 1 : 0, transform: `scale(${listed ? lerp(1.15, 1, prog(frame, LISTED, 8)) : 1})` }}>
              <Status kind="forSale" size={28} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 6], [0, 1], clamp);
  const toBlack = interpolate(frame, [DUR - 8, DUR], [0, 1], clamp);

  // Title: big and centred, then up into the left column.
  const move = interpolate(frame, [MID, MID + 16], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const body = interpolate(frame, [END_CARD - 6, END_CARD + 4], [1, 0], clamp);
  const tx = lerp(960, 120, move);
  const ty = lerp(470, 200, move);
  const tsize = lerp(132, 92, move);
  const push = interpolate(frame, [0, DUR], [1, 1.04]);

  const endIn = prog(frame, END_CARD, 14);

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <Sequence layout="none" name="Music bed">
        <Audio src={staticFile("audio/music/bed-fast.mp3")} trimBefore={40 * 30} volume={musicVolume} />
      </Sequence>
      {LINES.map((l) => (
        <Sequence key={l.clip.id} from={l.at} layout="none" name={`VO ${l.clip.id}`}>
          <Audio src={staticFile(`audio/vo/${l.clip.id}.mp3`)} volume={1} />
        </Sequence>
      ))}

      <AbsoluteFill style={{ opacity: fadeIn }}>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${lerp(50, 66, move)}% 55%, rgba(45,73,201,0.26) 0%, rgba(7,8,10,0) 60%)` }} />
        <AbsoluteFill style={{ transform: `scale(${push})`, opacity: body }}>
          {/* title */}
          <div
            style={{
              position: "absolute",
              left: tx,
              top: ty,
              transform: `translate(${lerp(-50, 0, move)}%, -50%)`,
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: tsize,
              letterSpacing: "-0.03em",
              color: C.ink,
              whiteSpace: "nowrap",
            }}
          >
            {["Not", "sold", "yet?"].map((t, i) => {
              const o = interpolate(frame, [TITLE[i] - 2, TITLE[i] + 3], [0, 1], clamp);
              return (
                <span key={t} style={{ opacity: o, display: "inline-block", marginRight: "0.25em", transform: `translateY(${(1 - o) * 12}px)` }}>
                  {t}
                </span>
              );
            })}
          </div>
          {/* left column: what it is + its tools */}
          <div style={{ position: "absolute", left: 120, top: 280, width: 620, opacity: prog(frame, MID + 8, 14) }}>
            <div style={{ fontFamily: SANS, fontSize: 34, lineHeight: 1.3, color: C.ink2 }}>
              Integrate Selger with your chat through our MCP server. Run the whole sale from there.
            </div>
            <div style={{ marginTop: 34 }}>
              <Label size={24}>Tools</Label>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
              {TOOLS.map((t, i) => {
                const o = prog(frame, MCP - 4 + i * 3, 10);
                const active = t === "startSale" && frame >= TOOL && frame < LISTED + 20;
                return (
                  <span
                    key={t}
                    style={{
                      fontFamily: MONO,
                      fontSize: 24,
                      padding: "7px 12px",
                      borderRadius: 8,
                      color: active ? C.agent : C.ink2,
                      background: active ? C.agentSoft : C.sunken,
                      border: `1.5px solid ${active ? "#3b4f8a" : C.line}`,
                      opacity: o,
                      transform: `translateY(${(1 - o) * 10}px)`,
                    }}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
          {/* right column: pick your chat, then the chat */}
          <div style={{ position: "absolute", left: 860, top: 160, width: 940 }}>
            <div style={{ opacity: prog(frame, MID + 6, 12) }}>
              <Label size={24}>Pick your chat</Label>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
              {CHATS.map((c, i) => {
                const o = prog(frame, MID + 8 + i * 4, 12);
                const sel = c.at > 0 ? prog(frame, c.at - 2, 8) : 0;
                return (
                  <div
                    key={c.name}
                    style={{
                      flex: 1,
                      height: 84,
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: SANS,
                      fontSize: 32,
                      fontWeight: 600,
                      color: sel > 0.5 ? C.ink : C.ink2,
                      background: C.surface,
                      border: `1.5px solid ${C.line}`,
                      boxShadow: `0 0 0 ${sel * 3}px ${C.agent}, 0 0 ${sel * 36}px rgba(139,170,255,${sel * 0.35})`,
                      opacity: o,
                      transform: `translateY(${(1 - o) * 16}px) scale(${1 + sel * 0.02})`,
                    }}
                  >
                    {c.name}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 26, opacity: prog(frame, CHAT_IN, 12), transform: `translateY(${(1 - prog(frame, CHAT_IN, 14)) * 30}px)` }}>
              <ChatWindow frame={frame} />
            </div>
          </div>
        </AbsoluteFill>
        <Captions frame={frame} />

        {/* end card */}
        {endIn > 0 ? (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: endIn, transform: `scale(${lerp(1.04, 1, endIn) * push})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <div style={{ width: 72, height: 72, borderRadius: 8, background: C.agent, boxShadow: `0 0 40px rgba(139,170,255,0.55), 0 0 110px rgba(45,73,201,0.5)` }} />
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 104, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1, marginTop: -8 }}>Selger</div>
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 96, letterSpacing: "-0.03em", color: C.ink, marginTop: 44 }}>
              Not sold yet? <span style={{ background: C.mark, color: C.onMark, padding: "0 0.14em", borderRadius: 10 }}>Give it a try.</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.ink2, marginTop: 40, letterSpacing: "0.02em" }}>Selger MCP server · ChatGPT · Claude</div>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
      <Grade />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: toBlack, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
