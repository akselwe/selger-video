import { useThree } from "@react-three/fiber";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as THREE from "three";
import { Chair } from "../../three/Chair";
import { Glow } from "../../three/Glow";
import { Stage } from "../../three/Stage";
import { C } from "../../theme";

// Chair scale used everywhere in scenes 2-3 (1 m ≈ 2.5 units). The chair's feet sit at y = 0.
export const CHAIR_SCALE = 2.5;
const FEET = 0.46 * CHAIR_SCALE;

export type Cam = {
  readonly angle: number; // orbit angle around the chair (radians, 0 = straight on)
  readonly dist: number;
  readonly height: number;
  readonly targetY?: number;
  readonly roll?: number;
  readonly panX?: number; // shifts the look target sideways (moves chair off-centre)
  readonly shake?: number; // handheld amount (0 = locked off)
  readonly t?: number; // seconds, drives the handheld motion
  readonly from?: [number, number, number]; // explicit position (overrides the orbit)
  readonly at?: [number, number, number]; // explicit look target
};

// Places the camera every render (frame-driven, no useFrame). Handheld = layered sines.
export const CameraRig: React.FC<{ readonly cam: Cam }> = ({ cam }) => {
  const camera = useThree((s) => s.camera);
  const { angle, dist, height, targetY = 1.0, roll = 0, panX = 0, shake = 0, t = 0 } = cam;
  const n = (a: number, b: number) =>
    Math.sin(t * a + b) * 0.6 + Math.sin(t * a * 2.37 + b * 1.7) * 0.28 + Math.sin(t * a * 5.1 + b * 0.3) * 0.12;
  const sx = n(1.3, 0.2) * 0.035 * shake;
  const sy = n(1.1, 1.4) * 0.03 * shake + Math.sin(t * 1.9) * 0.012 * shake; // breathing
  const tx = n(1.7, 2.1) * 0.045 * shake;
  const ty = n(1.5, 3.3) * 0.04 * shake;
  const x = Math.sin(angle) * dist;
  const z = Math.cos(angle) * dist;
  const px = Math.cos(angle) * panX;
  const pz = -Math.sin(angle) * panX;
  if (cam.from && cam.at) {
    camera.position.set(cam.from[0] + sx, cam.from[1] + sy, cam.from[2]);
    camera.lookAt(cam.at[0] + tx, cam.at[1] + ty, cam.at[2]);
  } else {
    camera.position.set(x + px + sx, height + sy, z + pz);
    camera.lookAt(px + tx, targetY + ty, pz);
  }
  const r = roll + n(0.9, 4.2) * 0.006 * shake;
  if (r) camera.rotateZ(r);
  camera.updateMatrixWorld();
  return null;
};

// ---------- Procedural textures (built once) ----------
const seed = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const cache: Record<string, THREE.Texture> = {};
const canvasTex = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, srgb = true) => {
  if (cache[key]) return cache[key];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  cache[key] = tex;
  return tex;
};

const radialTexture = () =>
  canvasTex("radial", 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }, false);

