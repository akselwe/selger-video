import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AgentCube } from "../three/AgentCube";
import { Glow } from "../three/Glow";
import { Stage } from "../three/Stage";
import { C, MONO, SANS } from "../theme";
import { clamp } from "../ui/anim";
import { Dust, Ripple, at, lerp, prog } from "./s7-9/common";
import { S8_DUR } from "./s7-9/SoldBoard";
import { ParcelJourney } from "./S8Sold";

// Scene 9: everything collapses into the agent cube, which becomes the wordmark.
// Frame 0 = 56.6 s (177 frames). Beats: "Selger." 18, music hit 30, "Point." 49, "Shoot." 73,
// boom 96 / "Sold." 97 (lands on the boom), fade to black from 169.
const F = at(56.6);
const SELGER = F(57.28);
const HIT = F(57.6);
const POINT = F(58.24);
const SHOOT = F(59.04);
const BOOM = F(59.8);
const DUR = 177;

// The wordmark row sits at y = 400; the cube lives there too, so the swap is seamless.
const MARK_Y = 400;
const PX_PER_UNIT = 1712.6 / 8; // camera z = 8, fov 35, 1080 px high
const CUBE_Y = (540 - MARK_Y) / PX_PER_UNIT;
const SQ = 110; // the 2D square, same on-screen size as the cube's front face
const TEXT_W = 486; // width of "Selger" at 160 px (checked on stills)
const WORD_GAP = 36;
const SLIDE = (WORD_GAP + TEXT_W) / 2; // the square's offset from its final spot when centred

export const shakeAt = (frame: number, start: number, dur: number, amp: number, seed: string) => {
  const k = (frame - start) / dur;
  if (k < 0 || k >= 1) return [0, 0];
  const a = amp * (1 - k) ** 2;
  return [(random(`${seed}x${frame}`) - 0.5) * 2 * a, (random(`${seed}y${frame}`) - 0.5) * 2 * a];
};

const Backdrop: React.FC<{ frame: number; shake: number[] }> = ({ frame, shake }) => {
  const suck = interpolate(frame, [0, 17], [0, 1], clamp);
  const grow = interpolate(frame, [0, 14], [0.15, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const settle = interpolate(frame, [0, SELGER], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const cubeVisible = frame <= SELGER;
  const flash = interpolate(frame, [SELGER - 1, SELGER + 1, SELGER + 11], [0, 1, 0], clamp);
  const hit = interpolate(frame, [HIT, HIT + 3, HIT + 30], [0, 1, 0], clamp);
  const boom = interpolate(frame, [BOOM, BOOM + 2, BOOM + 26], [0, 1, 0], clamp);
  const absorb = Math.sin(frame * 0.9) * 0.04 * (1 - settle);
  const hold = interpolate(frame, [HIT, DUR], [0, 1], clamp);
  return (
    <Stage camera={{ position: [0, 0, 8] }} fog={[6, 24]} background={frame < 17 ? null : C.void}>
      <group position={[shake[0] / PX_PER_UNIT, -shake[1] / PX_PER_UNIT, 0]}>
        {/* dust from scene 8, pulled into the cube; then a calm field drifting outward */}
        {frame < 20 ? (
          <Dust frame={frame} seed="s9in" count={80} speed={0.004} converge={suck} target={[0, CUBE_Y, 0]} opacity={interpolate(frame, [0, 6], [0, 1], clamp)} />
        ) : null}
        {frame >= HIT - 2 ? (
          <Dust frame={frame} seed="s9" count={70} speed={0.002} burst={Easing.out(Easing.cubic)(hold) * 0.4} opacity={interpolate(frame, [HIT - 2, HIT + 10], [0, 0.6], clamp)} />
        ) : null}
        {cubeVisible ? (
          <>
            <Glow position={[0, CUBE_Y, -0.4]} size={lerp(1.2, 3.2, grow) + absorb * 10} opacity={0.35 + suck * 0.45} color={C.agent} />
            <AgentCube
              position={[0, CUBE_Y, 0]}
              size={0.5 * (grow + absorb)}
              rotation={[(1 - settle) * 0.9, (1 - settle) * Math.PI * 3, (1 - settle) * 0.4]}
              glow={0.9 + suck * 0.5}
            />
          </>
        ) : null}
        <Glow position={[0, CUBE_Y, 0.5]} size={lerp(1, 7, flash)} opacity={flash * 0.8} color={C.agent} />
        <Glow position={[0, CUBE_Y, -1]} size={lerp(3, 16, hit)} opacity={hit * 0.5} color={C.agent} />
        <Glow position={[0, CUBE_Y, -0.5]} size={lerp(1, 5, hit)} opacity={hit * 0.3} color={C.ink} />
        <Ripple progress={(frame - HIT) / 34} from={0.4} to={11} position={[0, CUBE_Y, -1.5]} opacity={0.16} width={0.03} />
        <Glow position={[0, -0.4, -1]} size={lerp(3, 14, boom)} opacity={boom * 0.35} color={C.agent} />
        <Ripple progress={(frame - BOOM) / 30} from={0.6} to={12} position={[0, -0.5, -1.5]} opacity={0.22} width={0.03} />
        {/* resting light behind the end card */}
        <Glow position={[0, 0.2, -4]} size={13} opacity={0.18 + 0.05 * Math.sin(frame / 20)} color={C.agentDeep} />
      </group>
    </Stage>
  );
};

export const Slam: React.FC<{ frame: number; at: number; fps: number; children: React.ReactNode; marked?: boolean }> = ({
  frame,
  at: start,
  fps,
  children,
  marked,
}) => {
  const s = spring({ frame: frame - start + 1, fps, config: { damping: 13, stiffness: 260, mass: 0.6 } });
  const o = interpolate(frame, [start - 1, start + 2], [0, 1], clamp);
  const sweep = marked ? interpolate(frame, [start - 1, start + 4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        opacity: o,
        transform: `scale(${lerp(1.9, 1, s)})`,
        filter: s < 0.98 ? `blur(${(1 - s) * 8}px)` : undefined,
        padding: marked ? "0 0.14em" : undefined,
        margin: marked ? "0 -0.04em" : undefined,
      }}
    >
      {marked ? (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "8%",
            bottom: "4%",
            width: "100%",
            background: C.mark,
            borderRadius: 10,
            transform: `scaleX(${sweep})`,
            transformOrigin: "0% 50%",
            boxShadow: `0 0 ${60 * sweep}px rgba(237,216,84,0.35)`,
          }}
        />
      ) : null}
      <span style={{ position: "relative", color: marked && sweep > 0.6 ? C.onMark : C.ink }}>{children}</span>
    </span>
  );
};

