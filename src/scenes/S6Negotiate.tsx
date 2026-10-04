import { Line } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { AgentCube } from "../three/AgentCube";
import { Glow } from "../three/Glow";
import { NorwayTerrain, geo as mapGeo, surface } from "../three/norway";
import { Stage } from "../three/Stage";
import { C, MONO, SANS, kr } from "../theme";
import { clamp, ease, easeInOut, fadeIn, fadeOut, pop } from "../ui/anim";
import { AgentMark, Card, Label, Status, Tag } from "../ui/kit";

// Scene 6: Teo negotiates with buyers all over Norway, on a 3D map.
// Frame 0 = 22.4 s in the full video (438 frames, ends at 37.0 s).
const F = (abs: number) => Math.round((abs - 22.4) * 30);

// ---------- Geography (shared terrain module) ----------
const geo = mapGeo;
const LAND_H = 0.0; // houses now stand on the real terrain via surface()

type Place = { name: string; lon: number; lat: number };
const OSLO: Place = { name: "Oslo", lon: 10.75, lat: 59.91 };

type Buyer = {
  id: string;
  name: string;
  platform: "FINN" | "eBay" | "Email";
  city: Place;
  appear: number; // local frame the house lights up
};

const BUYERS: Buyer[] = [
  { id: "ola", name: "Ola N.", platform: "FINN", city: { name: "Bergen", lon: 5.32, lat: 60.39 }, appear: F(22.75) },
  { id: "mike", name: "Mike R.", platform: "eBay", city: { name: "Stavanger", lon: 5.73, lat: 58.97 }, appear: F(23.2) },
  { id: "emma", name: "Emma S.", platform: "Email", city: { name: "Trondheim", lon: 10.4, lat: 63.43 }, appear: F(23.6) },
  { id: "jonas", name: "Jonas B.", platform: "FINN", city: { name: "Tromsø", lon: 18.96, lat: 69.65 }, appear: F(24.0) },
];

// People watching the listing elsewhere: faint pulses that make the country feel alive.
const WATCHERS: Place[] = [
  { name: "Kristiansand", lon: 8.0, lat: 58.15 },
  { name: "Ålesund", lon: 6.15, lat: 62.47 },
  { name: "Lillehammer", lon: 10.47, lat: 61.11 },
  { name: "Hamar", lon: 11.07, lat: 60.79 },
  { name: "Drammen", lon: 10.2, lat: 59.74 },
  { name: "Fredrikstad", lon: 10.93, lat: 59.22 },
  { name: "Bodø", lon: 14.4, lat: 67.28 },
  { name: "Narvik", lon: 17.43, lat: 68.44 },
  { name: "Alta", lon: 23.27, lat: 69.97 },
  { name: "Molde", lon: 7.16, lat: 62.74 },
  { name: "Haugesund", lon: 5.27, lat: 59.41 },
  { name: "Tønsberg", lon: 10.41, lat: 59.27 },
  { name: "Gjøvik", lon: 10.69, lat: 60.8 },
  { name: "Mo i Rana", lon: 14.14, lat: 66.31 },
];

const SCAM_FROM = geo(3.5, 58.6, 0.0); // out at sea, off the south-west coast
const SCAM_IN = F(33.3);
const SCAM_SHATTER = F(35.0);

const osloPos = () => surface(OSLO.lon, OSLO.lat);
const AGENT_Y = 0.42;
const agentPos = () => osloPos().add(new THREE.Vector3(0, AGENT_Y, 0));
const housePos = (b: Buyer) => surface(b.city.lon, b.city.lat);

