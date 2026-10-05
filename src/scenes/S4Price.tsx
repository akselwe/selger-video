import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { Glow } from "../three/Glow";
import { Stage } from "../three/Stage";
import { C, SANS, kr } from "../theme";
import { clamp, ease, fadeIn, fadeOut } from "../ui/anim";
import { CameraRig, type Cam } from "./s4-5/cam";
import { LockGlyph } from "./s4-5/glyphs";

// Scene 4 · Price (13.0–18.3 s, 159 frames). Frame 0 = start of this scene.
// "It checks what it's really worth. You set the floor. It aims higher."
// One calm chart: a price-distribution curve, the market-value band, the floor, the list price.
const DUR = 159;
const T = {
  axis: 2,
  dots: 6,
  curve: 10, // "It checks…" (f15)
  band: 44, // "really worth" (f44–60)
  floorLabel: 80, // "You set the floor" (f78)
  floorDrop: 84,
  lock: 98, // lock sound at 16.25 s
  glide: 119, // "It aims higher" (f119)
  glideEnd: 140,
};

// 23 comparables (10 sold, avg 1 720 kr; median 1 750 kr).
const COMPS: { p: number; sold: boolean }[] = [
  [1450, 0], [1500, 0], [1550, 1], [1600, 1], [1600, 0], [1650, 1], [1650, 0], [1700, 1], [1700, 1], [1700, 0],
  [1750, 1], [1750, 1], [1750, 0], [1800, 1], [1800, 1], [1800, 0], [1850, 0], [1900, 1], [1900, 0], [1950, 0],
  [1950, 0], [2000, 0], [2050, 0],
].map(([p, s]) => ({ p, sold: s === 1 }));

// ---- chart geometry (screen px) ----
const P0 = 1300;
const P1 = 2200;
const XL = 160;
const XR = 1760;
const BASE = 760; // baseline y
const TOP = 410; // top of the vertical rules
const ROW = 372; // label row (vertical centre)
const H = 290; // curve peak height
const px = (p: number) => XL + ((p - P0) / (P1 - P0)) * (XR - XL);

const BW = 80; // kernel bandwidth in kr
const dens = (p: number) => COMPS.reduce((s, c) => s + Math.exp(-0.5 * ((p - c.p) / BW) ** 2), 0);
const MAXD = (() => {
  let m = 0;
  for (let p = P0; p <= P1; p += 5) m = Math.max(m, dens(p));
  return m;
})();
const cy = (p: number) => BASE - (dens(p) / MAXD) * H;
const pathBetween = (a: number, b: number) => {
  const pts: string[] = [];
  for (let p = a; p <= b + 0.01; p += 5) pts.push(`${pts.length ? "L" : "M"}${px(p).toFixed(1)} ${cy(p).toFixed(1)}`);
  return pts.join(" ");
};
const CURVE = pathBetween(P0, P1);
const AREA = `${CURVE} L${XR} ${BASE} L${XL} ${BASE} Z`;

// ---------- quiet 3D backdrop ----------
const Dust: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const geo = useMemo(() => {
    const n = 200;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = -10 + random(`px${i}`) * 20;
      arr[i * 3 + 1] = -5 + random(`py${i}`) * 10;
      arr[i * 3 + 2] = -14 + random(`pz${i}`) * 14;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} position={[-frame * 0.006, frame * 0.002, 0]}>
      <pointsMaterial color={C.ink2} size={0.03} sizeAttenuation transparent opacity={0.35} depthWrite={false} />
    </points>
  );
};

