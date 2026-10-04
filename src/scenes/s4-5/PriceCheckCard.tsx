// Scene 4: the PriceCheck card (list price suggested, target, private floor that locks).
import React from "react";
import { Easing, interpolate } from "remotion";
import { C, MONO, SANS, kr } from "../../theme";
import { clamp, ease, fadeIn } from "../../ui/anim";
import { AgentMark, Card, Label, Money } from "../../ui/kit";
import { LockGlyph } from "./glyphs";

export type PriceCheckTiming = { card: number; you: number; floorDrop: number; lock: number; arrow: number; arrowEnd: number; dur: number };

const SmallTag: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontFamily: MONO, fontSize: 22, padding: "4px 10px", borderRadius: 8, background: C.agentSoft, color: C.agent }}>{children}</span>
);

const PriceRow: React.FC<{
  readonly label: React.ReactNode;
  readonly value: React.ReactNode;
  readonly sub?: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ label, value, sub, style }) => (
  <div style={{ padding: "16px 0", borderTop: `1.5px solid ${C.line}`, ...style }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 500, color: C.ink }}>{label}</div>
      {value}
    </div>
    {sub}
  </div>
);

export const PriceCheckCard: React.FC<{ readonly frame: number; readonly T: PriceCheckTiming; readonly left: number; readonly top: number }> = ({
  frame,
  T,
  left,
  top,
}) => {
  const e = ease(frame, T.card, 14);
  const row = (at: number) => ({
    opacity: fadeIn(frame, at, 6),
    transform: `translateY(${interpolate(frame, [at, at + 8], [12, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}px)`,
  });
  const youOn = interpolate(frame, [T.you, T.you + 5, T.lock + 4, T.lock + 14], [0, 1, 1, 0], clamp);
  const drop = interpolate(frame, [T.floorDrop + 2, T.lock], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const locked = frame >= T.lock ? 1 : 0;
  const lockPop = frame >= T.lock ? 1 + 0.4 * Math.exp(-(frame - T.lock) / 3) : 1;
  const listGlow = frame >= T.arrowEnd ? Math.exp(-(frame - T.arrowEnd) / 10) : 0;
  const aimOn = interpolate(frame, [T.arrow, T.arrow + 6], [0, 1], clamp);
  const drift = interpolate(frame, [0, T.dur], [-3, 3]);
  return (
    <div style={{ position: "absolute", left, top, perspective: 1400, opacity: e }}>
      <div
        style={{
          transform: `translateZ(${(1 - e) * -500}px) rotateY(${-16 - (1 - e) * 34 + drift}deg) rotateX(${4 - (1 - e) * 8}deg) translateX(${(1 - e) * 180}px)`,
          transformOrigin: "100% 50%",
        }}
      >
        <Card width={580} elevated style={{ padding: "24px 32px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <AgentMark size={14} />
              <Label size={24}>Price check</Label>
            </div>
            <span style={{ fontFamily: SANS, fontSize: 24, color: C.ink2 }}>HAY AAC22, oak</span>
          </div>
          <div style={row(T.card + 3)}>
            <PriceRow
              label={
                <>
                  List price <SmallTag>Suggested</SmallTag>
                </>
              }
              value={
                <span
                  style={{
                    textShadow: listGlow > 0 ? `0 0 ${24 * listGlow}px ${C.agent}` : undefined,
                    display: "inline-block",
                    transform: `scale(${1 + 0.08 * listGlow})`,
                    transformOrigin: "100% 50%",
                  }}
                >
                  <Money size={44} color={C.agent}>
                    {kr(1900)}
                  </Money>
                </span>
              }
              style={{ background: `rgba(30,41,73,${0.55 * Math.max(listGlow, aimOn * 0.5)})`, margin: "0 -32px", padding: "16px 32px" }}
            />
          </div>
          <div style={row(T.card + 6)}>
            <PriceRow label="Target" value={<Money size={44}>{kr(1700)}</Money>} />
          </div>
          <div style={row(T.card + 9)}>
            <PriceRow
              label={
                <>
                  Floor
                  <span style={{ display: "inline-block", transform: `scale(${lockPop})` }}>
                    <LockGlyph size={22} closed={locked} color={locked ? C.ink : C.ink2} />
                  </span>
                </>
              }
              value={
                <div style={{ position: "relative", height: 54, minWidth: 190, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: "0 -10px",
                      borderRadius: 10,
                      border: `2px dashed ${C.lineStrong}`,
                      opacity: (1 - drop) * 0.9 + youOn * 0.1,
                      boxShadow: youOn > 0 ? `0 0 ${18 * youOn}px rgba(167,171,179,${0.35 * youOn})` : undefined,
                    }}
                  />
                  <div style={{ position: "absolute", inset: "0 -10px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
                    <span style={{ transform: `translateY(${(1 - drop) * -40}px)`, opacity: drop }}>
                      <Money size={44} color={C.ink2}>
                        {kr(1400)}
                      </Money>
                    </span>
                  </div>
                </div>
              }
              sub={<div style={{ marginTop: 6, fontSize: 24, color: C.ink2, opacity: fadeIn(frame, T.lock, 6) }}>Private. Buyers never see it.</div>}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};
