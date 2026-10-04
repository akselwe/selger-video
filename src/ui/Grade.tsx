import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";

// Cinematic finish on top of everything: vignette, a faint cool top light and film grain.
export const Grade: React.FC<{ readonly vignette?: number }> = ({ vignette = 0.75 }) => {
  const frame = useCurrentFrame();
  // Grain moves every frame, deterministically.
  const x = Math.floor(random(`gx${frame}`) * 200);
  const y = Math.floor(random(`gy${frame}`) * 200);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% -10%, rgba(139,170,255,0.10) 0%, rgba(0,0,0,0) 55%)",
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 50} />
        </filter>
        <rect x={-x} y={-y} width="120%" height="120%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
