import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { C } from "../theme";

type Props = {
  readonly children: React.ReactNode;
  readonly camera?: { position: [number, number, number]; fov?: number };
  readonly fog?: [number, number];
  // Optional (defaults keep the original look):
  readonly lights?: boolean; // false = no built-in ambient/directional/rim lights
  readonly background?: string | null; // null = transparent canvas (for layering)
  readonly fogColor?: string;
};

// Shared cinematic 3D stage: near-black void, fog and a cool rim light.
// (Postprocessing bloom does not draw in Remotion's renderer, so glow comes from
// additive sprites in the scene and the CSS Grade overlay.)
export const Stage: React.FC<Props> = ({ children, camera, fog = [8, 26], lights = true, background = C.void, fogColor }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: background ?? "transparent" }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: camera?.position ?? [0, 0, 8], fov: camera?.fov ?? 35 }}
      >
        {background ? <color attach="background" args={[background]} /> : null}
        <fog attach="fog" args={[fogColor ?? background ?? C.void, fog[0], fog[1]]} />
        {lights ? (
          <>
            <ambientLight intensity={0.35} />
            <directionalLight position={[4, 6, 5]} intensity={1.6} />
            <pointLight position={[-6, 2, -4]} intensity={30} color={C.agentDeep} />
          </>
        ) : null}
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
