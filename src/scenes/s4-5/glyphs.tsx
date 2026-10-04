// Small shared drawings for scenes 4–5: a padlock that snaps shut and the oak chair tile.
import React from "react";
import { C } from "../../theme";

// closed: 0 = shackle raised (open), 1 = snapped shut.
export const LockGlyph: React.FC<{ readonly size?: number; readonly closed?: number; readonly color?: string }> = ({
  size = 22,
  closed = 1,
  color = C.ink2,
}) => (
  <svg width={size} height={size * 1.15} viewBox="0 -4 20 27" style={{ overflow: "visible", display: "block" }}>
    <path
      d="M5.5 11 V7.5 a4.5 4.5 0 0 1 9 0 V11"
      transform={`translate(0 ${-(1 - closed) * 4})`}
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
    />
    <rect x="2.5" y="10.5" width="15" height="11.5" rx="2.6" fill={color} />
    <rect x="9" y="14.2" width="2" height="4" rx="1" fill={C.surface} />
  </svg>
);

// A warm photo tile with a line drawing of the HAY About A Chair (AAC22) in oak.
export const ChairTile: React.FC<{
  readonly width: number;
  readonly height: number;
  readonly draw?: number; // 0..1 line draw-on
  readonly radius?: number;
}> = ({ width, height, draw = 1, radius = 12 }) => {
  const dash = 600;
  const off = dash * (1 - draw);
  const stroke = { fill: "none", stroke: C.oak, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeDasharray: dash, strokeDashoffset: off };
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: "hidden",
        position: "relative",
        background: `radial-gradient(ellipse at 50% 38%, ${C.oak}38 0%, ${C.oak}12 45%, ${C.sunken} 100%)`,
        border: `1.5px solid ${C.line}`,
      }}
    >
      {/* floor line */}
      <div style={{ position: "absolute", left: 0, right: 0, top: "79%", height: 1.5, background: `${C.oak}30` }} />
      <svg viewBox="0 0 200 200" width={height * 0.9} height={height * 0.9} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -48%)" }}>
        {/* back shell, curved */}
        <path d="M66 58 Q100 44 136 58 L133 80 Q100 70 69 80 Z" {...stroke} fill={`${C.oak}55`} />
        {/* back posts */}
        <path d="M71 79 L74 112" {...stroke} />
        <path d="M131 79 L128 112" {...stroke} />
        {/* seat */}
        <path d="M60 112 L142 112 L150 126 L52 126 Z" {...stroke} fill={`${C.oak}66`} />
        {/* legs */}
        <path d="M58 126 L50 172" {...stroke} />
        <path d="M144 126 L152 172" {...stroke} />
        <path d="M76 126 L80 162" {...stroke} />
        <path d="M126 126 L122 162" {...stroke} />
        {/* stretchers */}
        <path d="M53 156 L149 156" {...stroke} strokeWidth={2} />
      </svg>
    </div>
  );
};
