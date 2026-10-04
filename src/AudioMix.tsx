import { Audio } from "@remotion/media";
import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SCENES, SFX_AT, sec, VO_AT } from "./timing";
import { VO } from "./vo";

const MUSIC_BASE = 0.55;
const MUSIC_DUCKED = 0.2;

// The fast bed fades to silence around 50–56 s before its final hit (56.5 s). We keep that hit for
// the punchline, and fill the parcel journey with a copy of the bed's peak section (from 24 s).
const FILL_FROM = 50.0;
const FILL_TO = 56.45;
const FILL_SOURCE = 24.0;

const callScene = SCENES.find((s) => s.id === "call")!;
const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Music level per frame: ducked under narration, crossfaded to a muffled copy during the call.
const useMusicLevels = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  let duck = 0;
  for (const [id, at] of Object.entries(VO_AT)) {
    const end = at + VO[id].duration;
    // 0.15 s ramp in, 0.35 s release
    duck = Math.max(duck, interpolate(t, [at - 0.15, at, end, end + 0.35], [0, 1, 1, 0], clampOpts));
  }
  const level = MUSIC_BASE + (MUSIC_DUCKED - MUSIC_BASE) * duck;
  const muffle = interpolate(
    t,
    [callScene.start - 0.2, callScene.start + 0.4, callScene.end - 0.5, callScene.end + 0.1],
    [0, 1, 1, 0],
    clampOpts,
  );
  const fill = interpolate(t, [FILL_FROM, FILL_FROM + 0.8, FILL_TO - 0.25, FILL_TO], [0, 1, 1, 0], clampOpts);
  return { clear: level * (1 - muffle), muffled: level * 0.9 * muffle, fill: level * fill };
};

const Music: React.FC = () => {
  const { clear, muffled, fill } = useMusicLevels();
  return (
    <>
      <Audio src={staticFile("audio/music/bed-fast.mp3")} volume={clear} />
      <Audio src={staticFile("audio/music/bed-fast-muffled.mp3")} volume={muffled} />
      <Sequence from={sec(FILL_FROM)} durationInFrames={sec(FILL_TO - FILL_FROM)} layout="none" name="Music fill">
        <Audio src={staticFile("audio/music/bed-fast.mp3")} trimBefore={sec(FILL_SOURCE)} volume={fill} />
      </Sequence>
    </>
  );
};

export const AudioMix: React.FC = () => {
  return (
    <>
      <Music />
      {Object.entries(VO_AT).map(([id, at]) => (
        <Sequence key={id} from={sec(at)} name={`VO ${id}`} layout="none">
          <Audio src={staticFile(`audio/vo/${id}.mp3`)} />
        </Sequence>
      ))}
      {SFX_AT.map((s, i) => (
        <Sequence key={`${s.id}-${i}`} from={sec(s.at)} name={`SFX ${s.id}`} layout="none">
          <Audio src={staticFile(`audio/sfx/${s.id}.mp3`)} volume={s.volume ?? 0.7} />
        </Sequence>
      ))}
    </>
  );
};
