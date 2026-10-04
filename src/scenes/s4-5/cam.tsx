// Camera helpers for scenes 4–5: a frame-driven camera path, a rig that applies it inside
// the ThreeCanvas, and a projector so crisp 2D labels can sit exactly on 3D points.
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type V3 = [number, number, number];
export type Cam = { pos: V3; tgt: V3; fov: number };

const W = 1920;
const H = 1080;

// Smooth (velocity-continuous) path through evenly spaced keyframes. t in 0..1.
export const camPath = (t: number, keys: { pos: V3; tgt: V3 }[], fov = 35): Cam => {
  const pc = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal");
  const tc = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.tgt)), false, "centripetal");
  const u = Math.min(1, Math.max(0, t));
  const p = pc.getPoint(u);
  const g = tc.getPoint(u);
  return { pos: [p.x, p.y, p.z], tgt: [g.x, g.y, g.z], fov };
};

const tmp = new THREE.PerspectiveCamera(35, W / H, 0.1, 200);

const setup = (cam: Cam) => {
  tmp.fov = cam.fov;
  tmp.aspect = W / H;
  tmp.position.set(...cam.pos);
  tmp.up.set(0, 1, 0);
  tmp.lookAt(...cam.tgt);
  tmp.updateProjectionMatrix();
  tmp.updateMatrixWorld(true);
};

// World point -> screen pixels (1920×1080).
export const project = (cam: Cam, p: V3) => {
  setup(cam);
  const v = new THREE.Vector3(...p).project(tmp);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
};

export const CameraRig: React.FC<{ readonly cam: Cam }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.fov = cam.fov;
  camera.position.set(...cam.pos);
  camera.up.set(0, 1, 0);
  camera.lookAt(...cam.tgt);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return null;
};
