import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { AgentCube } from "../three/AgentCube";
import { Glow } from "../three/Glow";
import { Stage } from "../three/Stage";
import { C, MONO, SANS, kr } from "../theme";
import { clamp, ease, fadeIn, fadeOut } from "../ui/anim";
import { AgentMark, Card, Money, Status } from "../ui/kit";
import { CameraRig, type Cam } from "./s4-5/cam";
import { ChairTile } from "./s4-5/glyphs";

// Scene 5 · List (18.3–22.4 s, 123 frames). Frame 0 = start of this scene.
// "Then it lists everywhere. Even where there's no API."
const DUR = 123;
const T = {
  burst: 10, // riser peaks into the burst
  ebayLive: 36,
  typeStart: 30,
  typeEnd: 60,
  priceStart: 62,
  priceEnd: 68,
  finnLive: 74,
  tiseTurn: 44,
  noApi: 84, // "no API." 21.09 s
};

const CARD_W = 500;
const CARD_H = 548;
const POS = [
  { x: -568, y: -82, z: -70, ry: 16, start: T.burst },
  { x: 0, y: -82, z: 30, ry: 0, start: T.burst + 2 },
  { x: 568, y: -82, z: -70, ry: -16, start: T.burst + 4 },
];

const FINN_TITLE = "HAY About A Chair AAC22, eik – pent brukt";

// ---------- 3D background ----------

const Grid: React.FC = () => {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(60, 60, C.line, C.line);
    const m = g.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.5;
    m.depthWrite = false;
    return g;
  }, []);
  return <primitive object={grid} position={[0, -2.4, 0]} />;
};

const Sparks: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const n = 180;
  const dirs = useMemo(() => {
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const a = random(`a${i}`) * Math.PI * 2;
      const zf = (random(`z${i}`) - 0.5) * 0.9;
      const v = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.7, zf).normalize();
      v.multiplyScalar(0.5 + random(`s${i}`) * 1.0);
      out.push(v);
    }
    return out;
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, []);
  const k = frame - T.burst;
  if (k < 0) return null;
  const d = interpolate(k, [0, 40], [0, 9], { ...clamp, easing: Easing.out(Easing.cubic) });
  const attr = geo.getAttribute("position") as THREE.BufferAttribute;
  dirs.forEach((v, i) => attr.setXYZ(i, v.x * d, v.y * d, v.z * d));
  attr.needsUpdate = true;
  return (
    <points geometry={geo}>
      <pointsMaterial color={C.agent} size={0.05} sizeAttenuation transparent opacity={interpolate(k, [0, 6, 40], [0, 1, 0], clamp)} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

const Dust: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const geo = useMemo(() => {
    const n = 220;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = -12 + random(`ux${i}`) * 24;
      arr[i * 3 + 1] = -2.3 + random(`uy${i}`) * 8;
      arr[i * 3 + 2] = -16 + random(`uz${i}`) * 18;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} position={[frame * 0.003, frame * 0.002, frame * 0.01]}>
      <pointsMaterial color={C.ink2} size={0.035} sizeAttenuation transparent opacity={0.4} depthWrite={false} />
    </points>
  );
};

