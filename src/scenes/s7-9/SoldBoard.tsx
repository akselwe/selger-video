// Scene 8's first beat (48.4–51.4 s): the sold receipt, delist rows and the stat line.
// Pure function of the scene-8 frame. `exit` (0..1) whips it away into the map.
import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { C, SANS, kr } from "../../theme";
import { clamp } from "../../ui/anim";
import { AgentMark, Card, Label, Money, Status } from "../../ui/kit";
import { at, lerp, prog } from "./common";

export const F8 = at(48.4);
export const S8_DUR = 246; // 48.4–56.6 s
export const LAND = F8(48.45); // chime
const EBAY_FLIP = F8(49.68); // "Delisted"
const TISE_FLIP = F8(50.32); // "everywhere"
const STAT_AT = 64;

const SOLD_W = 760;

const DelistRow: React.FC<{ frame: number; name: string; flipAt: number; appearAt: number }> = ({ frame, name, flipAt, appearAt }) => {
  const appear = prog(frame, appearAt, 12);
  const flip = interpolate(frame, [flipAt, flipAt + 12], [0, 180], { ...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1) });
  const face = (back: boolean): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backfaceVisibility: "hidden",
    transform: back ? "rotateX(180deg)" : undefined,
  });
  return (
    <div style={{ height: 66, perspective: 700, opacity: appear, transform: `translateY(${(1 - appear) * 12}px)` }}>
      <div style={{ position: "relative", height: "100%", transformStyle: "preserve-3d", transform: `rotateX(${flip}deg)` }}>
        <div style={face(false)}>
          <span style={{ fontFamily: SANS, fontSize: 32, fontWeight: 600, color: C.ink }}>{name}</span>
          <Status kind="forSale" size={30} />
        </div>
        <div style={face(true)}>
          <span style={{ fontFamily: SANS, fontSize: 32, fontWeight: 600, color: C.ink2 }}>{name}</span>
          <Status kind="withdrawn" size={30} />
        </div>
      </div>
    </div>
  );
};

const SoldCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const pricePop = spring({ frame: frame - LAND - 3, fps, config: { damping: 11, stiffness: 190, mass: 0.7 } });
  const glow = interpolate(frame, [LAND, LAND + 6, LAND + 40], [0, 1, 0.25], clamp);
  return (
    <Card width={SOLD_W} elevated style={{ padding: 40, borderRadius: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Status kind="sold" size={34} />
        <Label size={24}>About A Chair · AAC22</Label>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 46, fontWeight: 600, color: C.ink, marginTop: 26, letterSpacing: "-0.01em" }}>
        Sold on FINN
      </div>
      <div
        style={{
          marginTop: 4,
          transform: `scale(${lerp(1.12, 1, pricePop)})`,
          transformOrigin: "0% 60%",
          textShadow: `0 0 ${glow * 50}px rgba(139,170,255,${glow * 0.7})`,
          lineHeight: 1.0,
        }}
      >
        <Money size={150} weight={800}>
          {kr(1650)}
        </Money>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 28, color: C.ink2, marginTop: 12 }}>To Ola N. · including shipping</div>
      <div style={{ height: 1.5, background: C.line, margin: "26px 0 6px" }} />
      <DelistRow frame={frame} name="eBay" flipAt={EBAY_FLIP} appearAt={14} />
      <div style={{ height: 1.5, background: C.line }} />
      <DelistRow frame={frame} name="Tise" flipAt={TISE_FLIP} appearAt={20} />
    </Card>
  );
};

const StatLine: React.FC<{ frame: number }> = ({ frame }) => {
  const p = prog(frame, STAT_AT, 12);
  const n = Math.round(interpolate(frame, [STAT_AT, STAT_AT + 20], [0, 41], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const one = prog(frame, STAT_AT + 12, 8);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: SANS,
        fontSize: 32,
        color: C.ink2,
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
        whiteSpace: "nowrap",
      }}
    >
      <AgentMark size={16} />
      <span>
        <span style={{ color: C.ink, fontWeight: 600, display: "inline-block", minWidth: 38, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{n}</span> actions by
        Selger.
      </span>
      <span style={{ opacity: one }}>
        <span style={{ color: C.ink, fontWeight: 600 }}>1</span> answer from you.
      </span>
    </div>
  );
};

export const SoldBoard: React.FC<{ frame: number; fps: number; exit?: number }> = ({ frame, fps, exit = 0 }) => {
  const land = spring({ frame: frame - LAND, fps, config: { damping: 15, stiffness: 120, mass: 0.8 } });
  // Camera: land with a slight overshoot, then a slow push.
  const push = lerp(1.0, 1.05, interpolate(frame, [0, 90], [0, 1], clamp));
  const e = Easing.in(Easing.cubic)(exit);
  const scale = lerp(1.3, 1, land) * push * (1 + e * 0.35);
  const cy = 418;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateY(${-e * 160}px) scale(${scale})`,
        transformOrigin: `960px ${cy}px`,
        opacity: interpolate(frame, [LAND - 1, LAND + 3], [0, 1], clamp) * (1 - exit),
        filter: frame < LAND + 8 || e > 0 ? `blur(${Math.max((1 - land) * 10, e * 14)}px)` : undefined,
      }}
    >
      <div style={{ position: "absolute", left: 960 - SOLD_W / 2, top: cy - 8, height: 0, display: "flex", alignItems: "center" }}>
        <SoldCard frame={frame} fps={fps} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 742, display: "flex", justifyContent: "center" }}>
        <StatLine frame={frame} />
      </div>
    </div>
  );
};
