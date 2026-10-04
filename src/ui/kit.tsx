// Shared 2D UI kit: Blue Pencil components (dark theme), sized for a 1920×1080 video.
import React from "react";
import { C, MONO, SANS } from "../theme";

export const Card: React.FC<{
  readonly children: React.ReactNode;
  readonly width?: number;
  readonly style?: React.CSSProperties;
  readonly elevated?: boolean;
}> = ({ children, width = 520, style, elevated }) => (
  <div
    style={{
      width,
      background: C.surface,
      border: `1.5px solid ${elevated ? C.lineStrong : C.line}`,
      borderRadius: 18,
      padding: 26,
      color: C.ink,
      fontFamily: SANS,
      boxShadow: elevated
        ? "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02)"
        : "0 20px 60px rgba(0,0,0,0.45)",
      ...style,
    }}
  >
    {children}
  </div>
);

// Mono, uppercase receipt label: "SEARCH · EXA".
export const Label: React.FC<{ readonly children: React.ReactNode; readonly color?: string; readonly size?: number }> = ({
  children,
  color = C.ink2,
  size = 18,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: size,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color,
    }}
  >
    {children}
  </div>
);

// Text-only platform or route tag (never a logo or brand colour).
export const Tag: React.FC<{ readonly children: React.ReactNode; readonly tone?: "plain" | "agent" | "mark" | "danger" }> = ({
  children,
  tone = "plain",
}) => {
  const styles: Record<string, React.CSSProperties> = {
    plain: { background: C.sunken, color: C.ink, border: `1.5px solid ${C.line}` },
    agent: { background: C.agentSoft, color: C.agent, border: `1.5px solid ${C.agentSoft}` },
    mark: { background: C.mark, color: C.onMark, border: `1.5px solid ${C.mark}` },
    danger: { background: C.dangerSoft, color: C.danger, border: `1.5px solid ${C.dangerSoft}` },
  };
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 17,
        letterSpacing: "0.06em",
        padding: "5px 11px",
        borderRadius: 8,
        display: "inline-block",
        ...styles[tone],
      }}
    >
      {children}
    </span>
  );
};

// The agent's mark: the 8 px blue square, scaled for video.
export const AgentMark: React.FC<{ readonly size?: number; readonly color?: string }> = ({ size = 14, color = C.agent }) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      background: color,
      borderRadius: 2,
      boxShadow: `0 0 ${size}px ${color}`,
    }}
  />
);

// Status glyph + word. Never colour alone.
export const Status: React.FC<{
  readonly kind: "draft" | "forSale" | "yourTurn" | "sold" | "problem" | "withdrawn";
  readonly text?: string;
  readonly size?: number;
}> = ({ kind, text, size = 22 }) => {
  const word =
    text ??
    { draft: "Draft", forSale: "For sale", yourTurn: "Your turn", sold: "Sold", problem: "Problem", withdrawn: "Withdrawn" }[
      kind
    ];
  const g = size;
  const glyph = (() => {
    switch (kind) {
      case "draft":
        return <circle cx={g / 2} cy={g / 2} r={g / 2 - 2} fill="none" stroke={C.ink2} strokeWidth={2} strokeDasharray="3 3" />;
      case "forSale":
        return (
          <path
            d={`M ${g / 2} 2 A ${g / 2 - 2} ${g / 2 - 2} 0 1 1 2 ${g / 2}`}
            fill="none"
            stroke={C.agent}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      case "yourTurn":
        return <rect x={g * 0.22} y={g * 0.22} width={g * 0.56} height={g * 0.56} transform={`rotate(45 ${g / 2} ${g / 2})`} fill={C.onMark} />;
      case "sold":
        return <path d={`M ${g * 0.2} ${g * 0.52} L ${g * 0.42} ${g * 0.74} L ${g * 0.82} ${g * 0.28}`} fill="none" stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />;
      case "problem":
        return <path d={`M ${g * 0.25} ${g * 0.25} L ${g * 0.75} ${g * 0.75} M ${g * 0.75} ${g * 0.25} L ${g * 0.25} ${g * 0.75}`} stroke={C.danger} strokeWidth={2.8} strokeLinecap="round" />;
      case "withdrawn":
        return (
          <>
            <circle cx={g / 2} cy={g / 2} r={g / 2 - 2} fill="none" stroke={C.ink2} strokeWidth={2} />
            <path d={`M ${g * 0.2} ${g * 0.8} L ${g * 0.8} ${g * 0.2}`} stroke={C.ink2} strokeWidth={2} />
          </>
        );
    }
  })();
  const wrap: React.CSSProperties =
    kind === "yourTurn"
      ? { background: C.mark, color: C.onMark, padding: "4px 12px 4px 6px", borderRadius: 8 }
      : {};
  const color = kind === "problem" ? C.danger : kind === "withdrawn" ? C.ink2 : C.ink;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: SANS, fontWeight: 600, fontSize: size * 0.95, color, ...wrap }}>
      <svg width={g} height={g}>{glyph}</svg>
      {word}
    </span>
  );
};

// Tabular money, e.g. "1 750 kr".
export const Money: React.FC<{ readonly children: React.ReactNode; readonly size?: number; readonly color?: string; readonly weight?: number }> = ({
  children,
  size = 40,
  color = C.ink,
  weight = 700,
}) => (
  <span style={{ fontFamily: SANS, fontSize: size, fontWeight: weight, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
    {children}
  </span>
);

// Chat bubble. `from="agent"` is Selger (agent blue mark), `from="buyer"` is a buyer.
export const Bubble: React.FC<{
  readonly from: "agent" | "buyer";
  readonly name?: string;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ from, name, children, style }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: from === "agent" ? "flex-end" : "flex-start",
      gap: 6,
      ...style,
    }}
  >
    {name ? (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 18, color: C.ink2 }}>
        {from === "agent" ? <AgentMark size={10} /> : null}
        {name}
      </div>
    ) : null}
    <div
      style={{
        maxWidth: 520,
        padding: "14px 20px",
        borderRadius: 16,
        fontFamily: SANS,
        fontSize: 28,
        lineHeight: 1.25,
        color: C.ink,
        background: from === "agent" ? C.agentSoft : C.sunken,
        border: `1.5px solid ${from === "agent" ? "#2b3a66" : C.line}`,
      }}
    >
      {children}
    </div>
  </div>
);

// Big cinematic title text for the video (not product UI).
export const Title: React.FC<{ readonly children: React.ReactNode; readonly size?: number; readonly style?: React.CSSProperties }> = ({
  children,
  size = 96,
  style,
}) => (
  <div
    style={{
      fontFamily: SANS,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1.02,
      letterSpacing: "-0.03em",
      color: C.ink,
      textWrap: "balance",
      ...style,
    }}
  >
    {children}
  </div>
);
