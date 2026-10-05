import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import r1 from "../../public/audio/vo/r1-recap.json";
import { Glow } from "../three/Glow";
import { Stage } from "../three/Stage";
import { C, SANS } from "../theme";
import { RECAP_SECONDS, RECAP_VO_AT, sec } from "../timing";
import { clamp } from "../ui/anim";
import { Grade } from "../ui/Grade";
import { Dust, Ripple, lerp } from "./s7-9/common";
import { Slam, shakeAt } from "./S9Punch";

// After Kris's live demo: back to the punchline, in the past tense. 4.0 s = 120 frames.
const DUR = sec(RECAP_SECONDS);
const VO_AT = sec(RECAP_VO_AT); // 11
const words = (r1 as { words: { text: string; start: number }[] }).words;
const wf = (i: number) => VO_AT + Math.round(words[i].start * 30);
const POINTED = wf(0); // 11
const SHOT = wf(1); // 40
const BOOM = sec(2.15); // 65: boom, and "Sold." lands with it
const OUT = sec(3.7); // 111: fade to black
const MARK_Y = 440;
const PX_PER_UNIT = 1712.6 / 8;

export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Whip in from the demo: a quick flash and the card settling from a slight zoom.
  const whip = interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const flash = interpolate(frame, [0, 2, 10], [0.5, 0.35, 0], clamp);
  const shake = shakeAt(frame, BOOM, 7, 16, "r");
  const boomBump = interpolate(frame, [BOOM, BOOM + 2, BOOM + 12], [0, 1, 0], clamp);
  const push = interpolate(frame, [0, DUR], [1, 1.04]);
  const scale = lerp(1.12, 1, whip) * push * (1 + boomBump * 0.03);
  const boomGlow = interpolate(frame, [BOOM, BOOM + 2, BOOM + 24], [0, 1, 0], clamp);
  const toBlack = interpolate(frame, [OUT, DUR - 1], [0, 1], clamp);
  const musicVolume = (f: number) => 0.55 * Math.min(interpolate(f, [0, 6], [0, 1], clamp), interpolate(f, [OUT - 6, DUR - 1], [1, 0], clamp));

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <Sequence layout="none" name="SFX swish">
        <Audio src={staticFile("audio/sfx/swish.mp3")} volume={0.6} />
      </Sequence>
      {/* bed.mp3's big hit (54.6 s) lands on "Sold." */}
      <Sequence layout="none" name="Music hit">
        <Audio src={staticFile("audio/music/bed.mp3")} trimBefore={sec(54.6 - 2.2)} volume={musicVolume} />
      </Sequence>
      <Sequence from={VO_AT} layout="none" name="VO r1-recap">
        <Audio src={staticFile("audio/vo/r1-recap.mp3")} volume={1} />
      </Sequence>
      <Sequence from={BOOM} layout="none" name="SFX boom">
        <Audio src={staticFile("audio/sfx/boom.mp3")} volume={1} />
      </Sequence>

      <Stage camera={{ position: [0, 0, 8] }} fog={[6, 24]}>
        <group position={[shake[0] / PX_PER_UNIT, -shake[1] / PX_PER_UNIT, 0]}>
          <Dust frame={frame + 300} seed="rc" count={70} speed={0.003} opacity={0.6} burst={Easing.out(Easing.cubic)(interpolate(frame, [BOOM, DUR], [0, 1], clamp)) * 0.3} />
          <Glow position={[0, 0.2, -4]} size={13} opacity={0.2 + 0.05 * Math.sin(frame / 20)} color={C.agentDeep} />
          <Glow position={[0, -0.4, -1]} size={lerp(3, 14, boomGlow)} opacity={boomGlow * 0.35} color={C.agent} />
          <Ripple progress={(frame - BOOM) / 30} from={0.6} to={12} position={[0, -0.5, -1.5]} opacity={0.22} width={0.03} />
        </group>
      </Stage>

      <AbsoluteFill
        style={{
          transform: `translate(${shake[0]}px, ${shake[1]}px) scale(${scale})`,
          transformOrigin: `960px ${MARK_Y + 90}px`,
          opacity: interpolate(frame, [0, 4], [0, 1], clamp),
          filter: whip < 0.9 ? `blur(${(1 - whip) * 10}px)` : undefined,
        }}
      >
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
            gap: 36,
          }}
        >
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 10,
              background: C.agent,
              boxShadow: "0 0 40px rgba(139,170,255,0.55), 0 0 120px rgba(45,73,201,0.5)",
            }}
          />
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 160, lineHeight: 1, letterSpacing: "-0.03em", color: C.ink, marginTop: -12 }}>
            Selger
          </div>
        </div>
        {/* Pointed. Shot. Sold. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: MARK_Y + 140,
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
          <Slam frame={frame} at={POINTED} fps={fps}>
            Pointed.
          </Slam>
          <Slam frame={frame} at={SHOT} fps={fps}>
            Shot.
          </Slam>
          <Slam frame={frame} at={BOOM} fps={fps} marked>
            Sold.
          </Slam>
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(235,237,239,${flash}) 0%, rgba(139,170,255,${flash * 0.5}) 35%, rgba(7,8,10,0) 75%)`,
          pointerEvents: "none",
        }}
      />
      <Grade />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: toBlack, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
