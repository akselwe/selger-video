import { Edges } from "@react-three/drei";
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { Glow } from "../three/Glow";
import { Stage } from "../three/Stage";
import { C, MONO, SANS, kr } from "../theme";
import { clamp, ease, fadeIn, fadeOut } from "../ui/anim";
import { CameraRig, project, type Cam, type V3 } from "./s4-5/cam";
import { LockGlyph } from "./s4-5/glyphs";
import { MarketStrip } from "./s4-5/MarketStrip";
import { PriceCheckCard } from "./s4-5/PriceCheckCard";

// Scene 4 · Price (13.0–18.3 s, 159 frames). Frame 0 = start of this scene.
// "It checks what it's really worth. You set the floor. It aims higher."
const DUR = 159;
const T = {
  axis: 0,
  median: 30,
  band: 40, // "really worth"
  phaseB: 54, // camera re-frames, card comes in
  card: 60,
  you: 72, // "You set the floor"
  floorDrop: 84,
  lock: 98, // lock sound at 16.25 s
  arrow: 117, // "It aims higher"
  arrowEnd: 140,
  dur: DUR,
};

// Price -> world x. 100 kr = 1 unit, 1 700 kr at the origin.
const X = (p: number) => (p - 1700) / 100;
const AXIS_MIN = 1300;
const AXIS_MAX = 2100;

// 23 comparables: 10 sold (avg 1 720 kr), 13 listed; median of all 1 750 kr.
type Comp = { p: number; sold: boolean; src: "FINN" | "Tise" | "eBay" };
const RAW: Comp[] = [
  { p: 1450, sold: false, src: "Tise" },
  { p: 1500, sold: false, src: "FINN" },
  { p: 1550, sold: true, src: "FINN" },
  { p: 1600, sold: true, src: "Tise" },
  { p: 1600, sold: false, src: "FINN" },
  { p: 1650, sold: true, src: "FINN" },
  { p: 1650, sold: false, src: "eBay" },
  { p: 1700, sold: true, src: "Tise" },
  { p: 1700, sold: true, src: "FINN" },
  { p: 1700, sold: false, src: "FINN" },
  { p: 1750, sold: true, src: "FINN" },
  { p: 1750, sold: true, src: "Tise" },
  { p: 1750, sold: false, src: "FINN" },
  { p: 1800, sold: true, src: "FINN" },
  { p: 1800, sold: true, src: "eBay" },
  { p: 1800, sold: false, src: "Tise" },
  { p: 1850, sold: false, src: "FINN" },
  { p: 1900, sold: true, src: "FINN" },
  { p: 1900, sold: false, src: "Tise" },
  { p: 1950, sold: false, src: "eBay" },
  { p: 1950, sold: false, src: "FINN" },
  { p: 2000, sold: false, src: "FINN" },
  { p: 2050, sold: false, src: "eBay" },
];
const DOT_BASE = 0.22;
const DOT_STEP = 0.27;
const FLY = 9;
const COMPS = (() => {
  const seen: Record<number, number> = {};
  const order = RAW.map((_, i) => i).sort((a, b) => random(`ord${a}`) - random(`ord${b}`));
  return RAW.map((c, i) => {
    const k = seen[c.p] ?? 0;
    seen[c.p] = k + 1;
    const rank = order.indexOf(i);
    return { ...c, i, pos: [X(c.p), DOT_BASE + DOT_STEP * k, 0] as V3, at: 3 + rank * 1.3 };
  });
})();
// Three receipts that flash up as their dots land.
const TAGGED: Record<number, string> = { 2: "sold", 22: "listed" };
const TAG_H = 1.38;

// Histogram: 100 kr bins.
const BINS = [1400, 1500, 1600, 1700, 1800, 1900, 2000].map((b) => ({ b }));
const BAR_UNIT = 0.27;
const BAND_H = 2.15;
const MEDIAN_H = 1.95;
const GATE_H = 1.7;

// ---------- camera: quick moves, constant slow drift ----------
const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const CAM0 = { pos: [-1.6, 1.25, 8.0] as V3, tgt: [0.6, 0.85, 0] as V3 };
const CAMA = { pos: [-0.4, 2.0, 10.4] as V3, tgt: [0.05, 1.0, 0] as V3 };
const CAMB = { pos: [1.3, 3.0, 14.2] as V3, tgt: [1.5, 1.5, 0] as V3 };

