// Shared pieces for scenes 7–9 (call, sold, punchline). Everything is a pure function of `frame`.
import React, { useMemo } from "react";
import { Easing, interpolate, random } from "remotion";
import * as THREE from "three";
import { Glow } from "../../three/Glow";
import { C } from "../../theme";
import { clamp } from "../../ui/anim";

// Absolute seconds -> local frame of a scene that starts at `sceneStart`.
export const at = (sceneStart: number) => (abs: number) => Math.round((abs - sceneStart) * 30);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------- 3D: drifting dust / bokeh ----------
type DustProps = {
  readonly frame: number;
  readonly seed: string;
  readonly count?: number;
  readonly speed?: number; // upward drift per frame (world units)
  readonly spread?: [number, number, number];
  readonly zRange?: [number, number];
  readonly opacity?: number;
  // 0..1: particles are pulled into `target` (the suck-in in scene 9).
  readonly converge?: number;
  readonly target?: [number, number, number];
  // 0..1: particles are blown outward from the origin (impact).
  readonly burst?: number;
};

export const Dust: React.FC<DustProps> = ({
  frame,
  seed,
  count = 60,
  speed = 0.004,
  spread = [10, 6, 0],
  zRange = [-10, 2],
  opacity = 1,
  converge = 0,
  target = [0, 0, 0],
  burst = 0,
}) => {
  const parts = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => ({
        x: (random(`${seed}x${i}`) - 0.5) * 2 * spread[0],
        y: (random(`${seed}y${i}`) - 0.5) * 2 * spread[1],
        z: lerp(zRange[0], zRange[1], random(`${seed}z${i}`)),
        s: 0.06 + random(`${seed}s${i}`) ** 2 * 0.32,
        o: 0.18 + random(`${seed}o${i}`) * 0.5,
        v: 0.5 + random(`${seed}v${i}`),
        ph: random(`${seed}p${i}`) * Math.PI * 2,
        warm: random(`${seed}w${i}`) > 0.82,
        d: random(`${seed}d${i}`),
      })),
    [count, seed, spread, zRange],
  );
  const H = spread[1] * 2;
  return (
    <group>
      {parts.map((p, i) => {
        // Wrap the vertical drift so the field never empties.
        let y = p.y + frame * speed * p.v;
        y = ((((y + spread[1]) % H) + H) % H) - spread[1];
        let x = p.x + Math.sin(frame * 0.012 * p.v + p.ph) * 0.25;
        let z = p.z;
        if (burst > 0) {
          const k = 1 + burst * (1.2 + p.d * 1.6);
          x *= k;
          y *= k;
        }
        let o = p.o * opacity;
        let size = p.s;
        if (converge > 0) {
          // Each particle starts its fall a little later than the last: an accelerating vortex.
          const local = Math.min(1, Math.max(0, (converge - p.d * 0.35) / 0.65));
          const e = Easing.in(Easing.cubic)(local);
          const ang = e * 2.2 * (p.d > 0.5 ? 1 : -1);
          const rx = x - target[0];
          const ry = y - target[1];
          const cx = rx * Math.cos(ang) - ry * Math.sin(ang);
          const cy = rx * Math.sin(ang) + ry * Math.cos(ang);
          x = target[0] + cx * (1 - e);
          y = target[1] + cy * (1 - e);
          z = lerp(z, target[2], e);
          o *= 1 + e * 1.5;
          size *= 1 - e * 0.6;
          if (local >= 1) o = 0;
        }
        return (
          <Glow
            key={i}
            position={[x, y, z]}
            size={size * 2.6}
            color={p.warm ? C.ink : C.agent}
            opacity={Math.min(1, o)}
          />
        );
      })}
    </group>
  );
};

// ---------- 3D: expanding ring (ripple / shockwave) ----------
export const Ripple: React.FC<{
  readonly progress: number; // 0..1
  readonly from?: number;
  readonly to?: number;
  readonly position?: [number, number, number];
  readonly color?: string;
  readonly opacity?: number;
  readonly width?: number;
}> = ({ progress, from = 0.6, to = 4, position = [0, 0, 0], color = C.agent, opacity = 0.6, width = 0.03 }) => {
  if (progress <= 0 || progress >= 1) return null;
  const e = Easing.out(Easing.cubic)(progress);
  const r = lerp(from, to, e);
  const o = opacity * (1 - progress) ** 1.4;
  return (
    <mesh position={position}>
      <ringGeometry args={[r, r + width * (1 + e * 2), 128]} />
      <meshBasicMaterial color={color} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
    </mesh>
  );
};

// ---------- 2D glyphs ----------
export const CheckGlyph: React.FC<{ readonly size?: number; readonly color?: string; readonly draw?: number }> = ({
  size = 28,
  color = C.ink,
  draw = 1,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M 4.5 12.5 L 9.5 17.5 L 19.5 6.5"
      fill="none"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - draw}
    />
  </svg>
);

// Generic handset glyph (not a logo).
export const Handset: React.FC<{ readonly size?: number; readonly color?: string; readonly rotate?: number }> = ({
  size = 40,
  color = C.ink,
  rotate = 0,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${rotate}deg)` }}>
    <path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      fill={color}
    />
  </svg>
);

// Small helper: eased 0..1 between two frames.
export const prog = (frame: number, start: number, dur: number, easing = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing });
