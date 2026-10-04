import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AgentCube } from "./three/AgentCube";
import { Chair } from "./three/Chair";
import { Glow } from "./three/Glow";
import { Stage } from "./three/Stage";
import { Grade } from "./ui/Grade";

// Scratch composition for checking the 3D look.
export const Lab: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Stage camera={{ position: [0, 0.2, 5] }}>
        <Glow position={[-1.4, 0, -0.6]} size={2.6} opacity={0.7} />
        <AgentCube position={[-1.4, 0, 0]} size={0.8} rotation={[0.5, frame * 0.02, 0.2]} />
        <Chair position={[1.2, -0.3, 0]} rotation={[0.25, -0.6 + frame * 0.01, 0]} scale={2.2} />
      </Stage>
      <Grade />
    </AbsoluteFill>
  );
};