const getCam = (frame: number): Cam => {
  const e1 = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const e2 = interpolate(frame, [T.phaseB, T.phaseB + 16], [0, 1], { ...clamp, easing: Easing.bezier(0.7, 0, 0.2, 1) });
  const d = frame * 0.006;
  let pos = mix(mix(CAM0.pos, CAMA.pos, e1), CAMB.pos, e2);
  const tgt = mix(mix(CAM0.tgt, CAMA.tgt, e1), CAMB.tgt, e2);
  pos = [pos[0] + d * 0.5, pos[1] + d * 0.25, pos[2] + d * 0.5];
  const k = frame - T.lock;
  if (k >= 0) pos = [pos[0], pos[1] - 0.05 * Math.exp(-k / 4) * Math.sin(k * 2.1), pos[2]];
  return { pos, tgt: [tgt[0] + d * 0.5, tgt[1], tgt[2]], fov: 35 };
};

// ---------- 3D ----------

const Grid: React.FC = () => {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(60, 60, C.line, C.line);
    const m = g.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.55;
    m.depthWrite = false;
    return g;
  }, []);
  return <primitive object={grid} position={[0, -0.02, 0]} />;
};

const Dust: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const geo = useMemo(() => {
    const n = 260;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = -10 + random(`dx${i}`) * 24;
      arr[i * 3 + 1] = -0.5 + random(`dy${i}`) * 7;
      arr[i * 3 + 2] = -14 + random(`dz${i}`) * 18;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} position={[-frame * 0.005, frame * 0.003, 0]}>
      <pointsMaterial color={C.ink2} size={0.035} sizeAttenuation transparent opacity={0.45} depthWrite={false} />
    </points>
  );
};

const Axis: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const a = ease(frame, T.axis, 16);
  const x0 = X(AXIS_MIN) - 0.3;
  const len = X(AXIS_MAX) + 0.3 - x0;
  const ticks = [];
  for (let p = AXIS_MIN; p <= AXIS_MAX; p += 100) {
    const shown = interpolate(a * len + x0, [X(p) - 0.2, X(p) + 0.2], [0, 1], clamp);
    const major = (p - AXIS_MIN) % 200 === 0;
    const h = major ? 0.22 : 0.12;
    ticks.push(
      <mesh key={p} position={[X(p), (h / 2) * shown, 0.35]} scale={[1, Math.max(0.001, shown), 1]}>
        <boxGeometry args={[0.02, h, 0.02]} />
        <meshBasicMaterial color={major ? C.ink2 : C.lineStrong} />
      </mesh>,
    );
  }
  return (
    <group>
      <mesh position={[x0 + (len * a) / 2, 0, 0.35]} scale={[Math.max(0.001, a), 1, 1]}>
        <boxGeometry args={[len, 0.024, 0.024]} />
        <meshBasicMaterial color={C.ink2} />
      </mesh>
      <mesh position={[x0 + (len * a) / 2, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[Math.max(0.001, a), 1, 1]}>
        <planeGeometry args={[len, 1.6]} />
        <meshBasicMaterial color={C.agentDeep} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {ticks}
      <Glow position={[x0 + len * a, 0, 0.35]} size={1.2} color={C.ink} opacity={a < 1 ? 0.7 : 0} />
    </group>
  );
};

const Histogram: React.FC<{ readonly frame: number; readonly dim: number }> = ({ frame, dim }) => (
  <group position={[0, 0, -0.7]}>
    {BINS.map(({ b }) => {
      // Bars track the dots as they land.
      const n = COMPS.filter((c) => c.p >= b && c.p < b + 100).reduce(
        (sum, c) => sum + interpolate(frame, [c.at + FLY - 2, c.at + FLY + 5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }),
        0,
      );
      const g = n > 0 ? 1 : 0;
      const h = Math.max(0.001, n * BAR_UNIT);
      return (
        <group key={b} position={[X(b + 50), 0, 0]}>
          <mesh position={[0, h / 2, 0]}>
            <boxGeometry args={[0.9, h, 0.5]} />
            <meshBasicMaterial color={C.agentDeep} transparent opacity={0.32 * dim} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh position={[0, h, 0.25]}>
            <boxGeometry args={[0.9, 0.025, 0.02]} />
            <meshBasicMaterial color={C.agent} transparent opacity={0.85 * dim * (g > 0.02 ? 1 : 0)} />
          </mesh>
        </group>
      );
    })}
  </group>
);

