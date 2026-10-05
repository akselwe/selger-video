import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { DemoSlot, type DemoSlotProps } from "./scenes/DemoSlot";
import { UnderTheHood } from "./scenes/UnderTheHood";
import { Outro } from "./scenes/Outro";
import { Recap } from "./scenes/Recap";
import { Problem } from "./scenes/Problem";
import { Transition } from "./scenes/Transition";
import { SelgerVideo } from "./SelgerVideo";
import { C } from "./theme";
import { DEMO_SECONDS, OUTRO_SECONDS, PROBLEM_SECONDS, RECAP_SECONDS, sec, TOTAL_SECONDS, TRANSITION } from "./timing";


export const HOOK_FRAMES = sec(PROBLEM_SECONDS) + sec(TOTAL_SECONDS);
// Whole stage presentation; must stay at 180 s or less.
export const PRESENTATION_FRAMES = HOOK_FRAMES + sec(TRANSITION.seconds) + sec(DEMO_SECONDS) + sec(RECAP_SECONDS) + sec(OUTRO_SECONDS);

// The standalone hook video: the problem, then the Selger film.
export const Hook: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.void }}>
    <Series>
      <Series.Sequence durationInFrames={sec(PROBLEM_SECONDS)} name="Problem">
        <Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={sec(TOTAL_SECONDS)} name="Hook video">
        <SelgerVideo />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);

// The stage presentation: problem -> hook video -> Teo calls Kris on stage -> Kris's live demo -> recap -> MCP outro.
export const Presentation: React.FC<DemoSlotProps> = ({ src }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <Series>
        <Series.Sequence durationInFrames={sec(PROBLEM_SECONDS)} name="Problem">
          <Problem />
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(TOTAL_SECONDS)} name="Hook video">
          <SelgerVideo />
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(TRANSITION.seconds)} name="Transition call">
          <Transition />
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(DEMO_SECONDS)} name="Live demo">
          <DemoSlot src={src} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(RECAP_SECONDS)} name="Recap">
          <Recap />
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(OUTRO_SECONDS)} name="Outro (MCP)">
          <Outro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

const STAGE_SPONSORS_SECONDS = 5;
// The stage cut (max 1:45): no demo segment, a 5 s "under the hood" sponsor part instead. Teo's call goes straight into the recap and the MCP outro.
// The transition's tail (its cut to black) is shortened by 0.5 s to stay at 100 s.
const STAGE_TRANSITION_FRAMES = sec(TRANSITION.seconds) - 15;
export const STAGE_FRAMES = HOOK_FRAMES + STAGE_TRANSITION_FRAMES + sec(STAGE_SPONSORS_SECONDS) + sec(RECAP_SECONDS) + sec(OUTRO_SECONDS);

export const Stage: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.void }}>
    <Series>
      <Series.Sequence durationInFrames={sec(PROBLEM_SECONDS)} name="Problem">
        <Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={sec(TOTAL_SECONDS)} name="Hook video">
        <SelgerVideo />
      </Series.Sequence>
      <Series.Sequence durationInFrames={STAGE_TRANSITION_FRAMES} name="Transition call">
        <Transition />
      </Series.Sequence>
      <Series.Sequence durationInFrames={sec(STAGE_SPONSORS_SECONDS)} name="Under the hood">
        <UnderTheHood />
      </Series.Sequence>
      <Series.Sequence durationInFrames={sec(RECAP_SECONDS)} name="Recap">
        <Recap />
      </Series.Sequence>
      <Series.Sequence durationInFrames={sec(OUTRO_SECONDS)} name="Outro (MCP)">
        <Outro />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
