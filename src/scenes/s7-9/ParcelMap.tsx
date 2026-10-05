// Scene 8, second beat (51.2–56.6 s): dive onto Kris's house in Oslo, the parcel drops into the
// mailbox, then flies across the mountains to Ola's house in Bergen. Pure function of the
// scene-8 frame, so scene 9 can freeze the last frame and pull it into the cube.
import { Line } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import * as THREE from "three";
import { Glow } from "../../three/Glow";
import { House, NorwayTerrain, PLACES, arcBetween, projectWith, surface } from "../../three/norway";
import { Stage } from "../../three/Stage";
import { C, MONO, SANS } from "../../theme";
import { clamp, easeInOut } from "../../ui/anim";
import { AgentMark, Label } from "../../ui/kit";
import { CheckGlyph, Ripple, at, lerp, prog } from "./common";

const F8 = at(48.4);
export const MAP_IN = F8(51.2); // 84: whip into the map
const DIVE_END = 104;
const DROP = F8(51.8); // 102: parcel appears over the mailbox ("drop" 51.76)
export const MAILBOX = F8(52.52); // 124: in the mailbox
export const PARCEL_SFX = F8(52.5); // 123
const LIFT = F8(52.9); // 135
const FLY = LIFT + 8; // 143
const LAND_AT = F8(55.1); // 201
export const DELIVER_SFX = F8(55.2); // 204
const END = 246;

const FOV = 34;
const oslo = surface(PLACES.oslo.lon, PLACES.oslo.lat);
const bergen = surface(PLACES.bergen.lon, PLACES.bergen.lat);
const mid = oslo.clone().lerp(bergen, 0.5);
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Kris's mailbox stands right of the house, toward the camera.
const MAILBOX_AT = oslo.clone().add(v(0.13, 0, 0.09));
const SLOT = MAILBOX_AT.clone().add(v(0, 0.075, 0));
// Ola's doorstep.
const DOOR = bergen.clone().add(v(0, 0.008, 0.1));
const ROUTE = arcBetween(SLOT.clone().add(v(0, 0.05, 0)), DOOR, 0.3);

// ---------- camera ----------
type Key = { f: number; pos: THREE.Vector3; look: THREE.Vector3 };
const KEYS: Key[] = [
  { f: MAP_IN, pos: mid.clone().add(v(0.9, 4.6, 3.4)), look: mid.clone().add(v(0.3, 0, -0.4)) },
  { f: DIVE_END, pos: oslo.clone().add(v(0.3, 0.24, 0.56)), look: oslo.clone().add(v(0.05, 0.05, 0.03)) },
  { f: LIFT, pos: oslo.clone().add(v(0.22, 0.2, 0.46)), look: oslo.clone().add(v(0.07, 0.05, 0.04)) },
  { f: LAND_AT - 4, pos: mid.clone().add(v(0.2, 1.3, 2.0)), look: mid.clone().add(v(-0.05, 0.12, 0)) },
  { f: END, pos: mid.clone().add(v(-0.12, 1.08, 1.7)), look: mid.clone().lerp(bergen, 0.35).add(v(0, 0.1, 0)) },
];

export const camAt = (frame: number) => {
  let i = 0;
  while (i < KEYS.length - 2 && frame > KEYS[i + 1].f) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = i === 0 ? interpolate(frame, [a.f, b.f], [0, 1], { ...clamp, easing: Easing.bezier(0.55, 0, 0.15, 1) }) : easeInOut(frame, a.f, Math.max(1, b.f - a.f));
  const drift = v(Math.sin(frame * 0.021) * 0.012, Math.sin(frame * 0.017) * 0.008, 0);
  return { pos: a.pos.clone().lerp(b.pos, t).add(drift), look: a.look.clone().lerp(b.look, t) };
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const { pos, look } = camAt(frame);
    cam.fov = FOV;
    cam.near = 0.02;
    cam.far = 200;
    cam.position.copy(pos);
    cam.lookAt(look);
    cam.updateProjectionMatrix();
  }, [camera, frame]);
  return null;
};

const project = (p: THREE.Vector3, frame: number) => {
  const { pos, look } = camAt(frame);
  return projectWith(p, pos, look, FOV);
};

// ---------- parcel ----------
const parcelState = (frame: number) => {
  // Drop into the mailbox.
  if (frame < LIFT) {
    const appear = prog(frame, DROP, 6, Easing.out(Easing.back(2)));
    const fall = interpolate(frame, [DROP + 4, MAILBOX - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const sink = interpolate(frame, [MAILBOX - 3, MAILBOX + 1], [1, 0], clamp);
    const pos = SLOT.clone().add(v(0, lerp(0.1, 0.0, fall), 0));
    return { pos, scale: appear * sink, spin: 0.4 + fall * 0.6, t: 0 };
  }
  // Lift out, fly the arc, land.
  const out = prog(frame, LIFT, 8);
  if (frame < FLY) {
    return { pos: SLOT.clone().add(v(0, out * 0.05, 0)), scale: out, spin: 1, t: 0 };
  }
  const t = interpolate(frame, [FLY, LAND_AT], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.35, 1) });
  return { pos: ROUTE.getPoint(t), scale: 1, spin: 1 + t * 5, t };
};