// ---------- Camera (keyframed; shared by the 3D rig and the 2D projection) ----------
const FOV = 34;
type Key = { f: number; pos: THREE.Vector3; look: THREE.Vector3 };
const BERGEN = geo(5.32, 60.39, LAND_H);
const OVER = geo(12.5, 62.6, 0);
const KEYS: Key[] = [
  // Start close on Teo above Oslo
  { f: 0, pos: agentPos().add(new THREE.Vector3(0.75, 0.22, 1.35)), look: agentPos().add(new THREE.Vector3(0, -0.05, 0)) },
  // Pull up and out: the whole country
  { f: 62, pos: OVER.clone().add(new THREE.Vector3(1.6, 6.6, 6.4)), look: OVER.clone().add(new THREE.Vector3(0, 0, 0.6)) },
  { f: 150, pos: OVER.clone().add(new THREE.Vector3(-1.4, 6.0, 6.0)), look: OVER.clone().add(new THREE.Vector3(-0.4, 0, 0.9)) },
  // Dive to Bergen for the haggling with Ola
  { f: 178, pos: BERGEN.clone().add(new THREE.Vector3(-1.5, 0.95, 1.25)), look: BERGEN.clone().add(new THREE.Vector3(0.9, 0.1, -0.25)) },
  { f: 240, pos: BERGEN.clone().add(new THREE.Vector3(-1.8, 1.15, 1.55)), look: BERGEN.clone().add(new THREE.Vector3(1.1, 0.1, -0.35)) },
  // Wide again: Tromsø lowball bounces off the floor shield in Oslo
  { f: 268, pos: new THREE.Vector3(2.6, 7.2, 5.0), look: new THREE.Vector3(0.35, 0, -0.75) },
  { f: 312, pos: new THREE.Vector3(1.7, 6.6, 5.6), look: new THREE.Vector3(0.2, 0, -0.45) },
  // The scam comes in from the sea, toward Oslo
  { f: 340, pos: osloPos().add(new THREE.Vector3(1.6, 1.5, 2.6)), look: osloPos().add(new THREE.Vector3(-1.2, 0.2, 0)) },
  { f: 398, pos: osloPos().add(new THREE.Vector3(1.9, 1.7, 2.9)), look: osloPos().add(new THREE.Vector3(-1.4, 0.2, 0)) },
  // Pull out: Ola's question, Teo picks up the phone
  { f: 438, pos: OVER.clone().add(new THREE.Vector3(-0.6, 5.2, 5.8)), look: geo(8.2, 60.4, 0) },
];

const camAt = (frame: number) => {
  let i = 0;
  while (i < KEYS.length - 2 && frame > KEYS[i + 1].f) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = easeInOut(frame, a.f, Math.max(1, b.f - a.f));
  // Gentle continuous drift so it never feels static
  const drift = new THREE.Vector3(Math.sin(frame * 0.021) * 0.06, Math.sin(frame * 0.017) * 0.04, 0);
  return {
    pos: a.pos.clone().lerp(b.pos, t).add(drift),
    look: a.look.clone().lerp(b.look, t),
  };
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const { pos, look } = camAt(frame);
    cam.fov = FOV;
    cam.near = 0.05;
    cam.far = 200;
    cam.position.copy(pos);
    cam.lookAt(look);
    cam.updateProjectionMatrix();
  }, [camera, frame]);
  return null;
};

const projector = new THREE.PerspectiveCamera(FOV, 1920 / 1080, 0.05, 200);
const project = (p: THREE.Vector3, frame: number) => {
  const { pos, look } = camAt(frame);
  projector.position.copy(pos);
  projector.lookAt(look);
  projector.updateMatrixWorld();
  projector.updateProjectionMatrix();
  const v = p.clone().project(projector);
  return { x: ((v.x + 1) / 2) * 1920, y: ((1 - v.y) / 2) * 1080, behind: v.z > 1 };
};

// ---------- Messages ----------
type Msg = { buyer: string; from: "buyer" | "agent"; at: number; text: string; hold?: number };