const Dots: React.FC<{ readonly frame: number; readonly dim: number }> = ({ frame, dim }) => (
  <group>
    {COMPS.map((c) => {
      if (frame < c.at) return null;
      const l = interpolate(frame, [c.at, c.at + FLY], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.9, 0.3, 1) });
      const off = (1 - l);
      const p: V3 = [c.pos[0] + off * 2.2, c.pos[1] + off * 3.2, c.pos[2] - off * 7];
      const op = fadeIn(frame, c.at, 3) * dim;
      const flash = frame >= c.at + FLY ? Math.exp(-(frame - c.at - FLY) / 3) : 0;
      return (
        <group key={c.i}>
          <group position={p}>
            {c.sold ? (
              <mesh>
                <sphereGeometry args={[0.085, 20, 20]} />
                <meshBasicMaterial color={C.ink} transparent opacity={op} />
              </mesh>
            ) : (
              <mesh>
                <torusGeometry args={[0.075, 0.02, 10, 40]} />
                <meshBasicMaterial color={C.ink2} transparent opacity={op} />
              </mesh>
            )}
            <Glow size={0.55 + off * 0.9 + flash * 0.8} color={c.sold ? C.ink : C.ink2} opacity={(0.4 + flash * 0.5) * op} />
          </group>
          {off > 0.05 ? <Glow position={[p[0] + off * 0.7, p[1] + off * 1.0, p[2] - off * 2.2]} size={0.4} color={C.ink} opacity={0.3 * off * op} /> : null}
        </group>
      );
    })}
  </group>
);

const Median: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const g = ease(frame, T.median, 10);
  if (g <= 0) return null;
  const n = 9;
  const seg = MEDIAN_H / n;
  return (
    <group position={[X(1750), 0, 0.3]}>
      {Array.from({ length: n }).map((_, k) => {
        const vis = interpolate(g * n, [k, k + 1], [0, 1], clamp);
        return (
          <mesh key={k} position={[0, seg * k + seg * 0.32, 0]} scale={[1, Math.max(0.001, vis), 1]}>
            <boxGeometry args={[0.025, seg * 0.6, 0.025]} />
            <meshBasicMaterial color={C.ink} transparent opacity={0.85} />
          </mesh>
        );
      })}
      <Glow position={[0, MEDIAN_H * g, 0]} size={0.6} color={C.ink} opacity={0.6} />
    </group>
  );
};

const Band: React.FC<{ readonly frame: number; readonly b: number }> = ({ frame, b }) => {
  if (b <= 0) return null;
  const h = Math.max(0.001, BAND_H * b);
  const pulse = frame >= T.arrowEnd ? 1 + 0.5 * Math.exp(-(frame - T.arrowEnd) / 8) : 1;
  return (
    <group position={[X(1800), 0, -0.25]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[X(1900) - X(1700), h, 1.5]} />
        <meshBasicMaterial color={C.agent} transparent opacity={0.06 * b * pulse} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        <Edges color={C.agent} transparent opacity={0.6 * b} />
      </mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[X(1900) - X(1700), 1.5]} />
        <meshBasicMaterial color={C.agent} transparent opacity={0.2 * b} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Glow position={[0, h * 0.5, -0.6]} size={4.5} color={C.agentDeep} opacity={0.5 * b * pulse} />
    </group>
  );
};

