import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AudioMix } from "./AudioMix";
import { Captions } from "./Captions";
import { S1Hook } from "./scenes/S1Hook";
import { S2Film } from "./scenes/S2Film";
import { S3See } from "./scenes/S3See";
import { S4Price } from "./scenes/S4Price";
import { S5List } from "./scenes/S5List";
import { S6Negotiate } from "./scenes/S6Negotiate";
import { S7Call } from "./scenes/S7Call";
import { S8Sold } from "./scenes/S8Sold";
import { S9Punch } from "./scenes/S9Punch";
import { C } from "./theme";
import { sceneFrames } from "./timing";
import { Grade } from "./ui/Grade";

// The full launch video. Scene lengths come from src/timing.ts (driven by the narration).
export const SelgerVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <Sequence name="1 Hook" {...sceneFrames("hook")} premountFor={30}>
        <S1Hook />
      </Sequence>
      <Sequence name="2 Film" {...sceneFrames("film")} premountFor={30}>
        <S2Film />
      </Sequence>
      <Sequence name="3 See" {...sceneFrames("see")} premountFor={30}>
        <S3See />
      </Sequence>
      <Sequence name="4 Price" {...sceneFrames("price")} premountFor={30}>
        <S4Price />
      </Sequence>
      <Sequence name="5 List" {...sceneFrames("list")} premountFor={30}>
        <S5List />
      </Sequence>
      <Sequence name="6 Negotiate" {...sceneFrames("negotiate")} premountFor={30}>
        <S6Negotiate />
      </Sequence>
      <Sequence name="7 Call" {...sceneFrames("call")} premountFor={30}>
        <S7Call />
      </Sequence>
      <Sequence name="8 Sold" {...sceneFrames("sold")} premountFor={30}>
        <S8Sold />
      </Sequence>
      <Sequence name="9 Punchline" {...sceneFrames("punch")} premountFor={30}>
        <S9Punch />
      </Sequence>
      <Grade />
      <Captions />
      <AudioMix />
    </AbsoluteFill>
  );
};