const MSGS: Msg[] = [
  { buyer: "ola", from: "buyer", at: F(24.15), text: "Still available? 1 200 kr?", hold: 46 },
  { buyer: "mike", from: "buyer", at: F(25.2), text: "Would you take 1 300 kr?", hold: 40 },
  { buyer: "emma", from: "buyer", at: F(25.9), text: "Can you ship to Trondheim?", hold: 34 },
  { buyer: "ola", from: "agent", at: F(26.5), text: "It is. I can do 1 750 kr.", hold: 30 },
  { buyer: "mike", from: "agent", at: F(26.55), text: "Best I can do is 1 800 kr.", hold: 30 },
  { buyer: "emma", from: "agent", at: F(26.6), text: "Yes. Shipping is included.", hold: 30 },
  { buyer: "ola", from: "buyer", at: F(28.0), text: "1 600 kr, shipped?", hold: 64 },
  { buyer: "ola", from: "agent", at: F(29.4), text: "1 650 kr shipped. It goes out tomorrow.", hold: 44 },
  { buyer: "jonas", from: "buyer", at: F(31.0), text: "1 000 kr, cash today?", hold: 36 },
  { buyer: "jonas", from: "agent", at: F(31.75), text: "Sorry, that's below what I can accept.", hold: 34 },
  { buyer: "ola", from: "buyer", at: F(36.0), text: "Has it been in a home with pets?", hold: 60 },
];

const TRAVEL = 22; // frames a message takes to fly

const arc = (a: THREE.Vector3, b: THREE.Vector3) => {
  const mid = a.clone().lerp(b, 0.5);
  mid.y += 0.35 + a.distanceTo(b) * 0.22;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
};

const curveFor = (buyerId: string) => {
  const b = BUYERS.find((x) => x.id === buyerId)!;
  return arc(agentPos(), housePos(b).add(new THREE.Vector3(0, 0.12, 0)));
};

const Packet: React.FC<{ curve: THREE.QuadraticBezierCurve3; reverse: boolean; frame: number; at: number; color: string; stopAt?: number }> = ({
  curve,
  reverse,
  frame,
  at,
  color,
  stopAt = 1,
}) => {
  const p = (frame - at) / TRAVEL;
  if (p < 0 || p > 1.4) return null;
  const k = Math.min(p, stopAt);
  const u = (x: number) => (reverse ? 1 - x : x);
  const head = curve.getPoint(u(k));
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 14; i++) {
    const x = Math.max(0, k - 0.3 + (0.3 * i) / 14);
    pts.push(curve.getPoint(u(x)));
  }
  const fade = interpolate(p, [stopAt, stopAt + 0.4], [1, 0], clamp);
  return (
    <group>
      <Line points={pts} color={color} lineWidth={3} transparent opacity={0.9 * fade} />
      <mesh position={head}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={fade} />
      </mesh>
      <Glow position={[head.x, head.y, head.z]} size={0.45} color={color} opacity={0.9 * fade} />
    </group>
  );
};

// ---------- 3D pieces ----------
const House: React.FC<{ b: Buyer; frame: number }> = ({ b, frame }) => {
  const p = housePos(b);
  const s = ease(frame, b.appear, 12);
  if (s <= 0) return null;
  const talking = MSGS.some((m) => m.buyer === b.id && frame >= m.at && frame <= m.at + TRAVEL + 10);
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[0.11, 0.09, 0.1]} />
        <meshStandardMaterial color={C.ink} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.125, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.095, 0.075, 4]} />
        <meshStandardMaterial color="#c9ccd2" roughness={0.6} />
      </mesh>
      {/* Warm lit window */}
      <mesh position={[0, 0.045, 0.051]}>
        <planeGeometry args={[0.035, 0.035]} />
        <meshBasicMaterial color={C.mark} />
      </mesh>
      <Glow position={[0, 0.06, 0.06]} size={0.35 + (talking ? 0.25 : 0)} color={C.mark} opacity={0.55} />
      {/* Beacon */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.3, 6]} />
        <meshBasicMaterial color={C.ink} transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