const FloorGate: React.FC<{ readonly frame: number }> = ({ frame }) => {
  if (frame < T.floorDrop) return null;
  const p = interpolate(frame, [T.floorDrop, T.lock], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const k = frame - T.lock;
  const bounce = k >= 0 ? 0.07 * Math.exp(-k / 3) * Math.abs(Math.sin(k * 0.9)) : 0;
  const y = (1 - p) * 1.7 + bounce;
  const op = fadeIn(frame, T.floorDrop, 4);
  const n = 8;
  const seg = GATE_H / n;
  const ring = k >= 0 ? interpolate(k, [0, 16], [0, 1], clamp) : 0;
  const zone = k >= 0 ? ease(frame, T.lock, 12) : 0;
  return (
    <group>
      <group position={[X(1400), y, 0.35]}>
        {Array.from({ length: n }).map((_, i) => (
          <mesh key={i} position={[0, seg * i + seg * 0.32, 0]}>
            <boxGeometry args={[0.04, seg * 0.62, 0.04]} />
            <meshBasicMaterial color={C.ink2} transparent opacity={op} />
          </mesh>
        ))}
        <Glow position={[0, GATE_H, 0]} size={0.8} color={C.ink2} opacity={0.6 * op} />
      </group>
      {k >= 0 ? (
        <>
          <mesh position={[X(1400), 0.012, 0.35]} rotation={[-Math.PI / 2, 0, 0]} scale={0.2 + ring * 1.6}>
            <ringGeometry args={[0.9, 1, 64]} />
            <meshBasicMaterial color={C.ink} transparent opacity={0.9 * (1 - ring)} depthWrite={false} />
          </mesh>
          <Glow position={[X(1400), 0.05, 0.35]} size={2.6} color={C.ink} opacity={0.9 * Math.exp(-k / 5)} />
          <mesh position={[(X(AXIS_MIN) - 0.3 + X(1400)) / 2, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[X(1400) - X(AXIS_MIN) + 0.3, 1.6]} />
            <meshBasicMaterial color={C.ink2} transparent opacity={0.09 * zone} depthWrite={false} />
          </mesh>
        </>
      ) : null}
    </group>
  );
};

const ARROW_PTS: V3[] = [
  [X(1400), 0.2, 0.6],
  [X(1550), 0.45, 0.6],
  [X(1700), 0.95, 0.6],
  [X(1800), 1.45, 0.6],
  [X(1900), 2.1, 0.6],
];
const ARROW_CURVE = new THREE.CatmullRomCurve3(ARROW_PTS.map((p) => new THREE.Vector3(...p)), false, "centripetal");
// Arc-length position of the 1 700 kr point on the curve.
const TARGET_U = (() => {
  let best = 0;
  let bd = Infinity;
  for (let u = 0; u <= 1; u += 0.002) {
    const d = Math.abs(ARROW_CURVE.getPointAt(u).x - X(1700));
    if (d < bd) {
      bd = d;
      best = u;
    }
  }
  return best;
})();
const TARGET_PT = ARROW_CURVE.getPointAt(TARGET_U).toArray() as V3;
const arrowProg = (frame: number) => interpolate(frame, [T.arrow, T.arrowEnd], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });

const Arrow: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const SEG = 160;
  const RAD = 12;
  const geo = useMemo(() => new THREE.TubeGeometry(ARROW_CURVE, SEG, 0.035, RAD, false), []);
  const prog = arrowProg(frame);
  if (frame < T.arrow) return null;
  geo.setDrawRange(0, Math.max(1, Math.floor(prog * SEG)) * RAD * 6);
  const head = ARROW_CURVE.getPointAt(Math.max(0.001, prog));
  const tan = ARROW_CURVE.getTangentAt(Math.max(0.001, prog));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan.normalize());
  const tPassed = prog >= TARGET_U ? 1 : 0;
  const kArr = frame - T.arrowEnd;
  const arrived = kArr >= 0 ? ease(frame, T.arrowEnd, 10) : 0;
  return (
    <group>
      <mesh geometry={geo}>
        <meshBasicMaterial color={C.agent} fog={false} />
      </mesh>
      <mesh position={head} quaternion={q}>
        <coneGeometry args={[0.12, 0.3, 24]} />
        <meshBasicMaterial color={C.agent} fog={false} />
      </mesh>
      <Glow position={[head.x, head.y, head.z]} size={1.6} color={C.agent} opacity={0.9} />
      {tPassed ? (
        <>
          <mesh position={TARGET_PT}>
            <sphereGeometry args={[0.09, 24, 24]} />
            <meshBasicMaterial color={C.ink} fog={false} />
          </mesh>
          <Glow position={TARGET_PT} size={1.1} color={C.agent} opacity={0.7} />
        </>
      ) : null}
      {arrived > 0 ? (
        <group position={[X(1900), 0, 0.6]}>
          <mesh position={[0, 1.05, 0]} scale={[1, Math.max(0.001, arrived), 1]}>
            <boxGeometry args={[0.035, 2.1, 0.035]} />
            <meshBasicMaterial color={C.agent} transparent opacity={0.75} fog={false} />
          </mesh>
          <Glow position={[0, 0.02, 0]} size={0.9} color={C.agent} opacity={0.5 * arrived} />
          <Glow position={[0, 2.1, 0]} size={2.6 + 2 * Math.exp(-kArr / 5)} color={C.agent} opacity={0.6 + 0.4 * Math.exp(-kArr / 5)} />
          <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.2 + interpolate(kArr, [0, 12], [0, 1.1], clamp)}>
            <ringGeometry args={[0.92, 1, 64]} />
            <meshBasicMaterial color={C.agent} transparent opacity={0.8 * interpolate(kArr, [0, 12], [1, 0], clamp)} depthWrite={false} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

// ---------- 2D overlay ----------

const Chip: React.FC<{ readonly children: React.ReactNode; readonly style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      position: "absolute",
      transform: "translate(-50%, -100%)",
      whiteSpace: "nowrap",
      padding: "6px 12px",
      borderRadius: 9,
      background: "rgba(12,13,16,0.85)",
      border: `1.5px solid ${C.line}`,
      fontFamily: SANS,
      fontSize: 24,
      fontWeight: 600,
      color: C.ink,
      fontVariantNumeric: "tabular-nums",
      display: "flex",
      alignItems: "center",
      gap: 10,
      ...style,
    }}
  >
    {children}
  </div>
);

