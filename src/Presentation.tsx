import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { DemoSlot, type DemoSlotProps } from "./scenes/DemoSlot";
import { Problem } from "./scenes/Problem";
import { Transition } from "./scenes/Transition";
import { SelgerVideo } from "./SelgerVideo";
import { C } from "./theme";
import { DEMO_SECONDS, PROBLEM_SECONDS, sec, TOTAL_SECONDS, TRANSITION } from "./timing";


export const HOOK_FRAMES = sec(PROBLEM_SECONDS) + sec(TOTAL_SECONDS);
// Whole stage presentation; must stay at 180 s or less.
export const PRESENTATION_FRAMES = HOOK_FRAMES + sec(TRANSITION.seconds) + sec(DEMO_SECONDS);

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

// The stage presentation: problem -> hook video -> Teo calls Kris on stage -> Kris's live demo.
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
      </Series>
    </AbsoluteFill>
  );
};