export const S9Punch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const suck = interpolate(frame, [0, 16], [0, 1], clamp);
  const suckE = Easing.in(Easing.cubic)(suck);
  const shake1 = shakeAt(frame, HIT, 8, 5, "h");
  const shake2 = shakeAt(frame, BOOM, 7, 16, "b");
  const shake = [shake1[0] + shake2[0], shake1[1] + shake2[1]];

  // Wordmark: square appears where the cube was, then slides left as "Selger" wipes in.
  const show = frame >= SELGER;
  const slide = interpolate(frame, [SELGER + 2, SELGER + 20], [0, 1], { ...clamp, easing: Easing.bezier(0.7, 0, 0.2, 1) });
  const hitBump = interpolate(frame, [HIT, HIT + 2, HIT + 14], [0, 1, 0], clamp);
  const boomBump = interpolate(frame, [BOOM, BOOM + 2, BOOM + 12], [0, 1, 0], clamp);
  const push = interpolate(frame, [SELGER, DUR], [1, 1.04]);
  const scale = push * (1 + hitBump * 0.035 + boomBump * 0.03);
  const squareGlow = 1 + hitBump * 2;

  const sponsor = prog(frame, 118, 18);
  const flash2d = interpolate(frame, [SELGER - 1, SELGER + 1, SELGER + 9], [0, 0.45, 0], clamp);
  const toBlack = interpolate(frame, [DUR - 8, DUR], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      {/* scene 8's last frame (the map), pulled into the cube */}
      {suck < 1 ? (
        <AbsoluteFill
          style={{
            transformOrigin: `960px ${MARK_Y}px`,
            transform: `scale(${1 - suckE * 0.985}) rotate(${suckE * 22}deg)`,
            // Fade the frame edges so the map reads as matter falling in, not a rotating picture.
            maskImage: `radial-gradient(circle at 960px ${MARK_Y}px, #000 ${lerp(1250, 90, Math.sqrt(suck))}px, transparent ${lerp(1650, 460, Math.sqrt(suck))}px)`,
            filter: suckE > 0.02 ? `blur(${suckE * 12}px)` : undefined,
            opacity: 1 - interpolate(suck, [0.55, 0.95], [0, 1], clamp),
          }}
        >
          <ParcelJourney frame={S8_DUR - 1} />
        </AbsoluteFill>
      ) : null}
      <Backdrop frame={frame} shake={shake} />
      {/* scene 8's board, frozen on its last frame and pulled into the cube */}
      {show ? (
        <AbsoluteFill style={{ transform: `translate(${shake[0]}px, ${shake[1]}px) scale(${scale})`, transformOrigin: `960px ${MARK_Y + 90}px` }}>
          {/* wordmark */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: MARK_Y - 100,
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: WORD_GAP,
            }}
          >
            <div
              style={{
                width: SQ,
                height: SQ,
                borderRadius: 10,
                background: C.agent,
                transform: `translateX(${(1 - slide) * SLIDE}px)`,
                boxShadow: `0 0 ${40 * squareGlow}px rgba(139,170,255,${0.55 * squareGlow}), 0 0 ${120 * squareGlow}px rgba(45,73,201,0.5)`,
              }}
            />
            <div
              style={{
                width: TEXT_W,
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 160,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                color: C.ink,
                clipPath: `inset(-20% ${(1 - slide) * 100}% -20% -4%)`,
                transform: `translateX(${(1 - slide) * SLIDE}px)`,
                whiteSpace: "nowrap",
                marginTop: -12,
              }}
            >
              Selger
            </div>
          </div>
          {/* Point. Shoot. Sold. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 540,
              display: "flex",
              justifyContent: "center",
              gap: "0.32em",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 120,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: C.ink,
            }}
          >
            <Slam frame={frame} at={POINT} fps={fps}>
              Point.
            </Slam>
            <Slam frame={frame} at={SHOOT} fps={fps}>
              Shoot.
            </Slam>
            <Slam frame={frame} at={BOOM} fps={fps} marked>
              Sold.
            </Slam>
          </div>
          {/* sponsors */}
          <div
            style={{
              position: "absolute",
              left: 80,
              right: 80,
              top: 860,
              textAlign: "center",
              fontFamily: MONO,
              fontSize: 24,
              letterSpacing: "0.02em",
              color: C.ink2,
              opacity: sponsor,
              transform: `translateY(${(1 - sponsor) * 12}px)`,
            }}
          >
            Built with ElevenLabs · Mastra · Neon · Exa · Kernel · Fly.io Sprites · AgentMail · Executor · assistant-ui
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${MARK_Y}px, rgba(235,237,239,${flash2d}) 0%, rgba(139,170,255,${flash2d * 0.5}) 30%, rgba(7,8,10,0) 65%)`, pointerEvents: "none" }} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: toBlack, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
