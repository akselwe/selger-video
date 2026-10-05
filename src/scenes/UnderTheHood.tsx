import { Line } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { AgentCube } from "../three/AgentCube";
import { Glow } from "../three/Glow";
import { Stage } from "../three/Stage";
import { C, SANS } from "../theme";
import { clamp, ease, pop } from "../ui/anim";
import { AgentMark, Label } from "../ui/kit";

// "Under the hood": Teo at the centre, the ten tools around it light up one by one.
export const SPONSORS: { name: string; what: string }[] = [
  { name: "ElevenLabs", what: "Teo's voice and phone calls" },
  { name: "Mastra", what: "The agent brain and workflows" },
  { name: "Exa", what: "Market research and prices" },
  { name: "Kernel", what: "Cloud browser that lists on FINN" },
  { name: "Neon", what: "Items, offers and buyers" },
  { name: "AgentMail", what: "Teo's own inbox for buyers" },
  { name: "Fly.io Sprites", what: "Sandboxes for video processing" },
  { name: "Executor", what: "Tool gateway for every integration" },
  { name: "assistant-ui", what: "The chat app you sell from" },
  { name: "CodeRabbit", what: "Reviews every line we ship" },
];

const FOV = 32;
const camAt = (frame: number) => {
  const a = interpolate(frame, [0, 240], [-0.12, 0.12], clamp);
  const d = interpolate(frame, [0, 30], [12.5, 10.2], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  return new THREE.Vector3(Math.sin(a) * d, 0.3, Math.cos(a) * d);
};
const LOOK = new THREE.Vector3(0, -0.35, 0);

const Rig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.fov = FOV;
    c.position.copy(camAt(frame));
    c.lookAt(LOOK);
    c.updateProjectionMatrix();
  }, [camera, frame]);
  return null;
};

const projector = new THREE.PerspectiveCamera(FOV, 1920 / 1080, 0.1, 100);
const project = (p: THREE.Vector3, frame: number) => {
  projector.position.copy(camAt(frame));
  projector.lookAt(LOOK);
  projector.updateMatrixWorld();
  projector.updateProjectionMatrix();
  const v = p.clone().project(projector);
  return { x: ((v.x + 1) / 2) * 1920, y: ((1 - v.y) / 2) * 1080 };
};

// Nodes on a tilted ring around Teo, spinning slowly.
const nodePos = (i: number, frame: number) => {
  const th = (i / SPONSORS.length) * Math.PI * 2 + frame * 0.0015 + Math.PI / 2;
  return new THREE.Vector3(Math.cos(th) * 2.7, -0.35 + Math.sin(th) * 1.8, Math.sin(th * 2) * 0.35);
};

const START = 8; // first node lights up
// Frames between nodes: scales with the scene length (8 s → 19, 5 s → 10).
const stepFor = (duration: number) => Math.max(8, Math.floor((duration - 50) / SPONSORS.length));

export const UnderTheHood: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const step = stepFor(durationInFrames);
  const litAt = (i: number) => START + i * step;
  const fade = Math.min(interpolate(frame, [0, 8], [0, 1], clamp), interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], clamp));
  const allOn = ease(frame, litAt(SPONSORS.length - 1) + 10, 16);
  return (
    <AbsoluteFill style={{ backgroundColor: C.void, opacity: fade }}>
      <Stage camera={{ position: [0, 2.2, 12], fov: FOV }} fog={[9, 26]}>
        <Rig frame={frame} />
        {/* dust */}
        {new Array(160).fill(0).map((_, i) => (
          <mesh key={i} position={[(random(`x${i}`) - 0.5) * 22, (random(`y${i}`) - 0.5) * 10, (random(`z${i}`) - 0.5) * 16 - 2]}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshBasicMaterial color={C.agent} transparent opacity={0.5} />
          </mesh>
        ))}
        <group position={[0, -0.35, 0]}><Glow size={3.6 + allOn * 1.4} color={C.agent} opacity={0.6 + allOn * 0.3} />
        <AgentCube size={0.8} rotation={[0.55, frame * 0.025, 0.35]} glow={0.7 + allOn * 0.5} /></group>
        {SPONSORS.map((s, i) => {
          const p = nodePos(i, frame);
          const t = frame - litAt(i);
          const on = interpolate(t, [0, 8], [0, 1], clamp);
          const beam = interpolate(t, [-6, 4], [0, 1], clamp);
          const head = new THREE.Vector3(0, -0.35, 0).lerp(p, beam);
          const flash = interpolate(t, [0, 3, 14], [0, 1, 0], clamp);
          return (
            <group key={s.name}>
              {beam > 0 ? <Line points={[new THREE.Vector3(0, -0.35, 0), head]} color={C.agent} lineWidth={2} transparent opacity={0.35 + flash * 0.5} /> : null}
              <mesh position={p} scale={0.6 + on * 0.4 + flash * 0.4}>
                <sphereGeometry args={[0.13, 24, 24]} />
                <meshStandardMaterial color={on > 0 ? C.agent : C.line} emissive={C.agent} emissiveIntensity={on * 0.9} />
              </mesh>
              <Glow position={[p.x, p.y, p.z]} size={0.9 + flash * 1.2} color={C.agent} opacity={on * 0.7} />
            </group>
          );
        })}
      </Stage>
      {/* labels that stick to the nodes */}
      {SPONSORS.map((s, i) => {
        const pp = project(nodePos(i, frame), frame);
        const k = pop(frame, litAt(i), fps, 15);
        const o = interpolate(frame - litAt(i), [0, 6], [0, 1], clamp);
        const right = pp.x >= 960;
        return (
          <div
            key={s.name}
            style={{
              position: "absolute",
              left: right ? pp.x + 30 : undefined,
              right: right ? undefined : 1920 - pp.x + 30,
              top: pp.y - 30,
              opacity: o,
              transform: `scale(${0.8 + 0.2 * k})`,
              transformOrigin: right ? "left center" : "right center",
              textAlign: right ? "left" : "right",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: C.ink, textShadow: "0 2px 14px #000" }}>{s.name}</div>
            <div style={{ fontFamily: SANS, fontSize: 23, color: C.ink2, textShadow: "0 2px 10px #000" }}>{s.what}</div>
          </div>
        );
      })}
      {/* title */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", opacity: ease(frame, 2, 12) }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <AgentMark size={12} />
          <Label size={24} color={C.agent}>
            Under the hood
          </Label>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, letterSpacing: "-0.03em", color: C.ink, marginTop: 6 }}>
          Ten tools. One agent.
        </div>
      </div>
    </AbsoluteFill>
  );
};