// Smoked-oak plank floor: planks run along the texture's V axis.
const PLANKS = 12;
const plankDraw = (rough: boolean) => (ctx: CanvasRenderingContext2D) => {
  const W = 1024;
  const H = 1024;
  const pw = W / PLANKS;
  ctx.fillStyle = rough ? "#8c8c8c" : C.oak;
  ctx.fillRect(0, 0, W, H);
  for (let p = 0; p < PLANKS; p++) {
    // Each plank is broken into 2-3 boards with joints.
    let y = -seed(p) * H;
    let b = 0;
    while (y < H) {
      const len = H * (0.45 + seed(p * 7 + b) * 0.5);
      const shade = seed(p * 13 + b * 3);
      if (rough) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 + shade * 0.15})`;
      } else {
        ctx.fillStyle = `rgba(28,16,8,${0.5 + shade * 0.1})`;
      }
      ctx.fillRect(p * pw, y, pw, len);
      // grain
      for (let k = 0; k < 14; k++) {
        const gx = p * pw + seed(p * 31 + b * 5 + k) * pw;
        ctx.strokeStyle = rough ? "rgba(255,255,255,0.12)" : seed(k + p) > 0.5 ? "rgba(20,10,4,0.28)" : "rgba(230,190,140,0.08)";
        ctx.lineWidth = 0.6 + seed(k * 3 + p) * 1.6;
        ctx.beginPath();
        for (let yy = y; yy <= y + len; yy += 16) {
          const xx = gx + Math.sin(yy * 0.01 + k) * 2.5;
          if (yy === y) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
      // end joint
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(p * pw, y + len - 1.5, pw, 2);
      y += len;
      b++;
    }
    // seam
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(p * pw, 0, 2.2, H);
  }
};
const floorMap = () => canvasTex("floor", 1024, 1024, plankDraw(false));
const floorRough = () => canvasTex("floorR", 1024, 1024, plankDraw(true), false);

// Grey wool rug with a thin border.
const rugMap = () =>
  canvasTex("rug", 512, 384, (ctx) => {
    ctx.fillStyle = C.ink2;
    ctx.fillRect(0, 0, 512, 384);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = seed(i) > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
      ctx.fillRect(seed(i + 1) * 512, seed(i + 2) * 384, 2, 2);
    }
    ctx.strokeStyle = "rgba(24,22,20,0.45)";
    ctx.lineWidth = 6;
    ctx.strokeRect(22, 22, 468, 340);
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, 440, 312);
  });

// Abstract print for the wall.
const printMap = () =>
  canvasTex("print", 300, 400, (ctx) => {
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, 300, 400);
    ctx.fillStyle = C.oak;
    ctx.beginPath();
    ctx.arc(150, 170, 88, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.ground;
    ctx.fillRect(60, 290, 180, 10);
  });

// Dusk sky in the window: brighter towards the horizon.
const skyMap = () =>
  canvasTex("sky", 64, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#7d8796");
    g.addColorStop(0.7, C.ink2);
    g.addColorStop(1, "#d9cdbd");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
  });

// Vertical fade for light shafts.
const shaftMap = () =>
  canvasTex("shaft", 64, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
    const h = ctx.createLinearGradient(0, 0, 64, 0);
    h.addColorStop(0, "rgba(0,0,0,1)");
    h.addColorStop(0.5, "rgba(0,0,0,0)");
    h.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = h;
    ctx.fillRect(0, 0, 64, 256);
  }, false);

// ---------- Room ----------
const WALL_Z = -3.2;
const WIN = { x: 2.9, y: 3.6, w: 2.6, h: 3.6 };

const Box: React.FC<{ p: [number, number, number]; s: [number, number, number]; color: string; rough?: number; emissive?: string; ei?: number }> = ({
  p,
  s,
  color,
  rough = 0.8,
  emissive,
  ei = 0,
}) => (
  <mesh position={p}>
    <boxGeometry args={s} />
    <meshStandardMaterial color={color} roughness={rough} emissive={emissive ?? "#000000"} emissiveIntensity={ei} />
  </mesh>
);

const Shaft: React.FC<{ from: [number, number, number]; to: [number, number, number]; width: number; opacity: number }> = ({
  from,
  to,
  width,
  opacity,
}) => {
  const { mid, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const d = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().normalize());
    return { mid: a.clone().add(b).multiplyScalar(0.5), quat: q, len: d.length() };
  }, [from, to]);
  return (
    <group position={mid} quaternion={quat}>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} rotation={[0, r, 0]}>
          <planeGeometry args={[width, len]} />
          <meshBasicMaterial
            map={shaftMap()}
            color={C.ink}
            transparent
            opacity={opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// Lights shared by the room layer and the chair layer so both match.
const RoomLights: React.FC = () => (
  <>
    <hemisphereLight args={[C.ink2, C.ground, 0.55]} />
    {/* Dusk daylight from the window, behind-right: rim on the chair. */}
    <directionalLight position={[6, 7, -9]} intensity={1.5} color={C.ink} />
    {/* Warm table lamp on the sideboard. */}
    <pointLight position={[-2.7, 2.75, -2.6]} intensity={14} color={C.oak} decay={2} />
    {/* Soft warm key from the front-left (room light). */}
    <spotLight position={[-3.5, 6, 5]} angle={0.5} penumbra={1} intensity={55} color={C.ink} decay={2} />
    <spotLight position={[4, 3, 6]} angle={0.6} penumbra={1} intensity={14} color={C.ink2} decay={2} />
  </>
);

const Room: React.FC<{ readonly chairPos?: [number, number] }> = ({ chairPos = [0, 0] }) => {
  const fm = floorMap();
  fm.repeat.set(6, 6);
  const fr = floorRough();
  fr.repeat.set(6, 6);
  return (
    <>
      <RoomLights />
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial map={fm} roughnessMap={fr} roughness={0.75} color="#ffffff" />
      </mesh>
      {/* Back wall + left wall */}
      <mesh position={[0, 4, WALL_Z]}>
        <planeGeometry args={[40, 8]} />
        <meshStandardMaterial color={C.ink} roughness={0.95} />
      </mesh>
      <mesh position={[-6.5, 4, WALL_Z + 10]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color={C.ink} roughness={0.95} />
      </mesh>
      {/* Skirting boards */}
      <Box p={[0, 0.14, WALL_Z + 0.03]} s={[40, 0.28, 0.06]} color={C.ink} rough={0.6} />
      <mesh position={[-6.47, 0.14, WALL_Z + 10]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[20, 0.28, 0.06]} />
        <meshStandardMaterial color={C.ink} roughness={0.6} />
      </mesh>
      {/* Window: dusk sky, frame, mullions, sill */}
      <mesh position={[WIN.x, WIN.y, WALL_Z + 0.005]}>
        <planeGeometry args={[WIN.w, WIN.h]} />
        <meshBasicMaterial map={skyMap()} toneMapped={false} fog={false} />
      </mesh>
      <Box p={[WIN.x, WIN.y + WIN.h / 2, WALL_Z + 0.06]} s={[WIN.w + 0.2, 0.12, 0.12]} color={C.ink} />
      <Box p={[WIN.x, WIN.y - WIN.h / 2, WALL_Z + 0.06]} s={[WIN.w + 0.2, 0.12, 0.12]} color={C.ink} />
      <Box p={[WIN.x - WIN.w / 2, WIN.y, WALL_Z + 0.06]} s={[0.12, WIN.h, 0.12]} color={C.ink} />
      <Box p={[WIN.x + WIN.w / 2, WIN.y, WALL_Z + 0.06]} s={[0.12, WIN.h, 0.12]} color={C.ink} />
      <Box p={[WIN.x, WIN.y, WALL_Z + 0.05]} s={[0.07, WIN.h, 0.07]} color={C.ink} />
      <Box p={[WIN.x, WIN.y + 0.4, WALL_Z + 0.05]} s={[WIN.w, 0.07, 0.07]} color={C.ink} />
      <Box p={[WIN.x, WIN.y - WIN.h / 2 - 0.08, WALL_Z + 0.18]} s={[WIN.w + 0.5, 0.08, 0.36]} color={C.ink} />
      <Glow position={[WIN.x, WIN.y, WALL_Z + 0.3]} size={7} color={C.ink2} opacity={0.18} />
      <Shaft from={[WIN.x - 0.4, WIN.y + 0.6, WALL_Z + 0.1]} to={[WIN.x - 1.8, 0, 0.6]} width={1.9} opacity={0.05} />
      <Shaft from={[WIN.x + 0.6, WIN.y + 0.2, WALL_Z + 0.1]} to={[WIN.x - 0.6, 0, 1.4]} width={1.4} opacity={0.035} />
      {/* Daylight pool on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0.5]} position={[1.4, 0.012, 0.4]} scale={[1.4, 2.6, 1]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial map={radialTexture()} color={C.ink2} transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0.008, 0.5]}>
        <planeGeometry args={[5.2, 3.8]} />
        <meshStandardMaterial map={rugMap()} roughness={1} color="#ffffff" />
      </mesh>
      {/* Sideboard (left), dark wood, on thin legs */}
      <group position={[-3.6, 0, WALL_Z + 0.55]}>
        <Box p={[0, 0.98, 0]} s={[3.6, 1.2, 1.0]} color={C.surface} rough={0.55} />
        <Box p={[0, 0.98, 0.505]} s={[0.02, 1.1, 0.01]} color={C.void} />
        <Box p={[-0.9, 0.98, 0.505]} s={[0.02, 1.1, 0.01]} color={C.void} />
        <Box p={[0.9, 0.98, 0.505]} s={[0.02, 1.1, 0.01]} color={C.void} />
        {[-1.65, 1.65].map((x) =>
          [-0.4, 0.4].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.19, z]}>
              <cylinderGeometry args={[0.035, 0.025, 0.38, 10]} />
              <meshStandardMaterial color={C.void} roughness={0.4} />
            </mesh>
          )),
        )}
        {/* Table lamp: dark base, glowing shade */}
        <mesh position={[0.9, 1.9, -0.05]}>
          <cylinderGeometry args={[0.04, 0.12, 0.7, 16]} />
          <meshStandardMaterial color={C.ground} roughness={0.4} />
        </mesh>
        <mesh position={[0.9, 2.45, -0.05]}>
          <sphereGeometry args={[0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.oak} emissive={C.oak} emissiveIntensity={1.6} side={THREE.DoubleSide} />
        </mesh>
        <Glow position={[0.9, 2.35, 0.1]} size={2.6} color={C.oak} opacity={0.45} />
        {/* Vase with dried stems */}
        <mesh position={[-1.0, 1.85, 0]}>
          <cylinderGeometry args={[0.16, 0.22, 0.55, 24]} />
          <meshStandardMaterial color={C.ink2} roughness={0.7} />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[-1.0 + (seed(i) - 0.5) * 0.3, 2.6, (seed(i + 3) - 0.5) * 0.2]} rotation={[(seed(i + 5) - 0.5) * 0.5, 0, (seed(i + 9) - 0.5) * 0.7]}>
            <cylinderGeometry args={[0.012, 0.012, 1.5, 5]} />
            <meshStandardMaterial color={C.oak} roughness={0.9} />
          </mesh>
        ))}
        {/* Books */}
        <Box p={[-0.2, 1.64, 0.05]} s={[0.7, 0.1, 0.5]} color={C.ink} />
        <Box p={[-0.2, 1.74, 0.05]} s={[0.62, 0.1, 0.46]} color={C.lineStrong} />
      </group>
      {/* Framed print above the sideboard */}
      <group position={[-3.0, 3.85, WALL_Z + 0.04]}>
        <Box p={[0, 0, 0]} s={[1.45, 1.9, 0.05]} color={C.void} rough={0.5} />
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.3, 1.75]} />
          <meshStandardMaterial map={printMap()} roughness={0.9} color="#ffffff" />
        </mesh>
      </group>
      {/* Soft contact shadow under the chair + a longer one cast forward-left by the window */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[chairPos[0], 0.014, chairPos[1]]}>
        <planeGeometry args={[1.9, 1.8]} />
        <meshBasicMaterial map={radialTexture()} color={C.void} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.55]} position={[chairPos[0] - 0.5, 0.013, chairPos[1] + 0.55]} scale={[1, 2.2, 1]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={radialTexture()} color={C.void} transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </>
  );
};

const ChairOnly: React.FC<{ readonly yaw: number; readonly pos: [number, number] }> = ({ yaw, pos }) => (
  <>
    <RoomLights />
    <Chair position={[pos[0], FEET, pos[1]]} rotation={[0, yaw, 0]} scale={CHAIR_SCALE} />
  </>
);

// The living-room set, rendered in two layers for a fake depth of field:
// the room (slightly out of focus) and the chair on top (crisp). Same camera in both.
export const FilmScene: React.FC<{
  readonly cam: Cam;
  readonly roomBlur?: number;
  readonly chairYaw?: number;
  readonly chairPos?: [number, number]; // x, z on the floor
}> = ({ cam, roomBlur = 2.4, chairYaw = 0, chairPos = [0, 0] }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ filter: roomBlur ? `blur(${roomBlur}px)` : undefined, transform: "scale(1.01)" }}>
      <Stage camera={{ position: [0, 1.5, 6], fov: 35 }} lights={false} fog={[11, 34]}>
        <CameraRig cam={cam} />
        <Room chairPos={chairPos} />
      </Stage>
    </AbsoluteFill>
    <AbsoluteFill>
      <Stage camera={{ position: [0, 1.5, 6], fov: 35 }} lights={false} background={null} fog={[11, 34]} fogColor={C.void}>
        <CameraRig cam={cam} />
        <ChairOnly yaw={chairYaw} pos={chairPos} />
      </Stage>
    </AbsoluteFill>
  </AbsoluteFill>
);

// Clean product-photo set: seamless light backdrop, soft contact shadow, even light.
export const StudioSet: React.FC<{ readonly cam: Cam; readonly chairYaw?: number }> = ({ cam, chairYaw = 0 }) => {
  return (
    <>
      <CameraRig cam={cam} />
      <hemisphereLight args={[C.ink, C.ink2, 1.1]} />
      <directionalLight position={[-3, 5, 6]} intensity={1.3} color={C.ink} />
      <directionalLight position={[4, 3, -4]} intensity={0.6} color={C.ink} />
      <Chair position={[0, FEET, 0]} rotation={[0, chairYaw, 0]} scale={CHAIR_SCALE} />
      {/* Seamless sweep: floor + far wall, flat colour so the background is perfectly even. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial color={C.ink} fog={false} />
      </mesh>
      <mesh position={[0, 0, -20]}>
        <planeGeometry args={[120, 80]} />
        <meshBasicMaterial color={C.ink} fog={false} />
      </mesh>
      {/* Soft contact shadow. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[2.0, 1.9]} />
        <meshBasicMaterial map={radialTexture()} color={C.void} transparent opacity={0.3} depthWrite={false} fog={false} />
      </mesh>
    </>
  );
};

// One continuous camera move across scenes 2 and 3, driven by absolute video time (seconds),
// so the cut between them is seamless. Handheld shake grows once the phone is filming.
export const filmCam = (tAbs: number): Cam => {
  const f = (tAbs - 3.6) * 30; // scene-2 local frame
  const k = Math.min(1, Math.max(0, (f - 28) / 26));
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const mix = (a: number, b: number) => a + (b - a) * e;
  return {
    angle: -0.62 + (tAbs - 3.6) * 0.11,
    dist: mix(5.2, 9.3) - Math.max(0, tAbs - 5.4) * 0.08,
    height: mix(1.3, 1.85),
    targetY: mix(1.05, 0.62),
    panX: mix(-1.0, 0),
    shake: mix(0.5, 1),
    t: tAbs,
  };
};

// Kept for backward compatibility with older imports.
export const FilmSet = FilmScene;