const Parcel: React.FC<{ frame: number }> = ({ frame }) => {
  const s = parcelState(frame);
  if (s.scale <= 0.001) return null;
  const flying = frame >= LIFT && frame < LAND_AT + 2;
  return (
    <group position={s.pos} scale={s.scale * 0.7} rotation={[0, s.spin, flying ? Math.sin(frame * 0.3) * 0.15 : 0]}>
      <mesh position={[0, 0.016, 0]}>
        <boxGeometry args={[0.05, 0.032, 0.04]} />
        <meshStandardMaterial color={C.oak} roughness={0.85} />
      </mesh>
      {/* tape and the white label with the code */}
      <mesh position={[0, 0.0325, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.012, 0.0402]} />
        <meshStandardMaterial color="#a88660" roughness={0.6} />
      </mesh>
      <mesh position={[0.008, 0.017, 0.0202]}>
        <planeGeometry args={[0.024, 0.014]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
      {flying ? <Glow position={[0, 0.016, 0]} size={0.22} color={C.agent} opacity={0.75} /> : null}
    </group>
  );
};

const Trail: React.FC<{ frame: number }> = ({ frame }) => {
  const { t } = parcelState(frame);
  const route = prog(frame, LIFT, 14);
  const routePts = useMemo(() => ROUTE.getPoints(60), []);
  if (frame < LIFT) return null;
  const t0 = Math.max(0, t - 0.32);
  const pts = new Array(24).fill(0).map((_, i) => ROUTE.getPoint(lerp(t0, t, i / 23)));
  const fade = 1 - prog(frame, LAND_AT + 6, 30);
  return (
    <group>
      <Line points={routePts} color={C.agent} lineWidth={1.5} dashed dashSize={0.03} gapSize={0.025} transparent opacity={0.35 * route} />
      {t > 0.005 ? <Line points={pts} color={C.agent} lineWidth={4} transparent opacity={0.9 * fade} /> : null}
    </group>
  );
};

const Mailbox: React.FC<{ frame: number }> = ({ frame }) => {
  const lit = interpolate(frame, [MAILBOX - 2, MAILBOX + 2, LIFT + 10, LIFT + 30], [0, 1, 1, 0.25], clamp);
  return (
    <group position={MAILBOX_AT}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.0035, 0.0035, 0.06, 8]} />
        <meshStandardMaterial color={C.lineStrong} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.066, 0]}>
        <boxGeometry args={[0.042, 0.028, 0.032]} />
        <meshStandardMaterial color={C.ink2} emissive={C.mark} emissiveIntensity={lit * 1.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.074, 0.0165]}>
        <planeGeometry args={[0.026, 0.0045]} />
        <meshBasicMaterial color={C.void} />
      </mesh>
      <Glow position={[0, 0.066, 0.016]} size={0.24} color={C.mark} opacity={lit * 0.85} />
    </group>
  );
};

// The 3D layer. `frame` is the scene-8 frame.
export const MapStage: React.FC<{ frame: number }> = ({ frame }) => {
  const landed = interpolate(frame, [LAND_AT, LAND_AT + 4, LAND_AT + 40], [0, 1, 0.35], clamp);
  return (
    <Stage lights={false} fog={[7, 22]} camera={{ position: [0, 5, 5], fov: FOV }}>
      <CameraRig frame={frame} />
      <ambientLight intensity={0.25} />
      <NorwayTerrain />
      <House place={PLACES.oslo} scale={1.2} windowGlow={0.7} beacon={false} />
      <House place={PLACES.bergen} scale={1.1} windowGlow={0.5 + landed * 0.5} beacon={false} />
      <Glow position={[bergen.x, bergen.y + 0.1, bergen.z]} size={0.6 + landed * 0.8} color={C.agent} opacity={0.15 + landed * 0.5} />
      <Glow position={[oslo.x, oslo.y + 0.1, oslo.z]} size={0.7} color={C.agent} opacity={0.18} />
      <Mailbox frame={frame} />
      <Trail frame={frame} />
      <Parcel frame={frame} />
      <group position={DOOR} rotation={[-Math.PI / 2, 0, 0]}>
        <Ripple progress={(frame - LAND_AT) / 30} from={0.02} to={0.3} opacity={0.7} width={0.006} />
        <Ripple progress={(frame - LAND_AT - 6) / 34} from={0.02} to={0.22} opacity={0.45} width={0.005} />
      </group>
      <group position={SLOT} rotation={[-Math.PI / 2, 0, 0]}>
        <Ripple progress={(frame - MAILBOX) / 26} from={0.02} to={0.16} opacity={0.7} color={C.mark} width={0.004} />
      </group>
    </Stage>
  );
};