const Watchers: React.FC<{ frame: number }> = ({ frame }) => (
  <group>
    {WATCHERS.map((w, i) => {
      const p = surface(w.lon, w.lat, 0.005);
      const on = fadeIn(frame, F(23.4) + i * 3, 10);
      const pulse = 0.5 + 0.5 * Math.sin(frame * 0.12 + i * 1.7);
      return (
        <group key={w.name} position={p}>
          <mesh>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshBasicMaterial color={C.ink} transparent opacity={on * 0.8} />
          </mesh>
          <Glow size={0.18 + pulse * 0.12} color={C.agent} opacity={on * 0.45} />
        </group>
      );
    })}
  </group>
);

const Shield: React.FC<{ frame: number }> = ({ frame }) => {
  const on = interpolate(frame, [F(30.9), F(31.4), F(32.6), F(33.3)], [0.12, 1, 1, 0.35], clamp);
  const scamHit = interpolate(frame, [SCAM_SHATTER - 6, SCAM_SHATTER, SCAM_SHATTER + 14], [0.35, 1, 0.35], clamp);
  const hit = interpolate(frame - (F(31.0) + TRAVEL * 0.86), [0, 3, 18], [0, 1, 0], clamp);
  const level = Math.max(on, frame > SCAM_IN ? scamHit : 0) + hit * 0.5;
  return (
    <group position={osloPos()}>
      <mesh>
        <sphereGeometry args={[0.36, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={C.agent} transparent opacity={0.03 + level * 0.1} wireframe depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[0.35, 0.37, 64]} />
        <meshBasicMaterial color={C.agent} transparent opacity={0.25 + level * 0.6} />
      </mesh>
      <Glow position={[0, 0.12, 0]} size={1.0} color={C.agent} opacity={0.1 + level * 0.3} />
    </group>
  );
};

const Shards: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - SCAM_SHATTER;
  if (t < 0 || t > 40) return null;
  const curve = arc(SCAM_FROM, agentPos());
  const origin = curve.getPoint(0.8);
  return (
    <group>
      {new Array(30).fill(0).map((_, i) => {
        const dir = new THREE.Vector3(random(`sx${i}`) - 0.5, random(`sy${i}`) - 0.2, random(`sz${i}`) - 0.5).normalize();
        const p = origin.clone().add(dir.multiplyScalar(t * (0.012 + random(`sv${i}`) * 0.02)));
        p.y -= 0.0004 * t * t;
        return (
          <mesh key={i} position={p} rotation={[t * 0.2, t * 0.3 * random(`r${i}`), 0]}>
            <tetrahedronGeometry args={[0.012 + random(`ss${i}`) * 0.02]} />
            <meshBasicMaterial color={C.danger} transparent opacity={interpolate(t, [18, 40], [1, 0], clamp)} />
          </mesh>
        );
      })}
      <Glow position={[origin.x, origin.y, origin.z]} size={interpolate(t, [0, 10], [0.3, 1.4], clamp)} color={C.danger} opacity={interpolate(t, [0, 14], [0.9, 0], clamp)} />
    </group>
  );
};