const Burst: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const k = frame - T.burst;
  // Cube: charges with the riser, bursts, then recedes into a backlight.
  const charge = interpolate(frame, [0, T.burst], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const recede = ease(frame, T.burst + 2, 40);
  const shake = k < 0 ? Math.sin(frame * 3.1) * 0.015 * charge : 0;
  const scale = k < 0 ? 0.55 + 0.2 * charge : 0.75 + 0.25 * Math.exp(-k / 3);
  const z = -recede * 5;
  const y = recede * 0.35;
  return (
    <group>
      <group scale={scale}>
        <AgentCube position={[shake, y, z]} size={0.9} rotation={[0.5 + frame * 0.01, 0.6 + frame * 0.04 + charge * 1.2, 0.2]} glow={1.1 + charge * 0.7} />
      </group>
      <Glow position={[0, y, z - 0.3]} size={3.2 + charge * 2 + recede * 6} color={C.agent} opacity={0.45 + charge * 0.25 - recede * 0.2} />
      <Glow position={[0, y, z - 1]} size={12} color={C.agentDeep} opacity={0.35 + recede * 0.2} />
      {k >= 0 ? (
        <>
          <Glow position={[0, 0, 0.2]} size={1.5 + k * 0.35} color={C.ink} opacity={interpolate(k, [0, 10], [0.9, 0], clamp)} />
          <mesh scale={0.4 + interpolate(k, [0, 26], [0, 3.6], { ...clamp, easing: Easing.out(Easing.cubic) })}>
            <ringGeometry args={[0.985, 1, 128]} />
            <meshBasicMaterial color={C.agent} transparent opacity={interpolate(k, [0, 26], [0.9, 0], clamp)} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh scale={0.3 + interpolate(k, [0, 34], [0, 2.4], { ...clamp, easing: Easing.out(Easing.cubic) })}>
            <ringGeometry args={[0.99, 1, 128]} />
            <meshBasicMaterial color={C.ink} transparent opacity={interpolate(k, [2, 34], [0.5, 0], clamp)} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
      ) : null}
    </group>
  );
};

// ---------- 2D cards ----------

const Pill: React.FC<{ readonly children: React.ReactNode; readonly hi?: number }> = ({ children, hi = 0 }) => (
  <span
    style={{
      fontFamily: MONO,
      fontSize: 22,
      letterSpacing: "0.05em",
      padding: "5px 11px",
      borderRadius: 8,
      display: "inline-block",
      background: hi > 0.5 ? C.mark : C.sunken,
      color: hi > 0.5 ? C.onMark : C.ink,
      border: `1.5px solid ${hi > 0.5 ? C.mark : C.line}`,
      transform: `scale(${1 + 0.18 * Math.max(0, hi - 0.5) * 2 * (hi < 1 ? 1 : 0)})`,
      boxShadow: hi > 0.5 ? `0 0 ${26 * hi}px rgba(237,216,84,${0.45 * hi})` : undefined,
    }}
  >
    {children}
  </span>
);

const StatusSwap: React.FC<{ readonly frame: number; readonly at: number; readonly kind: "forSale" | "yourTurn" }> = ({ frame, at, kind }) => {
  const on = frame >= at;
  const pop = on ? 1 + 0.22 * Math.exp(-(frame - at) / 3) : 1;
  return (
    <span style={{ display: "inline-block", transform: `scale(${pop})`, transformOrigin: "100% 50%", opacity: on ? fadeIn(frame, at, 4) : 1 }}>
      {on ? <Status kind={kind} size={25} /> : <Status kind="draft" text="Draft" size={25} />}
    </span>
  );
};

const Header: React.FC<{ readonly platform: string; readonly route: string; readonly hi?: number; readonly status: React.ReactNode }> = ({
  platform,
  route,
  hi,
  status,
}) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
    <div style={{ display: "flex", gap: 8 }}>
      <Pill>{platform}</Pill>
      <Pill hi={hi}>{route}</Pill>
    </div>
    {status}
  </div>
);

const Title: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 600, lineHeight: 1.2, color: C.ink, marginTop: 18, letterSpacing: "-0.01em" }}>
    {children}
  </div>
);

const EbayCard: React.FC<{ readonly frame: number }> = ({ frame }) => (
  <>
    <Header platform="eBay" route="API" status={<StatusSwap frame={frame} at={T.ebayLive} kind="forSale" />} />
    <ChairTile width={CARD_W - 52} height={236} draw={ease(frame, T.burst + 6, 26)} />
    <Title>HAY About A Chair AAC22, Oak Dining Chair</Title>
    <div style={{ marginTop: 8 }}>
      <Money size={42}>{kr(1900)}</Money>
    </div>
  </>
);

