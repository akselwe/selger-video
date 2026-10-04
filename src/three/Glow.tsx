import { Billboard } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";

// Soft additive light sprite: our stand-in for bloom.
const makeTexture = () => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.45, "rgba(255,255,255,0.14)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

let shared: THREE.CanvasTexture | null = null;

export const Glow: React.FC<{
  readonly position?: [number, number, number];
  readonly size?: number;
  readonly color?: string;
  readonly opacity?: number;
}> = ({ position = [0, 0, 0], size = 3, color = "#8baaff", opacity = 0.8 }) => {
  const map = useMemo(() => {
    shared ??= makeTexture();
    return shared;
  }, []);
  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial
          map={map}
          color={color}
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </Billboard>
  );
};
