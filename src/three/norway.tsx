// Shared 3D map of Norway built from real elevation data (AWS Terrain Tiles, zoom 5)
// and the Natural Earth 50m coastline. Used by S6 (negotiation) and S8 (parcel delivery).
import { Line } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import nordics from "../data/nordics.json";
import terrain from "../data/terrain.json";
import { C } from "../theme";
import { Glow } from "./Glow";

// ---------- Projection: lon/lat → scene units. The map lies on XZ, north = −Z. ----------
export const K = 0.5; // scene units per degree of latitude
export const LON0 = 13;
export const LAT0 = 63;
const COS = Math.cos((LAT0 * Math.PI) / 180);
export const geo = (lon: number, lat: number, y = 0) => new THREE.Vector3((lon - LON0) * COS * K, y, -(lat - LAT0) * K);

// Vertical exaggeration: 1 km of real height = 0.11 scene units (≈ 25× real).
const EXAG = 0.11 / 1000;
const SEA_Y = -0.012;

const T = terrain as { lon0: number; lon1: number; lat0: number; lat1: number; w: number; h: number; unit: number; data: number[] };

// Lightly smoothed elevations (the raw 5 km grid looks spiky up close), faded to sea at the data edges.
const SMOOTH: Float32Array = (() => {
  const out = new Float32Array(T.w * T.h);
  for (let j = 0; j < T.h; j++) {
    for (let i = 0; i < T.w; i++) {
      const raw = T.data[j * T.w + i] * T.unit;
      let sum = 0;
      let n = 0;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const x = Math.min(T.w - 1, Math.max(0, i + di));
          const y = Math.min(T.h - 1, Math.max(0, j + dj));
          sum += T.data[y * T.w + x] * T.unit;
          n++;
        }
      }
      // Keep the coastline crisp: sea stays sea, land is smoothed.
      let e = raw > 0 ? Math.max(1, sum / n) : raw;
      const edge = Math.min(i, j, T.w - 1 - i, T.h - 1 - j) / 18; // ~18 cells ≈ 1.5° fade
      if (edge < 1) e = e > 0 ? e * edge - (1 - edge) * 40 : e;
      out[j * T.w + i] = e;
    }
  }
  return out;
})();

const elevAt = (lon: number, lat: number) => {
  const fx = ((lon - T.lon0) / (T.lon1 - T.lon0)) * (T.w - 1);
  const fy = ((T.lat1 - lat) / (T.lat1 - T.lat0)) * (T.h - 1);
  const x0 = Math.max(0, Math.min(T.w - 2, Math.floor(fx)));
  const y0 = Math.max(0, Math.min(T.h - 2, Math.floor(fy)));
  const tx = Math.min(1, Math.max(0, fx - x0));
  const ty = Math.min(1, Math.max(0, fy - y0));
  const e = (x: number, y: number) => SMOOTH[y * T.w + x];
  return (e(x0, y0) * (1 - tx) + e(x0 + 1, y0) * tx) * (1 - ty) + (e(x0, y0 + 1) * (1 - tx) + e(x0 + 1, y0 + 1) * tx) * ty;
};

/** Terrain surface height (scene units) at a lon/lat. */
export const heightAt = (lon: number, lat: number) => {
  const e = elevAt(lon, lat);
  return e > 0 ? e * EXAG : SEA_Y;
};

/** A point on the terrain surface, lifted by `lift` scene units. */
export const surface = (lon: number, lat: number, lift = 0) => geo(lon, lat, Math.max(heightAt(lon, lat), 0) + lift);

// ---------- Places ----------
export type Place = { name: string; lon: number; lat: number };
export const PLACES = {
  oslo: { name: "Oslo", lon: 10.75, lat: 59.91 },
  bergen: { name: "Bergen", lon: 5.33, lat: 60.39 },
  stavanger: { name: "Stavanger", lon: 5.73, lat: 58.97 },
  trondheim: { name: "Trondheim", lon: 10.4, lat: 63.43 },
  tromso: { name: "Tromsø", lon: 18.96, lat: 69.65 },
} satisfies Record<string, Place>;

// ---------- Norway mask (point in polygon) ----------
const NOR = (nordics as Record<string, number[][][]>).Norway;
const inRing = (lon: number, lat: number, ring: number[][]) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inNorway = (lon: number, lat: number) => NOR.some((r) => inRing(lon, lat, r));

// ---------- Terrain mesh ----------
const lerpColor = (stops: [number, THREE.Color][], v: number) => {
  if (v <= stops[0][0]) return stops[0][1].clone();
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [a, ca] = stops[i - 1];
      const [b, cb] = stops[i];
      return ca.clone().lerp(cb, (v - a) / (b - a));
    }
  }
  return stops[stops.length - 1][1].clone();
};

const NOR_RAMP: [number, THREE.Color][] = [
  [0, new THREE.Color("#1c2a52")],
  [300, new THREE.Color("#26407e")],
  [800, new THREE.Color("#3f62b8")],
  [1250, new THREE.Color("#8ea6e8")],
  [1500, new THREE.Color("#e6ecff")],
];
const OTHER_RAMP: [number, THREE.Color][] = [
  [0, new THREE.Color("#15181f")],
  [600, new THREE.Color("#22262f")],
  [1200, new THREE.Color("#3a3f4b")],
];
const SEA = new THREE.Color("#070b16");
const SEA_SHALLOW = new THREE.Color("#0c1530");