const World: React.FC<{ frame: number }> = ({ frame }) => {
  const sendPulse = MSGS.filter((m) => m.from === "agent").reduce(
    (acc, m) => Math.max(acc, interpolate(frame - m.at, [0, 4, 18], [0, 1, 0], clamp)),
    0,
  );
  const ap = agentPos();
  const scamCurve = useMemo(() => arc(SCAM_FROM, agentPos()), []);
  const scamOn = frame >= SCAM_IN && frame < SCAM_SHATTER;
  return (
    <>
      <CameraRig frame={frame} />
      <NorwayTerrain />
      <Watchers frame={frame} />
      {/* Teo, hovering over Kris's home in Oslo */}
      <mesh position={[ap.x, ap.y - AGENT_Y / 2, ap.z]}>
        <cylinderGeometry args={[0.004, 0.004, AGENT_Y, 6]} />
        <meshBasicMaterial color={C.agent} transparent opacity={0.6} />
      </mesh>
      <Glow position={[ap.x, ap.y, ap.z]} size={0.9 + sendPulse * 0.6} color={C.agent} opacity={0.7 + sendPulse * 0.3} />
      <group position={ap}>
        <AgentCube size={0.14} rotation={[0.6, frame * 0.03, 0.4]} glow={0.7 + sendPulse * 0.6} />
      </group>
      <Shield frame={frame} />
      {BUYERS.map((b) => (
        <House key={b.id} b={b} frame={frame} />
      ))}
      {/* Idle arcs: faint routes from Teo to each buyer */}
      {BUYERS.map((b) => {
        const c = curveFor(b.id);
        const on = fadeIn(frame, b.appear + 4, 12);
        return <Line key={b.id} points={c.getPoints(40)} color={C.agent} lineWidth={1} transparent opacity={0.22 * on} dashed dashSize={0.05} gapSize={0.04} />;
      })}
      {MSGS.map((m, i) => {
        const c = curveFor(m.buyer);
        const lowball = m.buyer === "jonas" && m.from === "buyer";
        return (
          <Packet
            key={i}
            curve={c}
            reverse={m.from === "buyer"}
            frame={frame}
            at={m.at}
            color={m.from === "agent" ? C.agent : lowball ? C.ink2 : C.ink}
            stopAt={lowball ? 0.9 : 1}
          />
        );
      })}
      {scamOn ? (
        <Packet curve={scamCurve} reverse={false} frame={Math.min(frame, SCAM_IN + Math.round(TRAVEL * 0.8))} at={SCAM_IN} color={C.danger} stopAt={0.8} />
      ) : null}
      {frame >= SCAM_IN - 10 && frame < SCAM_SHATTER ? (
        <group position={SCAM_FROM}>
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color={C.danger} />
          </mesh>
          <Glow size={0.6} color={C.danger} opacity={0.8} />
        </group>
      ) : null}
      <Shards frame={frame} />
    </>
  );
};

// ---------- 2D overlay ----------
const BuyerLabel: React.FC<{ b: Buyer; frame: number }> = ({ b, frame }) => {
  const s = project(housePos(b), frame);
  if (s.behind) return null;
  const o = fadeIn(frame, b.appear + 4, 10) * fadeOut(frame, 430, 8);
  return (
    <div style={{ position: "absolute", left: s.x, top: s.y + 14, transform: "translateX(-50%)", opacity: o, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, color: C.ink, textShadow: "0 2px 10px #000" }}>{b.name}</span>
        <Tag>{b.platform}</Tag>
      </div>
      <span style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.06em", color: C.ink2, textTransform: "uppercase", textShadow: "0 2px 8px #000" }}>
        {b.city.name}
      </span>
    </div>
  );
};

const TeoLabel: React.FC<{ frame: number }> = ({ frame }) => {
  const s = project(agentPos(), frame);
  const o = fadeIn(frame, 4, 10) * fadeOut(frame, 430, 8);
  const close = interpolate(frame, [0, 50], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: s.x,
        top: s.y - 40 - close * 60,
        transform: `translate(-50%, -100%) scale(${1 + close * 0.4})`,
        opacity: o,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: SANS, fontSize: 24, fontWeight: 700, color: C.agent, textShadow: "0 2px 12px #000" }}>
        <AgentMark size={11} /> Teo
      </div>
      <span style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.06em", color: C.ink2, textTransform: "uppercase", textShadow: "0 2px 8px #000" }}>
        Selling for Kris · Oslo
      </span>
    </div>
  );
};

