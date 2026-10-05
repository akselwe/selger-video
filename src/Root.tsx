import React from "react";
import { Composition, Folder } from "remotion";
import { Lab } from "./Lab";
import { ChairShot } from "./scenes/s1-3/ChairShot";
import { Problem } from "./scenes/Problem";
import { PROBLEM_SECONDS } from "./timing";
import { S1Hook } from "./scenes/S1Hook";
import { S2Film } from "./scenes/S2Film";
import { S3See } from "./scenes/S3See";
import { S4Price } from "./scenes/S4Price";
import { S5List } from "./scenes/S5List";
import { S6Negotiate } from "./scenes/S6Negotiate";
import { S7Call } from "./scenes/S7Call";
import { S8Sold } from "./scenes/S8Sold";
import { S9Punch } from "./scenes/S9Punch";
import { DemoSlot } from "./scenes/DemoSlot";
import { Outro } from "./scenes/Outro";
import { Recap } from "./scenes/Recap";
import { Transition } from "./scenes/Transition";
import { Hook, HOOK_FRAMES, Presentation, PRESENTATION_FRAMES, Stage as StageCut, STAGE_FRAMES } from "./Presentation";
import { SelgerVideo } from "./SelgerVideo";
import { DEMO_SECONDS, FPS, OUTRO_SECONDS, RECAP_SECONDS, sceneFrames, sec, TOTAL_SECONDS, TRANSITION, type SceneId } from "./timing";

const scene = (id: string, sceneId: SceneId, component: React.FC) => (
  <Composition
    id={id}
    component={component}
    fps={FPS}
    durationInFrames={sceneFrames(sceneId).durationInFrames}
    width={1920}
    height={1080}
  />
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SelgerVideo"
        component={SelgerVideo}
        fps={FPS}
        durationInFrames={sec(TOTAL_SECONDS)}
        width={1920}
        height={1080}
      />
      <Composition id="Hook" component={Hook} fps={FPS} durationInFrames={HOOK_FRAMES} width={1920} height={1080} />
      <Composition id="Stage" component={StageCut} fps={FPS} durationInFrames={STAGE_FRAMES} width={1920} height={1080} />
      <Composition
        id="Presentation"
        component={Presentation}
        fps={FPS}
        durationInFrames={PRESENTATION_FRAMES}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="Problem"
        component={Problem}
        fps={FPS}
        durationInFrames={sec(PROBLEM_SECONDS)}
        width={1920}
        height={1080}
      />
      <Composition
        id="Transition"
        component={Transition}
        fps={FPS}
        durationInFrames={sec(TRANSITION.seconds)}
        width={1920}
        height={1080}
      />
      <Composition
        id="DemoSlot"
        component={DemoSlot}
        fps={FPS}
        durationInFrames={sec(DEMO_SECONDS)}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition id="Recap" component={Recap} fps={FPS} durationInFrames={sec(RECAP_SECONDS)} width={1920} height={1080} />
      <Composition id="Outro" component={Outro} fps={FPS} durationInFrames={sec(OUTRO_SECONDS)} width={1920} height={1080} />
      <Folder name="Scenes">
        {scene("S1-Hook", "hook", S1Hook)}
        {scene("S2-Film", "film", S2Film)}
        {scene("S3-See", "see", S3See)}
        {scene("S4-Price", "price", S4Price)}
        {scene("S5-List", "list", S5List)}
        {scene("S6-Negotiate", "negotiate", S6Negotiate)}
        {scene("S7-Call", "call", S7Call)}
        {scene("S8-Sold", "sold", S8Sold)}
        {scene("S9-Punch", "punch", S9Punch)}
      </Folder>
      <Folder name="Lab">
        <Composition id="Lab" component={Lab} fps={FPS} durationInFrames={90} width={1920} height={1080} />
        <Composition id="ChairShot" component={ChairShot} fps={FPS} durationInFrames={16} width={720} height={720} />
      </Folder>
    </>
  );
};