let cachedGeometry: THREE.BufferGeometry | null = null;
const buildGeometry = () => {
  if (cachedGeometry) return cachedGeometry;
  const { w, h } = T;
  const pos = new Float32Array(w * h * 3);
  const col = new Float32Array(w * h * 3);
  for (let j = 0; j < h; j++) {
    const lat = T.lat1 - ((T.lat1 - T.lat0) * j) / (h - 1);
    for (let i = 0; i < w; i++) {
      const lon = T.lon0 + ((T.lon1 - T.lon0) * i) / (w - 1);
      const e = SMOOTH[j * w + i];
      const p = geo(lon, lat, e > 0 ? e * EXAG : SEA_Y);
      const k = (j * w + i) * 3;
      pos[k] = p.x;
      pos[k + 1] = p.y;
      pos[k + 2] = p.z;
      const c = e > 0 ? lerpColor(inNorway(lon, lat) ? NOR_RAMP : OTHER_RAMP, e) : SEA.clone().lerp(SEA_SHALLOW, Math.max(0, 1 + e / 120) * 0.6);
      col[k] = c.r;
      col[k + 1] = c.g;
      col[k + 2] = c.b;
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < h - 1; j++) {
    for (let i = 0; i < w - 1; i++) {
      const a = j * w + i;
      const b = a + 1;
      const c = a + w;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  cachedGeometry = g;
  return g;
};

// Coastline draped over the terrain.
let cachedCoast: THREE.Vector3[][] | null = null;
const coastLines = () => {
  if (cachedCoast) return cachedCoast;
  cachedCoast = NOR.slice(0, 14).map((ring) => ring.map(([lon, lat]) => geo(lon, lat, Math.max(heightAt(lon, lat), 0) + 0.006)));
  return cachedCoast;
};

/** The 3D terrain of Scandinavia with Norway highlighted, lit like a relief map. */
export const NorwayTerrain: React.FC<{ readonly coastOpacity?: number }> = ({ coastOpacity = 0.55 }) => {
  const geometry = useMemo(buildGeometry, []);
  const coast = useMemo(coastLines, []);
  const grid = useMemo(() => {
    const out: THREE.Vector3[][] = [];
    for (let lon = -4; lon <= 36; lon += 2) out.push([geo(lon, 54, SEA_Y + 0.002), geo(lon, 74, SEA_Y + 0.002)]);
    for (let lat = 54; lat <= 74; lat += 1) out.push([geo(-4, lat, SEA_Y + 0.002), geo(36, lat, SEA_Y + 0.002)]);
    return out;
  }, []);
  return (
    <group>
      {/* Relief lighting: classic north-west hillshade plus a cool fill */}
      <directionalLight position={[-6, 5, -4]} intensity={2.2} color="#dfe6ff" />
      <hemisphereLight args={["#9fb4ff", "#05070d", 0.55]} />
      {/* Open sea beyond the data */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA_Y - 0.004, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={SEA} roughness={0.92} metalness={0} />
      </mesh>
      {grid.map((pts, i) => (
        <Line key={i} points={pts} color={C.agentSoft} lineWidth={1} transparent opacity={0.35} />
      ))}
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
      </mesh>
      {coast.map((pts, i) => (
        <Line key={i} points={pts} color={C.agent} lineWidth={1.4} transparent opacity={coastOpacity} />
      ))}
    </group>
  );
};

/** A small lit house standing on the terrain. */
export const House: React.FC<{
  readonly place: Place;
  readonly scale?: number;
  readonly windowGlow?: number;
  readonly beacon?: boolean;
}> = ({ place, scale = 1, windowGlow = 0.55, beacon = true }) => {
  const p = surface(place.lon, place.lat);
  return (
    <group position={p} scale={scale}>
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[0.11, 0.09, 0.1]} />
        <meshStandardMaterial color={C.ink} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.125, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.095, 0.075, 4]} />
        <meshStandardMaterial color="#c9ccd2" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.045, 0.051]}>
        <planeGeometry args={[0.035, 0.035]} />
        <meshBasicMaterial color={C.mark} />
      </mesh>
      <Glow position={[0, 0.06, 0.06]} size={0.35} color={C.mark} opacity={windowGlow} />
      {beacon ? (
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.3, 6]} />
          <meshBasicMaterial color={C.ink} transparent opacity={0.4} />
        </mesh>
      ) : null}
    </group>
  );
};

/** Flight arc between two surface points, height grows with distance. */
export const arcBetween = (a: THREE.Vector3, b: THREE.Vector3, lift = 0.35) => {
  const mid = a.clone().lerp(b, 0.5);
  mid.y = Math.max(a.y, b.y) + lift + a.distanceTo(b) * 0.22;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
};

/** Project a 3D point to 1920×1080 screen pixels for a camera at `pos` looking at `look`. */
const projector = new THREE.PerspectiveCamera(34, 1920 / 1080, 0.05, 200);
export const projectWith = (p: THREE.Vector3, pos: THREE.Vector3, look: THREE.Vector3, fov: number) => {
  projector.fov = fov;
  projector.position.copy(pos);
  projector.lookAt(look);
  projector.updateMatrixWorld();
  projector.updateProjectionMatrix();
  const v = p.clone().project(projector);
  return { x: ((v.x + 1) / 2) * 1920, y: ((1 - v.y) / 2) * 1080, behind: v.z > 1 };
};