const BubbleAt: React.FC<{ m: Msg; frame: number }> = ({ m, frame }) => {
  const shownAt = m.from === "buyer" ? m.at : m.at + TRAVEL - 2;
  const hold = m.hold ?? 40;
  if (frame < shownAt - 1 || frame > shownAt + hold + 8) return null;
  const b = BUYERS.find((x) => x.id === m.buyer)!;
  const s = project(housePos(b), frame);
  if (s.behind) return null;
  const k = pop(frame, shownAt, 30, 16);
  const o = Math.min(fadeIn(frame, shownAt, 5), fadeOut(frame, shownAt + hold, 8));
  const agent = m.from === "agent";
  const right = !["ola", "mike"].includes(m.buyer) && s.x < 1450;
  return (
    <div
      style={{
        position: "absolute",
        left: right ? s.x + 40 : undefined,
        right: right ? undefined : 1920 - s.x + 40,
        top: s.y - (agent ? 104 : 46),
        transform: `scale(${0.85 + 0.15 * k})`,
        transformOrigin: right ? "left center" : "right center",
        opacity: o,
        whiteSpace: "nowrap",
        padding: "12px 18px",
        borderRadius: 14,
        fontFamily: SANS,
        fontSize: 26,
        fontWeight: 500,
        color: C.ink,
        background: agent ? "rgba(30,41,73,0.94)" : "rgba(12,13,16,0.92)",
        border: `1.5px solid ${agent ? "#3a4f8f" : C.line}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {agent ? <AgentMark size={11} /> : null}
      {agent ? <span style={{ color: C.agent, fontWeight: 600 }}>Teo</span> : null}
      {m.text}
    </div>
  );
};

// Price meter for the main thread with Ola.
const Meter: React.FC<{ frame: number }> = ({ frame }) => {
  const min = 1050;
  const max = 2100;
  const W = 660;
  const x = (v: number) => ((v - min) / (max - min)) * W;
  const inO = fadeIn(frame, F(27.6), 10) * fadeOut(frame, F(33.0), 10);
  const counter = interpolate(frame, [F(29.4), F(30.3)], [1750, 1650], clamp);
  const offer = interpolate(frame, [F(28.0), F(28.3)], [1200, 1600], clamp);
  const floorGlow = interpolate(frame, [F(30.9), F(31.5)], [0, 1], clamp);
  const marks = [
    { v: 1400, label: "Floor" },
    { v: 1700, label: "Target" },
    { v: 1900, label: "List" },
  ];
  return (
    <div style={{ position: "absolute", left: 110, top: 110, opacity: inO, transform: `translateY(${(1 - inO) * 14}px)` }}>
      <Card width={W + 64} style={{ padding: 28, background: "rgba(26,28,31,0.9)" }}>
        <Label>Negotiation · Ola N. · FINN</Label>
        <div style={{ position: "relative", height: 140, marginTop: 22 }}>
          <div style={{ position: "absolute", left: 0, top: 58, width: W, height: 4, background: C.line, borderRadius: 2 }} />
          <div style={{ position: "absolute", left: 0, top: 58, width: x(1400), height: 4, background: C.dangerSoft, borderRadius: 2 }} />
          {marks.map((m) => (
            <div key={m.label} style={{ position: "absolute", left: x(m.v), top: 40, transform: "translateX(-50%)", textAlign: "center" }}>
              <div
                style={{
                  width: 2,
                  height: 40,
                  margin: "0 auto",
                  background: m.label === "Floor" && floorGlow > 0 ? C.agent : C.lineStrong,
                  boxShadow: m.label === "Floor" ? `0 0 ${14 * floorGlow}px ${C.agent}` : undefined,
                }}
              />
              <div style={{ fontFamily: SANS, fontSize: 19, color: C.ink2, marginTop: 6, whiteSpace: "nowrap", lineHeight: 1.15 }}>
                {m.label}
                <br />
                <span style={{ fontVariantNumeric: "tabular-nums", color: C.ink }}>{kr(m.v)}</span>
              </div>
            </div>
          ))}
          <div style={{ position: "absolute", left: x(counter), top: 0, transform: "translateX(-50%)" }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, color: C.agent, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              {kr(Math.round(counter / 50) * 50)}
            </div>
            <div style={{ width: 14, height: 14, background: C.agent, margin: "6px auto 0", borderRadius: 2, boxShadow: `0 0 14px ${C.agent}` }} />
          </div>
          <div style={{ position: "absolute", left: x(offer), top: 52, transform: "translateX(-50%)", width: 16, height: 16, borderRadius: 8, background: C.ink, boxShadow: "0 0 10px rgba(255,255,255,0.5)" }} />
        </div>
      </Card>
    </div>
  );
};

const ScamCard: React.FC<{ frame: number }> = ({ frame }) => {
  const start = F(33.6);
  const o = fadeIn(frame, start, 8) * fadeOut(frame, F(36.3), 8);
  const caught = frame >= F(34.44);
  const reasons = ["Payment link outside FINN", "FINN shipping never comes as a link", "Asks for your BankID"];
  return (
    <div style={{ position: "absolute", right: 110, top: 110, opacity: o, transform: `perspective(1400px) rotateY(${interpolate(frame, [start, start + 14], [-18, -6], clamp)}deg)` }}>
      <Card width={640} elevated style={{ padding: 30, background: "rgba(26,28,31,0.95)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Label>Message · FINN · unknown sender</Label>
          {caught ? <Status kind="problem" text="Scam risk" size={26} /> : null}
        </div>
        <div style={{ marginTop: 18, padding: "16px 18px", borderRadius: 12, background: C.sunken, fontFamily: SANS, fontSize: 26, lineHeight: 1.35, color: C.ink }}>
          Pay with Fiks ferdig here and confirm with BankID:{" "}
          <span style={{ fontFamily: MONO, fontSize: 22, background: caught ? C.dangerSoft : "transparent", color: caught ? C.danger : C.ink, padding: "1px 6px", borderRadius: 4 }}>
            fiksferdig-finn.pay-no.com
          </span>
        </div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {reasons.map((r, i) => {
            const at = F(34.44) + i * 7;
            return (
              <div key={r} style={{ display: "flex", gap: 12, alignItems: "center", opacity: fadeIn(frame, at, 6), transform: `translateX(${interpolate(frame, [at, at + 8], [-12, 0], clamp)}px)`, fontFamily: SANS, fontSize: 25, color: C.ink }}>
                <span style={{ color: C.danger, fontWeight: 700 }}>×</span>
                {r}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 23, color: C.agent, display: "flex", gap: 10, alignItems: "center", opacity: fadeIn(frame, SCAM_SHATTER + 4, 8) }}>
          <AgentMark size={10} /> Blocked. Never shown to Kris.
        </div>
      </Card>
    </div>
  );
};

// Ola's question isn't in the knowledge sheet: Teo calls Kris.
const Handoff: React.FC<{ frame: number }> = ({ frame }) => {
  const at = F(36.3);
  const o = fadeIn(frame, at, 6);
  const s = project(agentPos(), frame);
  return (
    <div style={{ position: "absolute", left: s.x, top: s.y - 70, transform: "translate(-50%, -100%)", opacity: o, whiteSpace: "nowrap" }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: "12px 18px",
          borderRadius: 14,
          background: "rgba(30,41,73,0.95)",
          border: "1.5px solid #3a4f8f",
          color: C.ink,
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 26,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}
      >
        <AgentMark size={12} />
        Not in the knowledge sheet. Calling Kris.
      </div>
    </div>
  );
};

export const S6Negotiate: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const edgeIn = fadeIn(frame, 0, 6);
  const edgeOut = fadeOut(frame, durationInFrames - 5, 5);
  const shake = interpolate(frame - SCAM_SHATTER, [0, 2, 8], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.void, opacity: Math.min(edgeIn, edgeOut) }}>
      <AbsoluteFill style={{ transform: `translate(${Math.sin(frame * 3.1) * 6 * shake}px, ${Math.cos(frame * 2.3) * 5 * shake}px)` }}>
        <Stage camera={{ position: [0, 3, 8], fov: FOV }} fog={[7, 22]}>
          <World frame={frame} />
        </Stage>
        <AbsoluteFill>
          <TeoLabel frame={frame} />
          {BUYERS.map((b) => (
            <BuyerLabel key={b.id} b={b} frame={frame} />
          ))}
          {MSGS.map((m, i) => (
            <BubbleAt key={i} m={m} frame={frame} />
          ))}
          <Meter frame={frame} />
          <ScamCard frame={frame} />
          <Handoff frame={frame} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
