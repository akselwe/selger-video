import { interpolate } from "remotion";
import { wordAt } from "../../vo";

// Local frame (relative to the scene) of an absolute time in seconds.
export const local = (absSeconds: number, sceneStart: number) => (absSeconds - sceneStart) * 30;

// Local frame when word `i` of clip `id` starts.
export const wordFrame = (id: string, i: number, sceneStart: number) => local(wordAt(id, i), sceneStart);

// Fade in from black over the first frames and out over the last ones.
export const edgeFade = (frame: number, duration: number, inDur = 6, outDur = 6) =>
  Math.min(
    inDur > 0 ? interpolate(frame, [0, inDur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1,
    outDur > 0
      ? interpolate(frame, [duration - outDur, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1,
  );

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
