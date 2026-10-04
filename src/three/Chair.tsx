import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { C } from "../theme";

type Props = {
  readonly position?: [number, number, number];
  readonly rotation?: [number, number, number];
  readonly scale?: number;
  readonly wireframe?: number; // 0 = solid oak, 1 = blue scan lines
};

// --- Procedural oiled-oak grain (built once, shared). ---
let grain: { map: THREE.CanvasTexture; rough: THREE.CanvasTexture } | null = null;
const makeGrain = () => {
  if (grain) return grain;
  const W = 512;
  const H = 512;
  const seed = (n: number) => {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };
  const paint = (ctx: CanvasRenderingContext2D, base: string, dark: string, light: string) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    // Long grain lines running along X, gently waving.
    for (let i = 0; i < 150; i++) {
      const y0 = seed(i) * H;
      const amp = 2 + seed(i + 9) * 9;
      const freq = 0.004 + seed(i + 3) * 0.01;
      const w = 0.6 + seed(i + 5) * 2.4;
      ctx.strokeStyle = seed(i + 7) > 0.35 ? dark : light;
      ctx.globalAlpha = 0.04 + seed(i + 11) * 0.11;
      ctx.lineWidth = w;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y = y0 + Math.sin(x * freq + i) * amp + Math.sin(x * freq * 3.1 + i * 2) * amp * 0.25;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Oak "rays": short flecks.
    for (let i = 0; i < 260; i++) {
      ctx.globalAlpha = 0.05 + seed(i + 400) * 0.08;
      ctx.fillStyle = light;
      ctx.fillRect(seed(i + 300) * W, seed(i + 200) * H, 4 + seed(i + 100) * 14, 1.2);
    }
    ctx.globalAlpha = 1;
  };
  const mk = (base: string, dark: string, light: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    paint(canvas.getContext("2d")!, base, dark, light);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  };
  const map = mk(C.oak, "#6b4a2b", "#e2c39d");
  map.colorSpace = THREE.SRGBColorSpace;
  const rough = mk("#9a9a9a", "#d0d0d0", "#6a6a6a");
  grain = { map, rough };
  return grain;
};

// Rotated copy so the grain runs along a leg's length.
let grainLong: { map: THREE.Texture; rough: THREE.Texture } | null = null;
const makeGrainLong = () => {
  if (grainLong) return grainLong;
  const g = makeGrain();
  const rot = (t: THREE.Texture) => {
    const c = t.clone();
    c.center.set(0.5, 0.5);
    c.rotation = Math.PI / 2;
    c.repeat.set(1, 0.35);
    c.needsUpdate = true;
    return c;
  };
  grainLong = { map: rot(g.map), rough: rot(g.rough) };
  return grainLong;
};

// One-piece curved backrest: an arc band, extruded upwards, with soft bevels.
const makeBackGeometry = () => {
  const R = 0.285;
  const th = 0.024;
  const a0 = (35 * Math.PI) / 180;
  const a1 = (145 * Math.PI) / 180;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, R, a0, a1, false);
  shape.absarc(0, 0, R - th, a1, a0, true);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.007,
    bevelSegments: 4,
    curveSegments: 48,
  });
  // UVs: map around the arc so the grain follows the curve.
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const ang = Math.atan2(pos.getY(i), pos.getX(i));
    uv.setXY(i, ang * 0.9, pos.getZ(i) * 3 + 0.2);
  }
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
};

const Leg: React.FC<{ x: number; z: number; mat: React.ReactNode }> = ({ x, z, mat }) => (
  <mesh position={[x, -0.235, z]} rotation={[z > 0 ? 0.06 : -0.06, 0, x > 0 ? -0.06 : 0.06]}>
    <cylinderGeometry args={[0.022, 0.0145, 0.47, 24]} />
    {mat}
  </mesh>
);

// The HAY "About A Chair" (AAC22)-style dining chair in oiled oak: rounded seat, four tapered
// splayed legs, an apron and side stretchers, and a thick one-piece curved backrest on two posts.
// Units: about 1 = 1 metre. Seat top at y ≈ 0.02, feet at y ≈ -0.46.
export const Chair: React.FC<Props> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, wireframe = 0 }) => {
  const backGeo = useMemo(makeBackGeometry, []);
  const g = makeGrain();
  const gl = makeGrainLong();
  const wf = wireframe > 0.5;
  const common = {
    roughness: 0.52,
    metalness: 0,
    wireframe: wf,
    emissive: wireframe > 0 ? C.agent : "#000000",
    emissiveIntensity: wireframe * 1.2,
    transparent: true,
    opacity: 1 - wireframe * 0.3,
  };
  const flat = <meshStandardMaterial {...common} map={wireframe > 0 ? null : g.map} roughnessMap={g.rough} color={wireframe > 0 ? C.oak : "#ffffff"} />;
  const long = <meshStandardMaterial {...common} map={wireframe > 0 ? null : gl.map} roughnessMap={gl.rough} color={wireframe > 0 ? C.oak : "#ffffff"} />;
  const back = (
    <meshStandardMaterial {...common} map={wireframe > 0 ? null : g.map} roughnessMap={g.rough} color={wireframe > 0 ? C.oak : "#ffffff"} side={THREE.DoubleSide} />
  );
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Seat: softly rounded slab */}
      <RoundedBox args={[0.47, 0.036, 0.45]} radius={0.016} smoothness={5} position={[0, 0.002, 0]}>
        {flat}
      </RoundedBox>
      {/* Apron under the seat */}
      <mesh position={[0, -0.04, 0.19]}>
        <boxGeometry args={[0.38, 0.045, 0.02]} />
        {flat}
      </mesh>
      <mesh position={[0, -0.04, -0.19]}>
        <boxGeometry args={[0.38, 0.045, 0.02]} />
        {flat}
      </mesh>
      <mesh position={[0.205, -0.04, 0]}>
        <boxGeometry args={[0.02, 0.045, 0.34]} />
        {flat}
      </mesh>
      <mesh position={[-0.205, -0.04, 0]}>
        <boxGeometry args={[0.02, 0.045, 0.34]} />
        {flat}
      </mesh>
      {/* Legs */}
      <Leg x={0.205} z={0.19} mat={long} />
      <Leg x={-0.205} z={0.19} mat={long} />
      <Leg x={0.205} z={-0.19} mat={long} />
      <Leg x={-0.205} z={-0.19} mat={long} />
      {/* Side stretchers */}
      <mesh position={[0.218, -0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0105, 0.0105, 0.42, 12]} />
        {long}
      </mesh>
      <mesh position={[-0.218, -0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0105, 0.0105, 0.42, 12]} />
        {long}
      </mesh>
      {/* Back posts */}
      <mesh position={[0.175, 0.17, -0.148]} rotation={[-0.1, 0, 0]}>
        <cylinderGeometry args={[0.017, 0.02, 0.32, 16]} />
        {long}
      </mesh>
      <mesh position={[-0.175, 0.17, -0.148]} rotation={[-0.1, 0, 0]}>
        <cylinderGeometry args={[0.017, 0.02, 0.32, 16]} />
        {long}
      </mesh>
      {/* Curved one-piece backrest (arc band extruded upward) */}
      <mesh geometry={backGeo} position={[0, 0.3, 0.07]} rotation={[-Math.PI / 2, 0, 0]}>
        {back}
      </mesh>
    </group>
  );
};