// ---------- 2D overlays ----------
const clampX = (x: number, w: number) => Math.min(1840 - w, Math.max(80, x));

const ShipChip: React.FC<{ frame: number }> = ({ frame }) => {
  const show = interpolate(frame, [DROP - 2, DROP + 10, LIFT + 4, LIFT + 16], [0, 1, 1, 0], clamp);
  if (show <= 0) return null;
  const mark = prog(frame, MAILBOX - 2, 8);
  const anchor = project(MAILBOX_AT.clone().add(v(0, 0.082, 0)), frame);
  const L = 1236;
  const T = 590;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: show }}>
        <path d={`M ${L} ${T + 60} L ${anchor.x + 14} ${anchor.y - 10}`} stroke={C.lineStrong} strokeWidth={1.5} strokeDasharray="4 5" fill="none" />
        <circle cx={anchor.x + 14} cy={anchor.y - 10} r={4} fill={C.mark} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: L,
          top: T,
          width: 604,
          padding: "20px 24px",
          borderRadius: 16,
          background: "rgba(26,28,31,0.92)",
          border: `1.5px solid ${C.lineStrong}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          opacity: show,
          transform: `translateY(${(1 - show) * 14}px)`,
        }}
      >
        <Label size={24}>Write this on the parcel</Label>
        <div style={{ fontFamily: MONO, fontSize: 42, color: C.ink, marginTop: 8, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>LL 4821 7730 9NO</div>
        <div style={{ fontFamily: SANS, fontSize: 25, color: C.ink2, marginTop: 10, whiteSpace: "nowrap" }}>
          Leave it in your{" "}
          <span
            style={{
              color: mark > 0.97 ? C.onMark : C.ink,
              backgroundImage: `linear-gradient(${C.mark}, ${C.mark})`,
              backgroundSize: `${mark * 100}% 100%`,
              backgroundRepeat: "no-repeat",
              padding: "0 5px",
              margin: "0 -5px",
              borderRadius: 4,
            }}
          >
            mailbox
          </span>{" "}
          before 5 PM tomorrow
        </div>
      </div>
    </>
  );
};

const PlaceTag: React.FC<{ frame: number; p: THREE.Vector3; who: string; city: string; from: number }> = ({ frame, p, who, city, from }) => {
  const show = prog(frame, from, 14);
  if (show <= 0) return null;
  const s = project(p, frame);
  const w = 300;
  return (
    <div
      style={{
        position: "absolute",
        left: clampX(s.x - w / 2, w),
        top: s.y + 22,
        width: w,
        textAlign: "center",
        fontFamily: SANS,
        fontSize: 26,
        fontWeight: 600,
        color: C.ink,
        opacity: show,
        textShadow: "0 2px 12px rgba(0,0,0,0.9)",
      }}
    >
      {who} <span style={{ color: C.ink2, fontWeight: 500 }}>· {city}</span>
    </div>
  );
};

const Delivered: React.FC<{ frame: number }> = ({ frame }) => {
  const show = prog(frame, LAND_AT + 1, 12, Easing.out(Easing.back(1.6)));
  if (show <= 0) return null;
  const s = project(bergen.clone().add(v(0, 0.14, 0)), frame);
  const w = 520;
  return (
    <div
      style={{
        position: "absolute",
        left: clampX(s.x - w / 2, w),
        top: Math.max(110, s.y - 150),
        width: w,
        padding: "18px 24px",
        borderRadius: 16,
        background: "rgba(26,28,31,0.94)",
        border: `1.5px solid #3b4f8a`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139,170,255,0.18)",
        opacity: Math.min(1, show),
        transform: `translateY(${(1 - show) * 16}px) scale(${lerp(0.94, 1, show)})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: SANS, fontSize: 30, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>
        <span style={{ width: 38, height: 38, borderRadius: 19, border: `2px solid ${C.ink}`, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <CheckGlyph size={24} draw={prog(frame, LAND_AT + 4, 10)} />
        </span>
        Delivered to Ola N. · Bergen
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontSize: 24, color: C.ink2, marginTop: 8, marginLeft: 52 }}>
        <AgentMark size={10} /> Tracked by Selger · 2 days
      </div>
    </div>
  );
};

export const MapOverlay: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <ShipChip frame={frame} />
    <PlaceTag frame={frame} p={oslo} who="Kris" city="Oslo" from={LIFT + 10} />
    <PlaceTag frame={frame} p={bergen} who="Ola N." city="Bergen" from={LIFT + 22} />
    <Delivered frame={frame} />
  </AbsoluteFill>
);
