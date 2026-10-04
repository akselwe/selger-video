import { Easing, interpolate, spring } from "remotion";

// Small animation helpers. All timing in frames, relative to the scene start.
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const fadeIn = (frame: number, start: number, dur = 8) =>
  interpolate(frame, [start, start + dur], [0, 1], clamp);

export const fadeOut = (frame: number, start: number, dur = 8) =>
  interpolate(frame, [start, start + dur], [1, 0], clamp);

export const ease = (frame: number, start: number, dur: number, from = 0, to = 1) =>
  interpolate(frame, [start, start + dur], [from, to], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });

export const easeInOut = (frame: number, start: number, dur: number, from = 0, to = 1) =>
  interpolate(frame, [start, start + dur], [from, to], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });

export const pop = (frame: number, start: number, fps: number, damping = 14) =>
  spring({ frame: frame - start, fps, config: { damping, stiffness: 170, mass: 0.6 } });

// Enter like the design system: fade + 6 px rise (scaled up for video).
export const enter = (frame: number, start: number, rise = 18) => ({
  opacity: fadeIn(frame, start, 7),
  transform: `translateY(${interpolate(frame, [start, start + 9], [rise, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}px)`,
});