const FloatLabel: React.FC<{ readonly x: number; readonly y: number; readonly color: string; readonly opacity: number; readonly align?: "center" | "right"; readonly children: React.ReactNode }> = ({
  x,
  y,
  color,
  opacity,
  align = "center",
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: align === "center" ? "translate(-50%, -100%)" : "translate(-100%, -50%)",
      whiteSpace: "nowrap",
      fontFamily: SANS,
      fontSize: 26,
      fontWeight: 600,
      color,
      opacity,
      textShadow: "0 2px 14px rgba(0,0,0,0.95)",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {children}
  </div>
);

const Legend: React.FC<{ readonly opacity: number }> = ({ opacity }) => (
  <div style={{ position: "absolute", left: 96, top: 282, display: "flex", gap: 28, alignItems: "center", fontFamily: SANS, fontSize: 24, color: C.ink2, opacity }}>
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 14, height: 14, borderRadius: 7, background: C.ink, boxShadow: `0 0 10px ${C.ink}` }} />
      Sold
    </span>
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 14, height: 14, borderRadius: 7, border: `3px solid ${C.ink2}`, boxSizing: "border-box" }} />
      Listed
    </span>
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 18, height: 14, borderRadius: 3, background: C.agentSoft, borderTop: `2.5px solid ${C.agent}`, boxSizing: "border-box" }} />
      Price spread
    </span>
  </div>
);

