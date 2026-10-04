import React, { useMemo } from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Glow } from "../three/Glow";
import { Stage } from "../three/Stage";
import { C } from "../theme";
import { clamp } from "../ui/anim";
import { Dust, Ripple, lerp } from "./s7-9/common";
import { DELIVER_SFX, MAP_IN, MapOverlay, MapStage, PARCEL_SFX } from "./s7-9/ParcelMap";
import { LAND, SoldBoard } from "./s7-9/SoldBoard";

// Scene 8: sold, delisted everywhere else, then the parcel's journey from Kris's mailbox in Oslo
// to Ola's door in Bergen. Frame 0 = 48.4 s (246 frames).
// Beats: chime/land 2, "Delisted" 37, "everywhere" 59, whip into the map 84, "mailbox" 124,
// lift-off 135, lands in Bergen 201, deliver sound 204.

// Dust drift accelerates toward the finale (energy rising into scene 9).
export const s8DustClock = (frame: number) => frame + Math.max(0, frame - 90) ** 2 * 0.03;

// Light shards blown out by the sale landing.
export const Sparks: React.FC<{ frame: number; start: number; count?: number }> = ({ frame, start, count = 46 }) => {
  const parts = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => {
        const a = random(`sp-a${i}`) * Math.PI * 2;
        const el = (random(`sp-e${i}`) - 0.5) * 0.9;
        return {
          dir: new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.75, el).normalize(),
          dist: 2.5 + random(`sp-d${i}`) * 5,
          len: 0.18 + random(`sp-l${i}`) * 0.5,
          ang: a,
          life: 26 + random(`sp-t${i}`) * 26,
        };
      }),
    [count],
  );
  const t = frame - start;
  if (t < 0) return null;
  return (
    <group>
      {parts.map((p, i) => {
        const k = Math.min(1, t / p.life);
        if (k >= 1) return null;
        const e = Easing.out(Easing.cubic)(k);
        const pos = p.dir.clone().multiplyScalar(0.4 + e * p.dist);
        return (
          <mesh key={i} position={[pos.x, pos.y, pos.z]} rotation={[0, 0, p.ang]}>
            <planeGeometry args={[p.len * (1.4 - e), 0.016]} />
            <meshBasicMaterial
              color={i % 5 === 0 ? C.ink : C.agent}
              transparent
              opacity={(1 - k) ** 1.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export const S8Backdrop: React.FC<{ frame: number }> = ({ frame }) => {
  const burst = interpolate(frame, [LAND, LAND + 4, LAND + 26], [0, 1, 0], clamp);
  const energy = interpolate(frame, [50, MAP_IN], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <Stage camera={{ position: [0, 0, 8] }} fog={[6, 24]}>
      <group rotation={[0, Math.sin(frame / 100) * 0.05, 0]} position={[0, 0, frame * 0.006]}>
        <Glow position={[0, 0.3, -3]} size={11} opacity={0.22 + energy * 0.18} color={C.agentDeep} />
        <Glow position={[0, 0.4, -1]} size={lerp(2, 18, burst)} opacity={burst * 0.9} color={C.agent} />
        <Glow position={[0, 0.4, -0.5]} size={lerp(1, 6, burst)} opacity={burst} color={C.ink} />
        <Ripple progress={(frame - LAND) / 34} from={0.4} to={9} position={[0, 0.4, -1.5]} opacity={0.3} width={0.03} />
        <Ripple progress={(frame - LAND - 5) / 40} from={0.4} to={7} position={[0, 0.4, -2]} opacity={0.25} width={0.025} />
        <Sparks frame={frame} start={LAND} count={32} />
        <Dust frame={s8DustClock(frame)} seed="s8" count={80} speed={0.006} opacity={0.75 + energy * 0.25} />
      </group>
    </Stage>
  );
};

// The journey part of the scene (map + overlays), also frozen and reused by scene 9.
export const ParcelJourney: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill>
    <MapStage frame={frame} />
    <MapOverlay frame={frame} />
  </AbsoluteFill>
);

export const S8Sold: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame, [LAND, LAND + 2, LAND + 14], [0, 0.32, 0], clamp);
  const fadeIn = interpolate(frame, [0, 3], [0, 1], clamp);
  // Whip from the receipt into the map.
  const exit = interpolate(frame, [MAP_IN - 4, MAP_IN + 8], [0, 1], clamp);
  const mapIn = interpolate(frame, [MAP_IN - 2, MAP_IN + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const whipBlur = interpolate(frame, [MAP_IN - 2, MAP_IN + 4, MAP_IN + 16], [0, 10, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <Sequence from={MAP_IN - 3} layout="none" name="SFX swish">
        <Audio src={staticFile("audio/sfx/swish.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={PARCEL_SFX} layout="none" name="SFX parcel">
        <Audio src={staticFile("audio/sfx/parcel.mp3")} volume={0.8} />
      </Sequence>
      <Sequence from={DELIVER_SFX} layout="none" name="SFX deliver">
        <Audio src={staticFile("audio/sfx/deliver.mp3")} volume={0.8} />
      </Sequence>
      {frame < MAP_IN + 12 ? (
        <>
          <AbsoluteFill style={{ opacity: fadeIn * (1 - mapIn) }}>
            <S8Backdrop frame={frame} />
          </AbsoluteFill>
          <SoldBoard frame={frame} fps={fps} exit={exit} />
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse at 50% 42%, rgba(235,237,239,${flash}) 0%, rgba(139,170,255,${flash * 0.6}) 35%, rgba(7,8,10,0) 75%)`,
              pointerEvents: "none",
            }}
          />
        </>
      ) : null}
      {frame >= MAP_IN - 2 ? (
        <AbsoluteFill style={{ opacity: mapIn, filter: whipBlur > 0.2 ? `blur(${whipBlur}px)` : undefined }}>
          <ParcelJourney frame={frame} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