const Field: React.FC<{ readonly label: string; readonly children: React.ReactNode; readonly active: boolean; readonly lines?: number }> = ({
  label,
  children,
  active,
  lines = 1,
}) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontFamily: SANS, fontSize: 24, color: C.ink2, marginBottom: 6 }}>{label}</div>
    <div
      style={{
        minHeight: lines * 31 + 18,
        padding: "8px 14px",
        borderRadius: 9,
        background: C.sunken,
        border: `1.5px solid ${active ? C.agent : C.line}`,
        boxShadow: active ? `0 0 0 3px ${C.agentSoft}` : undefined,
        fontFamily: SANS,
        fontSize: 25,
        lineHeight: "31px",
        color: C.ink,
      }}
    >
      {children}
    </div>
  </div>
);

const Caret: React.FC<{ readonly frame: number; readonly on: boolean }> = ({ frame, on }) =>
  on ? <span style={{ display: "inline-block", width: 2.5, height: 27, marginLeft: 2, verticalAlign: "-5px", background: C.agent, opacity: frame % 14 < 8 ? 1 : 0 }} /> : null;

const FinnCard: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const n = Math.floor(interpolate(frame, [T.typeStart, T.typeEnd], [0, FINN_TITLE.length], clamp));
  const priceText = "1 900";
  const pn = Math.floor(interpolate(frame, [T.priceStart, T.priceEnd], [0, priceText.length], clamp));
  const typingTitle = frame >= T.typeStart - 4 && frame < T.priceStart;
  const typingPrice = frame >= T.priceStart && frame < T.finnLive;
  const live = frame >= T.finnLive;
  return (
    <>
      <Header platform="FINN" route="BROWSER" hi={hiAt(frame, 0)} status={<StatusSwap frame={frame} at={T.finnLive} kind="forSale" />} />
      <div style={{ borderRadius: 12, border: `1.5px solid ${C.lineStrong}`, overflow: "hidden", background: C.ground }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: C.sunken, borderBottom: `1.5px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 22, letterSpacing: "0.05em", color: C.ink2 }}>
            <AgentMark size={11} />
            LIVE BROWSER · KERNEL
          </div>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: live ? C.ink2 : C.agent, boxShadow: live ? undefined : `0 0 10px ${C.agent}`, opacity: live ? 0.6 : frame % 20 < 12 ? 1 : 0.35 }} />
        </div>
        <div style={{ padding: "14px 16px 4px", display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <Field label="Tittel" active={typingTitle} lines={2}>
              {FINN_TITLE.slice(0, n)}
              <Caret frame={frame} on={typingTitle} />
            </Field>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Field label="Pris" active={typingPrice}>
                  {priceText.slice(0, pn)}
                  {pn === priceText.length ? " kr" : ""}
                  <Caret frame={frame} on={typingPrice} />
                </Field>
              </div>
              <div style={{ marginBottom: 12 }}>
                <ChairTile width={104} height={80} radius={9} draw={ease(frame, T.burst + 8, 24)} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ opacity: fadeIn(frame, T.priceEnd, 6) }}>
          <Money size={42}>{kr(1900)}</Money>
        </span>
        <span style={{ fontFamily: SANS, fontSize: 24, color: C.ink2, opacity: live ? fadeIn(frame, T.finnLive, 6) : 0 }}>Published on finn.no</span>
      </div>
    </>
  );
};

const TiseCard: React.FC<{ readonly frame: number }> = ({ frame }) => (
  <>
    <Header platform="Tise" route="PHONE" hi={hiAt(frame, 1)} status={<StatusSwap frame={frame} at={T.tiseTurn} kind="yourTurn" />} />
    <ChairTile width={CARD_W - 52} height={236} draw={ease(frame, T.burst + 10, 26)} />
    <Title>HAY AAC22 stol i eik</Title>
    <div style={{ marginTop: 8 }}>
      <Money size={42}>{kr(1900)}</Money>
    </div>
    <div style={{ marginTop: 10, fontFamily: SANS, fontSize: 24, color: C.ink2, lineHeight: 1.3, opacity: fadeIn(frame, T.tiseTurn + 4, 8) }}>
      Open Tise and paste.
      <br />
      About 20 seconds.
    </div>
  </>
);

// "no API": the BROWSER and PHONE route tags light up in the highlighter, one after the other.
const hiAt = (frame: number, i: number) => {
  const s = T.noApi + i * 4;
  if (frame < s) return 0;
  const k = frame - s;
  // > 0.5 = highlighted; the pop happens while it settles towards 1.
  return Math.min(1, 0.51 + k / 10);
};

export const S5List: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneOpacity = Math.min(fadeIn(frame, 0, 6), fadeOut(frame, DUR - 6, 6));

  const t = frame / (DUR - 1);
  const cam: Cam = {
    pos: [Math.sin(t * 1.4 - 0.7) * 0.9, 0.35 + t * 0.25, 8.2 - t * 0.8],
    tgt: [0, 0.1, 0],
    fov: 35,
  };
  // CSS world follows the same drift.
  const ry = interpolate(t, [0, 1], [-4, 4]);
  const rx = interpolate(t, [0, 1], [3, 1]);
  const push = interpolate(frame, [0, DUR], [-40, 50]);
  const noApi = interpolate(frame, [T.noApi - 4, T.noApi + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  const cards = [EbayCard, FinnCard, TiseCard];

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <Stage fog={[10, 30]}>
          <CameraRig cam={cam} />
          <Grid />
          <Dust frame={frame} />
          <Burst frame={frame} />
          <Sparks frame={frame} />
        </Stage>

        <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "50% 45%" }}>
          <AbsoluteFill style={{ transformStyle: "preserve-3d", transform: `translateZ(${push}px) rotateX(${rx}deg) rotateY(${ry}deg)` }}>
            {POS.map((p, i) => {
              const Body = cards[i];
              const pr = (f: number) => spring({ frame: f - p.start, fps, config: { damping: 16, stiffness: 110, mass: 0.75 } });
              const at = (q: number) => {
                const x = p.x * q;
                const y = p.y * q;
                const z = -900 + (p.z + 900) * q + (i === 0 ? -60 : 30) * noApi;
                const r = p.ry + (1 - q) * (i === 1 ? 0 : i === 0 ? -70 : 70);
                const rxx = (1 - q) * 35;
                const s = 0.35 + 0.65 * q;
                return `translate3d(${x}px, ${y}px, ${z}px) rotateY(${r}deg) rotateX(${rxx}deg) scale(${s})`;
              };
              const q = pr(frame);
              if (frame < p.start) return null;
              const op = interpolate(q, [0, 0.25], [0, 1], clamp) * (i === 0 ? 1 - 0.45 * noApi : 1);
              const trails = [3, 6].map((lag, j) => {
                const ql = pr(frame - lag);
                const vis = interpolate(q, [0.5, 0.9], [1, 0], clamp) * (j === 0 ? 0.45 : 0.22);
                if (vis <= 0.01 || frame - lag < p.start) return null;
                return (
                  <div
                    key={lag}
                    style={{
                      position: "absolute",
                      left: 960 - CARD_W / 2,
                      top: 540 - CARD_H / 2,
                      width: CARD_W,
                      height: CARD_H,
                      borderRadius: 18,
                      border: `2px solid ${C.agent}`,
                      boxShadow: `0 0 24px ${C.agentDeep}`,
                      opacity: vis,
                      transform: at(ql),
                    }}
                  />
                );
              });
              return (
                <React.Fragment key={i}>
                  {trails}
                  <div style={{ position: "absolute", left: 960 - CARD_W / 2, top: 540 - CARD_H / 2, transform: at(q), opacity: op }}>
                    <Card width={CARD_W} elevated style={{ height: CARD_H, boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
                      <Body frame={frame} />
                      {/* arrival flash */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 18,
                          background: `radial-gradient(ellipse at 50% 0%, ${C.agent}55, transparent 70%)`,
                          opacity: interpolate(frame, [p.start + 8, p.start + 22], [1, 0], clamp),
                          pointerEvents: "none",
                        }}
                      />
                    </Card>
                  </div>
                </React.Fragment>
              );
            })}
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