export const S4Price: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = getCam(frame);
  const b = ease(frame, T.band, 12);
  const dim = interpolate(frame, [T.phaseB + 4, T.phaseB + 16], [1, 0.5], clamp);
  const sceneOpacity = Math.min(fadeIn(frame, 0, 6), fadeOut(frame, DUR - 6, 6));
  const landed = COMPS.filter((c) => frame >= c.at + FLY).length;

  const ticks = [];
  for (let p = AXIS_MIN; p <= AXIS_MAX; p += 200) {
    const s = project(cam, [X(p), 0, 0.35]);
    ticks.push(
      <div
        key={p}
        style={{
          position: "absolute",
          left: s.x,
          top: s.y + 20,
          transform: "translateX(-50%)",
          fontFamily: SANS,
          fontSize: 24,
          fontWeight: 500,
          color: C.ink2,
          whiteSpace: "nowrap",
          opacity: fadeIn(frame, T.axis + ((p - AXIS_MIN) / 800) * 12, 6) * interpolate(s.x, [100, 150, 1770, 1820], [0, 1, 1, 0], clamp),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {kr(p)}
      </div>,
    );
  }

  const gateK = frame - T.lock;
  const gateY = frame < T.floorDrop ? 1.7 : (1 - interpolate(frame, [T.floorDrop, T.lock], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) })) * 1.7;
  const gate = project(cam, [X(1400), GATE_H + gateY, 0.35]);
  const locked = gateK >= 0 ? 1 : 0;
  const badgePop = gateK >= 0 ? 1 + 0.2 * Math.exp(-gateK / 3) : 1;

  const bandTop = project(cam, [X(1800), BAND_H, -0.25]);
  const med = project(cam, [X(1750), MEDIAN_H, 0.3]);
  const tgt = project(cam, TARGET_PT);
  const lst = project(cam, [X(1900), 2.1, 0.6]);
  const prog = arrowProg(frame);
  const tgtOn = prog >= TARGET_U ? 1 : 0;
  const lstOn = frame >= T.arrowEnd ? fadeIn(frame, T.arrowEnd, 4) : 0;
  const labelsOut = interpolate(frame, [T.arrow, T.arrow + 8], [1, 0.0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <Stage fog={[14, 36]}>
          <CameraRig cam={cam} />
          <Grid />
          <Dust frame={frame} />
          <Glow position={[0.5, 1.2, -6]} size={16} color={C.agentDeep} opacity={0.22} />
          <Axis frame={frame} />
          <Histogram frame={frame} dim={interpolate(dim, [0.5, 1], [0.6, 1])} />
          <Band frame={frame} b={b} />
          <Median frame={frame} />
          <Dots frame={frame} dim={dim} />
          <FloorGate frame={frame} />
          <Arrow frame={frame} />
        </Stage>

        <AbsoluteFill style={{ fontFamily: SANS }}>
          <MarketStrip frame={frame} landed={landed} dim={interpolate(frame, [T.phaseB, T.phaseB + 14], [1, 0.8], clamp)} />
          <Legend opacity={fadeIn(frame, 12, 8) * interpolate(frame, [T.phaseB, T.phaseB + 10], [1, 0], clamp)} />

          {ticks}

          {COMPS.filter((c) => TAGGED[c.i]).map((c) => {
            const s = project(cam, c.pos);
            const top = project(cam, [c.pos[0], TAG_H, c.pos[2]]);
            const t0 = c.at + FLY;
            const op = interpolate(frame, [t0, t0 + 4, T.phaseB - 2, T.phaseB + 6], [0, 1, 1, 0], clamp);
            if (op <= 0) return null;
            return (
              <React.Fragment key={c.i}>
              <div style={{ position: "absolute", left: s.x - 1, top: top.y, width: 2, height: Math.max(0, s.y - top.y - 14) * ease(frame, t0, 6), background: C.lineStrong, opacity: op }} />
              <Chip style={{ left: top.x, top: top.y, opacity: op }}>
                <span style={{ fontFamily: MONO, fontSize: 23, color: C.ink2, fontWeight: 400 }}>{c.src}</span>
                <span style={{ color: C.ink2, fontWeight: 500 }}>· {TAGGED[c.i]}</span>
                <span>{kr(c.p)}</span>
              </Chip>
              </React.Fragment>
            );
          })}

          <FloatLabel x={med.x - 18} y={med.y} color={C.ink} align="right" opacity={fadeIn(frame, T.median + 6, 6) * (0.4 + 0.6 * labelsOut)}>
            Median {kr(1750)}
          </FloatLabel>
          {b > 0.05 ? (
            <FloatLabel x={bandTop.x} y={bandTop.y - 14} color={C.agent} opacity={fadeIn(frame, T.band + 6, 6) * labelsOut}>
              Market value · {kr(1700).slice(0, -3)}–{kr(1900)}
            </FloatLabel>
          ) : null}

          {frame >= T.floorDrop ? (
            <Chip
              style={{
                left: gate.x,
                top: gate.y - 18,
                opacity: fadeIn(frame, T.floorDrop, 4),
                transform: `translate(-50%, -100%) scale(${badgePop})`,
                borderColor: locked ? C.lineStrong : C.line,
              }}
            >
              <LockGlyph size={22} closed={locked} color={locked ? C.ink : C.ink2} />
              <span style={{ color: C.ink2, fontWeight: 500 }}>Floor</span>
              <span style={{ color: C.ink2 }}>{kr(1400)}</span>
            </Chip>
          ) : null}

          {tgtOn ? (
            <Chip style={{ left: tgt.x - 24, top: tgt.y - 22, transform: "translate(-100%, -50%)" }}>
              <span style={{ color: C.ink2, fontWeight: 500 }}>Target</span>
              <span>{kr(1700)}</span>
            </Chip>
          ) : null}

          {lstOn > 0 ? (
            <Chip
              style={{
                left: lst.x,
                top: lst.y - 34,
                opacity: lstOn,
                background: "rgba(30,41,73,0.92)",
                borderColor: "#2b3a66",
                transform: `translate(-50%, -100%) scale(${1 + 0.12 * Math.exp(-(frame - T.arrowEnd) / 4)})`,
              }}
            >
              <span style={{ color: C.agent, fontWeight: 500 }}>List price</span>
              <span style={{ color: C.agent, fontWeight: 700 }}>{kr(1900)}</span>
            </Chip>
          ) : null}

          <PriceCheckCard frame={frame} T={T} left={1250} top={300} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
