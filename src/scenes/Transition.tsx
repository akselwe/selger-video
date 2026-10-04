import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, SANS } from "../theme";
import { sec, TRANSITION } from "../timing";
import { clamp } from "../ui/anim";
import { Grade } from "../ui/Grade";
import { AgentMark } from "../ui/kit";
import { VO } from "../vo";
import { CallBackdrop, Words, clipWords, useVoice, type VoiceClip } from "./s7-9/call";
import { lerp, prog } from "./s7-9/common";
import { PHONE_H, PHONE_W, Phone, shapeBars } from "./s7-9/Phone";

// After the hook video: Teo phones Kris on stage and hands over to the live demo.
// Self-contained: its own audio and captions. 10.4 s = 312 frames.
const DUR = sec(TRANSITION.seconds);
const RING = sec(TRANSITION.ringAt); // 3
const TEO_AT = sec(TRANSITION.teoAt); // 39
const ANSWER = 33; // Kris picks up on stage
const TEO_END = TEO_AT + Math.round(VO["t1-teo"].duration * 30);
const EXIT = Math.max(TEO_END + 4, DUR - 22); // dive into the phone screen, then black

// Soft music bed from the 30 s point of the muffled track: fades in, ducks under Teo, fades out.
const musicVolume = (f: number) => {
  const duck = interpolate(f, [TEO_AT - 6, TEO_AT, TEO_END, TEO_END + 10], [0, 1, 1, 0], clamp);
  const fade = Math.min(interpolate(f, [0, 15], [0, 1], clamp), interpolate(f, [DUR - 30, DUR - 2], [1, 0], clamp));
  return lerp(0.25, 0.12, duck) * fade;
};

const CLIPS: VoiceClip[] = [{ id: "t1-teo", at: TEO_AT, who: "agent" }];
// Highlight "actually works,".
const words = clipWords("t1-teo", TEO_AT, { hl: (i) => i === 13 || i === 14 });

const PHONE_X = 560; // phone centre
const CAPTION_X = 880;

export const Transition: React.FC = () => {
  const frame = useCurrentFrame();
  const { bins, speaker, level } = useVoice(frame, CLIPS);
  const bars = shapeBars(bins, 31, frame, frame >= ANSWER ? 1 : 0);

  const rise = interpolate(frame, [0, 26], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const buzz = frame >= RING && frame < ANSWER - 6 && (frame - RING) % 18 < 11 ? Math.sin(frame * 2.4) * 2.5 : 0;
  const phoneY = lerp(820, 0, rise) + Math.sin(frame / 40) * 4;
  const phoneRX = lerp(32, 5, rise) + Math.sin(frame / 55) * 1.2;
  const phoneRY = 6 + Math.sin(frame / 70) * 3;

  const capIn = prog(frame, TEO_AT - 8, 14);
  const exit = interpolate(frame, [EXIT, DUR - 4], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const capOut = interpolate(frame, [EXIT - 4, EXIT + 6], [1, 0], clamp);
  const black = interpolate(frame, [DUR - 10, DUR - 2], [0, 1], clamp);
  const push = interpolate(frame, [0, EXIT], [0.985, 1.03]);
  const dive = lerp(1, 5, exit);

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <Sequence from={RING} layout="none" name="SFX ring">
        <Audio src={staticFile("audio/sfx/ring.mp3")} volume={0.8} />
      </Sequence>
      <Sequence layout="none" name="Music bed">
        <Audio src={staticFile("audio/music/bed-fast-muffled.mp3")} trimBefore={30 * 30} volume={musicVolume} />
      </Sequence>
      <Sequence from={TEO_AT} layout="none" name="VO t1-teo">
        <Audio src={staticFile("audio/vo/t1-teo.mp3")} volume={1} />
      </Sequence>

      <AbsoluteFill style={{ opacity: interpolate(frame, [0, 6], [0, 1], clamp) }}>
        <AbsoluteFill style={{ transform: `scale(${lerp(1, 1.6, exit)})` }}>
          <CallBackdrop frame={frame} level={level} answerAt={ANSWER} ringAt={RING} seed="t1" x={-1.6} />
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            perspective: 1900,
            perspectiveOrigin: `${PHONE_X}px 45%`,
            transform: `scale(${push * dive})`,
            transformOrigin: `${PHONE_X}px 520px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: PHONE_X - PHONE_W / 2,
              top: 540 - PHONE_H / 2 + 8,
              transform: `translateX(${buzz}px) translateY(${phoneY}px) rotateX(${phoneRX}deg) rotateY(${phoneRY}deg)`,
              transformOrigin: "50% 100%",
            }}
          >
            <Phone
              frame={frame}
              answerAt={ANSWER}
              endAt={DUR + 100}
              bars={bars}
              speaker={speaker}
              level={level}
              context="Calling you, live on stage"
            />
          </div>
          {/* the line, captioned big */}
          <div
            style={{
              position: "absolute",
              left: CAPTION_X,
              width: 1840 - CAPTION_X,
              top: 540,
              height: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              opacity: capIn * capOut,
              transform: `translateY(${(1 - capIn) * 16}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: SANS, fontSize: 30, fontWeight: 600, color: C.agent, marginBottom: 18 }}>
              <AgentMark size={16} /> Teo, your Selger agent
            </div>
            <Words words={words} frame={frame} activeColor={C.agent} size={68} weight={600} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <Grade />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: black, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
