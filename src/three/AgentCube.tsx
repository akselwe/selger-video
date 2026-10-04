import { RoundedBox } from "@react-three/drei";
import React from "react";
import { C } from "../theme";

type Props = {
  readonly position?: [number, number, number];
  readonly size?: number;
  readonly rotation?: [number, number, number];
  readonly glow?: number; // 0..3, emissive strength (bloom picks it up)
  readonly color?: string;
};

// The agent's mark: the blue square from Blue Pencil, as a glowing cube.
export const AgentCube: React.FC<Props> = ({
  position = [0, 0, 0],
  size = 1,
  rotation = [0, 0, 0],
  glow = 1.4,
  color = C.agent,
}) => {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[size, size, size]} radius={size * 0.08} smoothness={4}>
        <meshStandardMaterial
          color={C.agentDeep}
          emissive={color}
          emissiveIntensity={glow}
          roughness={0.25}
          metalness={0.2}
        />
      </RoundedBox>
    </group>
  );
};
