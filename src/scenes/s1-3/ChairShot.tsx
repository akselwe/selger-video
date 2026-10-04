import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Stage } from "../../three/Stage";
import { FilmScene, StudioSet, type Cam } from "./FilmSet";

// Pre-renders the "phone frames" (raw, from the dark set) and the cleaned product photos.
// Frame index = shot index. Render with:
//   npx remotion render ChairShot public/frames --sequence --image-format=png
export const RAW_SHOTS: Cam[] = [
  { angle: -0.55, dist: 7.0, height: 1.6, roll: 0.06, panX: 0.25 },
  { angle: -0.2, dist: 6.2, height: 1.3, roll: -0.04, panX: -0.2 },
  { angle: 0.35, dist: 6.6, height: 1.9, roll: 0.09, panX: 0.1 },
  { angle: 0.75, dist: 7.2, height: 1.4, roll: -0.07, panX: -0.3 },
  { angle: -0.95, dist: 6.8, height: 2.2, roll: 0.03, panX: 0.35 },
  { angle: 0.05, dist: 7.6, height: 1.1, roll: -0.1, panX: 0.2 },
  { angle: 0.95, dist: 6.6, height: 1.7, roll: 0.05, panX: 0 },
  { angle: -0.35, dist: 6.0, height: 2.4, roll: -0.05, panX: -0.15 },
  { angle: 0.55, dist: 6.4, height: 1.2, roll: 0.11, panX: 0.3 },
  { angle: -0.75, dist: 7.6, height: 1.5, roll: -0.08, panX: -0.1 },
];

// Clean versions of the six "sharp" frames (raw indices 0, 2, 3, 5, 7, 8).
export const CLEAN_SOURCE = [0, 2, 3, 5, 7, 8];

export const ChairShot: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < RAW_SHOTS.length) {
    return (
      <AbsoluteFill>
        <FilmScene cam={{ ...RAW_SHOTS[frame], shake: 0 }} roomBlur={1.2} />
      </AbsoluteFill>
    );
  }
  const src = RAW_SHOTS[CLEAN_SOURCE[(frame - RAW_SHOTS.length) % CLEAN_SOURCE.length]];
  return (
    <AbsoluteFill>
      <Stage fog={[40, 90]} lights={false}>
        <StudioSet cam={{ angle: src.angle * 0.8, dist: 5.5, height: 1.5, targetY: 1.08 }} />
      </Stage>
    </AbsoluteFill>
  );
};
