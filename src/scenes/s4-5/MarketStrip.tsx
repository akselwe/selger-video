// Scene 4: a row of four market-analysis tiles across the top of the frame.
// Numbers are consistent with the comparables in S4Price: 23 listings (10 sold, avg 1 720 kr).
import React from "react";
import { Easing, interpolate } from "remotion";
import { C, SANS, kr } from "../../theme";
import { clamp, ease } from "../../ui/anim";
import { Money } from "../../ui/kit";

const TILE_W = 425;
const GAP = 20;

const Tile: React.FC<{ readonly frame: number; readonly at: number; readonly i: number; readonly children: React.ReactNode; readonly tilt: number }> = ({
  frame,
  at,
  i,
  children,
  tilt,
}) => {
  const e = ease(frame, at, 12);
  return (
    <div
      style={{
        position: "absolute",
        left: 80 + i * (TILE_W + GAP),
        top: 100,
        width: TILE_W,
        height: 146,
        opacity: e,
        transform: `perspective(1200px) translateY(${(1 - e) * -26}px) rotateX(${(1 - e) * -50 + 6}deg) rotateY(${tilt}deg)`,
        transformOrigin: "50% 0%",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          background: "rgba(26,28,31,0.88)",
          border: `1.5px solid ${C.line}`,
          borderRadius: 16,
          padding: "16px 22px",
          fontFamily: SANS,
          color: C.ink,
          boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Cap: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 24, color: C.ink2, fontWeight: 500, whiteSpace: "nowrap" }}>{children}</div>
);

export const MarketStrip: React.FC<{ readonly frame: number; readonly landed: number; readonly dim: number }> = ({ frame, landed, dim }) => {
  const tilt = interpolate(frame, [0, 159], [-2, 2]);
  const avg = Math.round(interpolate(frame, [14, 34], [0, 1720], { ...clamp, easing: Easing.out(Easing.cubic) }) / 10) * 10;
  const curve = ease(frame, 18, 18);
  const bars = [0.35, 0.42, 0.5, 0.55, 0.68, 0.8, 1];
  // Days to sell vs price: 1 500 → 3, 1 700 → 6, 1 900 → 14, 2 100 → 30.
  const pts: [number, number][] = [
    [1400, 2],
    [1500, 3],
    [1600, 4.3],
    [1700, 6],
    [1800, 9],
    [1900, 14],
    [2000, 21],
    [2100, 30],
  ];
  const W = 118;
  const H = 74;
  const px = (p: number) => ((p - 1400) / 700) * W;
  const py = (d: number) => H - (d / 30) * H;
  const path = pts.map(([p, d], k) => `${k ? "L" : "M"}${px(p).toFixed(1)} ${py(d).toFixed(1)}`).join(" ");
  return (
    <div style={{ opacity: dim }}>
      <Tile frame={frame} at={2} i={0} tilt={tilt}>
        <Cap>Comparables · Exa + eBay</Cap>
        <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 10, whiteSpace: "nowrap" }}>
          <Money size={44}>{landed}</Money>
          <span style={{ fontSize: 28, fontWeight: 600 }}>similar listings</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 24, color: C.ink2 }}>FINN, Tise, eBay</div>
      </Tile>
      <Tile frame={frame} at={6} i={1} tilt={tilt}>
        <Cap>Avg. sold price</Cap>
        <div style={{ marginTop: 8 }}>
          <Money size={44}>{kr(avg)}</Money>
        </div>
        <div style={{ marginTop: 4, fontSize: 24, color: C.ink2 }}>From 10 sold listings</div>
      </Tile>
      <Tile frame={frame} at={10} i={2} tilt={tilt}>
        <Cap>Demand</Cap>
        <div style={{ marginTop: 8, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.01em" }}>High</span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 46 }}>
            {bars.map((h, k) => (
              <div
                key={k}
                style={{
                  width: 12,
                  height: 46 * h * ease(frame, 14 + k * 1.5, 10),
                  borderRadius: 3,
                  background: k === bars.length - 1 ? C.agent : C.lineStrong,
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ marginTop: 4, fontSize: 24, color: C.ink2 }}>312 searches this week</div>
      </Tile>
      <Tile frame={frame} at={14} i={3} tilt={tilt}>
        <Cap>Time to sell</Cap>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
          <div style={{ fontSize: 24, lineHeight: 1.35, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            <div style={{ opacity: interpolate(curve, [0.4, 0.7], [0, 1], clamp) }}>
              {kr(1700)} <span style={{ color: C.ink2 }}>· about 6 days</span>
            </div>
            <div style={{ opacity: interpolate(curve, [0.7, 1], [0, 1], clamp) }}>
              <span style={{ color: C.agent }}>{kr(1900)}</span> <span style={{ color: C.ink2 }}>· about 14 days</span>
            </div>
          </div>
          <svg width={W + 8} height={H + 8} viewBox={`-4 -4 ${W + 8} ${H + 8}`} style={{ overflow: "visible" }}>
            <line x1={0} y1={H} x2={W} y2={H} stroke={C.line} strokeWidth={1.5} />
            <path d={path} fill="none" stroke={C.ink2} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - curve} />
            <circle cx={px(1700)} cy={py(6)} r={5} fill={C.ink} opacity={interpolate(curve, [0.4, 0.6], [0, 1], clamp)} />
            <circle cx={px(1900)} cy={py(14)} r={5.5} fill={C.agent} opacity={interpolate(curve, [0.7, 0.85], [0, 1], clamp)} />
          </svg>
        </div>
      </Tile>
    </div>
  );
};