// ---------- 2D bits ----------
const Lbl: React.FC<{ readonly x: number; readonly y: number; readonly opacity: number; readonly children: React.ReactNode; readonly style?: React.CSSProperties }> = ({
  x,
  y,
  opacity,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: "translateY(-50%)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      whiteSpace: "nowrap",
      fontFamily: SANS,
      fontSize: 26,
      fontWeight: 600,
      color: C.ink,
      fontVariantNumeric: "tabular-nums",
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);

const Stat: React.FC<{ readonly x: number; readonly value: string; readonly label: string; readonly opacity: number; readonly rise: number }> = ({
  x,
  value,
  label,
  opacity,
  rise,
}) => (
  <div style={{ position: "absolute", left: x, top: 118, opacity, transform: `translateY(${rise}px)`, fontFamily: SANS }}>
    <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    <div style={{ fontSize: 26, fontWeight: 500, color: C.ink2, marginTop: 12 }}>{label}</div>
  </div>
);

export const S4Price: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneOpacity = Math.min(fadeIn(frame, 0, 6), fadeOut(frame, DUR - 6, 6));

  // Camera: a quick settle, then a slow continuous drift (3D backdrop and 2D chart move together).
  const settle = ease(frame, 0, 22);
  const drift = frame / DUR;
  const cam: Cam = { pos: [0.6 - drift * 1.2, 0.2 + drift * 0.3, 8.6 - settle * 0.6 - drift * 0.5], tgt: [0, 0, -4], fov: 35 };
  const chartTf = `perspective(2200px) rotateX(${7 - settle * 3 - drift * 1.5}deg) rotateY(${-3.5 + drift * 6}deg) scale(${1.06 - settle * 0.06 + drift * 0.025}) translateX(${10 - drift * 20}px)`;

  // Build-up.
  const axisOn = ease(frame, T.axis, 14);
  const draw = interpolate(frame, [T.curve, T.curve + 30], [0, 1], { ...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1) });
  const drawX = XL + draw * (XR - XL);
  const band = ease(frame, T.band, 14);
  const glide = interpolate(frame, [T.glide, T.glideEnd], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1) });
  const gp = 1400 + glide * 500; // marker price
  const gliding = frame >= T.glide;
  const curveDim = interpolate(frame, [T.glide, T.glide + 8], [1, 0.5], clamp);
  const landed = COMPS.filter((_, i) => frame >= T.dots + i * 1.1 + 6).length;
  const avg = Math.round(interpolate(frame, [18, 40], [0, 1720], { ...clamp, easing: Easing.out(Easing.cubic) }) / 10) * 10;

  // Floor.
  const floorLbl = fadeIn(frame, T.floorLabel, 6);
  const drop = interpolate(frame, [T.floorDrop, T.lock], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const k = frame - T.lock;
  const locked = k >= 0 ? 1 : 0;
  const lockPop = k >= 0 ? 1 + 0.35 * Math.exp(-k / 3) : 1;
  const ring = k >= 0 ? interpolate(k, [0, 16], [0, 1], clamp) : 0;
  const below = k >= 0 ? ease(frame, T.lock, 12) : 0;

  // Target and list.
  const targetOn = gp >= 1700 ? 1 : 0;
  const targetFade = interpolate(gp, [1700, 1780], [0, 1], clamp);
  const kList = frame - T.glideEnd;
  const listOn = kList >= 0 ? ease(frame, T.glideEnd, 10) : 0;
  const listPulse = kList >= 0 ? Math.exp(-kList / 6) : 0;

  // Rug plot of comparables along the baseline.
  const stacks: Record<number, number> = {};
  const dots = COMPS.map((c, i) => {
    const s = stacks[c.p] ?? 0;
    stacks[c.p] = s + 1;
    const at = T.dots + i * 1.1;
    const e = interpolate(frame, [at, at + 7], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
    const y = BASE - 14 - s * 15;
    return (
      <circle
        key={i}
        cx={px(c.p)}
        cy={y - (1 - e) * 24}
        r={5.5}
        fill={c.sold ? C.ink2 : "none"}
        stroke={C.ink2}
        strokeWidth={2}
        opacity={interpolate(e, [0, 0.3], [0, 0.75], clamp)}
      />
    );
  });

  const ticks = [1400, 1700, 1900, 2100];
  const mx = px(gp);
  const my = cy(gp);

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <Stage fog={[8, 24]}>
          <CameraRig cam={cam} />
          <Dust frame={frame} />
          <Glow position={[0, -0.6, -5]} size={14} color={C.agentDeep} opacity={0.3 + band * 0.12} />
          <Glow position={[1.5, -1.2, -3]} size={6} color={C.agent} opacity={0.08 + listPulse * 0.1} />
        </Stage>

        {/* Supporting numbers */}
        <Stat x={XL} value={String(landed)} label="similar listings" opacity={fadeIn(frame, 4, 8)} rise={(1 - ease(frame, 4, 12)) * 18} />
        <Stat x={XL + 330} value={kr(avg)} label="average sold price" opacity={fadeIn(frame, 12, 8)} rise={(1 - ease(frame, 12, 12)) * 18} />

        <AbsoluteFill style={{ transform: chartTf, transformOrigin: "50% 60%" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="s4area" x1="0" y1={BASE - H} x2="0" y2={BASE} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={C.agent} stopOpacity={0.3} />
                <stop offset="1" stopColor={C.agent} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="s4band" x1="0" y1={BASE - H} x2="0" y2={BASE} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={C.agent} stopOpacity={0.5} />
                <stop offset="1" stopColor={C.agent} stopOpacity={0.14} />
              </linearGradient>
              <filter id="s4glow" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <clipPath id="s4under">
                <path d={AREA} />
              </clipPath>
              <clipPath id="s4reveal">
                <rect x={XL - 10} y={0} width={Math.max(0, drawX - XL + 10)} height={1080} />
              </clipPath>
            </defs>

            {/* Market-value band */}
            <path d={`${pathBetween(1700, 1900)} L${px(1900)} ${BASE} L${px(1700)} ${BASE} Z`} fill="url(#s4band)" opacity={band} />

            {/* Area + curve, revealed left to right */}
            <g clipPath="url(#s4reveal)" opacity={curveDim}>
              <path d={AREA} fill="url(#s4area)" />
              <path d={CURVE} fill="none" stroke={C.agent} strokeWidth={8} opacity={0.55} filter="url(#s4glow)" />
              <path d={CURVE} fill="none" stroke={C.agent} strokeWidth={3} strokeLinejoin="round" />
            </g>
            {draw > 0 && draw < 1 ? (
              <>
                <circle cx={drawX} cy={cy(P0 + draw * (P1 - P0))} r={14} fill={C.agent} opacity={0.35} filter="url(#s4glow)" />
                <circle cx={drawX} cy={cy(P0 + draw * (P1 - P0))} r={5} fill={C.ink} />
              </>
            ) : null}

            {/* Below the floor: quietly dimmed once locked */}
            <rect x={XL - 10} y={TOP} width={px(1400) - XL + 10} height={BASE - TOP + 2} fill={C.void} opacity={0.6 * below} clipPath="url(#s4under)" />

            {/* Baseline + ticks */}
            <line x1={XL} y1={BASE} x2={XL + (XR - XL) * axisOn} y2={BASE} stroke={C.lineStrong} strokeWidth={1.5} />
            {ticks.map((p) => (
              <line key={p} x1={px(p)} y1={BASE} x2={px(p)} y2={BASE + 10} stroke={C.lineStrong} strokeWidth={1.5} opacity={fadeIn(frame, T.axis + 6, 6)} />
            ))}

            {dots}

            {/* Floor rule: drops in, locks */}
            {frame >= T.floorDrop ? (
              <g opacity={fadeIn(frame, T.floorDrop, 3)}>
                <line x1={px(1400)} y1={TOP} x2={px(1400)} y2={TOP + (BASE - TOP) * drop} stroke={C.ink2} strokeWidth={2} />
                {drop < 1 ? <circle cx={px(1400)} cy={TOP + (BASE - TOP) * drop} r={4} fill={C.ink} /> : null}
              </g>
            ) : null}
            {k >= 0 ? (
              <>
                <circle cx={px(1400)} cy={BASE} r={6 + ring * 34} fill="none" stroke={C.ink} strokeWidth={2} opacity={0.8 * (1 - ring)} />
                <circle cx={px(1400)} cy={BASE} r={18} fill={C.ink} opacity={0.5 * Math.exp(-k / 4)} filter="url(#s4glow)" />
              </>
            ) : null}

            {/* Agent trail + marker */}
            {gliding ? (
              <>
                <path d={pathBetween(1400, gp)} fill="none" stroke={C.agent} strokeWidth={10} opacity={0.6} filter="url(#s4glow)" />
                <path d={pathBetween(1400, gp)} fill="none" stroke={C.agent} strokeWidth={4} strokeLinecap="round" />
              </>
            ) : null}
            {targetOn ? (
              <>
                <line x1={px(1700)} y1={TOP} x2={px(1700)} y2={BASE} stroke={C.ink2} strokeWidth={1.5} strokeDasharray="4 7" opacity={0.8 * targetFade} />
                <circle cx={px(1700)} cy={cy(1700)} r={6} fill={C.ink} opacity={targetFade} />
              </>
            ) : null}
            {listOn > 0 ? (
              <line x1={px(1900)} y1={BASE} x2={px(1900)} y2={BASE - (BASE - TOP) * listOn} stroke={C.agent} strokeWidth={2.5} />
            ) : null}
            {gliding ? (
              <>
                <circle cx={mx} cy={my} r={22 + listPulse * 14} fill={C.agent} opacity={0.45} filter="url(#s4glow)" />
                <circle cx={mx} cy={my} r={8} fill={C.agent} />
                <circle cx={mx} cy={my} r={3.5} fill={C.ink} />
              </>
            ) : null}
          </svg>

          {/* Axis labels: only four */}
          {ticks.map((p) => (
            <div
              key={p}
              style={{
                position: "absolute",
                left: px(p),
                top: BASE + 34,
                transform: "translate(-50%, -50%)",
                fontFamily: SANS,
                fontSize: 26,
                fontWeight: 500,
                color: C.ink2,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                opacity: fadeIn(frame, T.axis + 6, 8),
              }}
            >
              {kr(p)}
            </div>
          ))}

          {/* Band label sits inside the band, above the dots */}
          <Lbl x={px(1700) + 18} y={BASE - 96} opacity={fadeIn(frame, T.band + 6, 8)} style={{ color: C.ink }}>
            Market value
          </Lbl>

          {/* Label row: floor · target · list, each starting at its own rule */}
          <Lbl x={px(1400) - 11} y={ROW} opacity={floorLbl} style={{ color: C.ink2, fontWeight: 500 }}>
            <span style={{ display: "inline-block", transform: `scale(${lockPop})` }}>
              <LockGlyph size={22} closed={locked} color={locked ? C.ink : C.ink2} />
            </span>
            <span>
              <span style={{ color: C.ink, fontWeight: 600 }}>Floor {kr(1400)}</span> · private
            </span>
          </Lbl>
          <Lbl x={px(1700) - 2} y={ROW} opacity={targetFade} style={{ color: C.ink2, fontWeight: 500 }}>
            Target <span style={{ color: C.ink, fontWeight: 600 }}>{kr(1700)}</span>
          </Lbl>
          <Lbl x={px(1900) - 2} y={ROW} opacity={listOn} style={{ color: C.agent, transform: `translateY(-50%) scale(${1 + 0.06 * listPulse})`, transformOrigin: "0% 50%" }}>
            List <span style={{ fontWeight: 700 }}>{kr(1900)}</span>
          </Lbl>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
