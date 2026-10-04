import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp } from "../ui/anim";
import { AgentMark, Card, Label } from "../ui/kit";
import { FilmScene, filmCam } from "./s1-3/FilmSet";
import { Phone, QUOTE, TranscriptChip } from "./s1-3/Phone";
import { edgeFade, lerp, local, wordFrame } from "./s1-3/util";
import { BrandSmall, sway } from "./S2Film";

// Scene 3: "It picks the sharpest frames, cleans up the photos, and finds the exact model."
// Frames burst out of the phone, the sharp ones are picked and cleaned, then the ID card lands.
const START = 7.3;
const W = (i: number) => wordFrame("s3-see", i, START);

const BURST = local(7.35, START); // 1.5
const SHARP = W(3); // "sharpest" ≈ 26
const CLEAN = W(5); // "cleans" ≈ 64
const FINDS = W(9); // "finds" ≈ 110
const EXACT = W(11); // "exact" ≈ 124

const N = 24;
// Cards whose raw image is one of the six sharp shots (raw 0, 2, 3, 5, 7, 8).
const SHARP_CARDS = [0, 2, 3, 5, 7, 8];
const CLEAN_INDEX: Record<number, number> = { 0: 0, 2: 1, 3: 2, 5: 3, 7: 4, 8: 5 };

// Positions (px, relative to frame centre) in the floating cloud.
const CLOUD = Array.from({ length: N }, (_, i) => {
  const r = (k: string) => random(`s3-${k}-${i}`);
  const sharpSlot = SHARP_CARDS.indexOf(i);
  if (sharpSlot >= 0) {
    // Sharp ones sit in a loose ring, closer to the camera.
    const a = (sharpSlot / 6) * Math.PI * 2 + 0.5;
    return { x: Math.cos(a) * 520, y: Math.sin(a) * 250 - 40, z: 60 + r("z") * 120, rx: (r("rx") - 0.5) * 16, ry: (r("ry") - 0.5) * 30, rz: (r("rz") - 0.5) * 14 };
  }
  const a = r("a") * Math.PI * 2;
  const rad = 300 + r("rad") * 620;
  return {
    x: Math.cos(a) * rad * 1.25,
    y: Math.sin(a) * rad * 0.55 - 40,
    z: -1100 + r("z") * 1550,
    rx: (r("rx") - 0.5) * 30,
    ry: (r("ry") - 0.5) * 50,
    rz: (r("rz") - 0.5) * 24,
  };
});

// Grid of six clean photos: 3 × 2.
const TILE = 236;
const GAP = 20;
const gridPos = (slot: number) => ({
  x: ((slot % 3) - 1) * (TILE + GAP),
  y: (Math.floor(slot / 3) - 0.5) * (TILE + GAP) - 50,
});

const Tick: React.FC<{ readonly size?: number; readonly color?: string }> = ({ size = 22, color = C.agent }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M 4.5 12.5 L 9.5 17.5 L 19.5 6.5" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ROWS: [string, string][] = [
  ["Brand", "HAY"],
  ["Model", "About A Chair (AAC22)"],
  ["Material", "Oiled oak"],
  ["Condition", "Good, small scratch on left leg"],
];

export const S3See: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const tAbs = START + frame / 30;
  const t = frame / 30;
  const fade = edgeFade(frame, durationInFrames, 0, 7);

  // --- Opening: the phone from scene 2 fires the frames out, then recedes.
  const s = sway(tAbs);
  const phoneOut = interpolate(frame, [BURST, BURST + 18], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const phoneFlash = interpolate(frame, [0, BURST + 1, BURST + 9], [0, 0.85, 0], clamp);
  const chipOut = interpolate(frame, [BURST, BURST + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

  // World behind goes soft and dark.
  const worldDim = interpolate(frame, [BURST, BURST + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  // Phases.
  const burst = interpolate(frame, [BURST + 1, BURST + 26], [0, 1], { ...clamp, easing: Easing.bezier(0.12, 0.9, 0.25, 1) });
  const toGrid = (slot: number) =>
    interpolate(frame, [CLEAN - 4 + slot * 2, CLEAN + 16 + slot * 2], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const shiftLeft = interpolate(frame, [FINDS - 6, FINDS + 16], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const gridAll = toGrid(5);

  // Camera drift through the cloud (rotates less as the grid forms).
  const worldRotY = interpolate(frame, [0, durationInFrames], [-9, 7]) * (1 - gridAll * 0.75);
  const worldRotX = interpolate(frame, [0, durationInFrames], [5, -3]) * (1 - gridAll * 0.75);
  const worldZ = interpolate(frame, [0, CLEAN], [-120, 40], clamp) * (1 - gridAll) + gridAll * interpolate(frame, [CLEAN, durationInFrames], [0, 30]);

  // ID card.
  const cardIn = interpolate(frame, [EXACT - 8, EXACT + 10], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const rowAt = (i: number) => EXACT + 6 + i * 6;
  const footerAt = EXACT + 32;
  const frame3Hl = interpolate(frame, [footerAt, footerAt + 8], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <AbsoluteFill style={{ opacity: fade }}>
        {/* The film set from scene 2, now out of focus. */}
        <AbsoluteFill style={{ filter: `blur(${worldDim * 14}px)`, transform: `scale(${1 + worldDim * 0.06})` }}>
          <FilmScene cam={filmCam(tAbs)} />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: C.void, opacity: worldDim * 0.72 }} />
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 45%, rgba(45,73,201,${0.16 * worldDim}) 0%, rgba(7,8,10,0) 70%)`,
          }}
        />

        {/* Phone recedes as the frames fly out. */}
        {phoneOut < 1 ? (
          <Phone
            dx={s.dx}
            dy={s.dy - phoneOut * 40}
            rotX={s.rotX}
            rotY={s.rotY}
            rotZ={s.rotZ}
            scale={1 - phoneOut * 0.35}
            opacity={1 - phoneOut}
            mask={1 - worldDim}
            flash={phoneFlash}
            rec={2 + (frame + 81) / 30}
            focus={1}
          />
        ) : null}

        {/* Transcript chip from scene 2, swept away by the burst. */}
        {chipOut < 1 ? (
          <div style={{ position: "absolute", inset: 0, perspective: 1400 }}>
            <div
              style={{
                position: "absolute",
                left: 1226,
                top: 300,
                opacity: 1 - chipOut,
                transform: `translate3d(${Math.sin(tAbs * 0.7) * 6 + chipOut * 260}px, ${Math.cos(tAbs * 0.9) * 6}px, ${chipOut * 200}px) rotateY(${-16 + Math.sin(tAbs * 0.5) * 2}deg)`,
                transformOrigin: "left center",
              }}
            >
              <TranscriptChip shown={QUOTE.length} t={tAbs} />
            </div>
          </div>
        ) : null}

        <div style={{ position: "absolute", left: 96, top: 104, opacity: 1 - chipOut }}>
          <BrandSmall />
        </div>

        {/* Frame cloud → picked → cleaned grid */}
        <AbsoluteFill style={{ perspective: 1300, perspectiveOrigin: "50% 45%" }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transformStyle: "preserve-3d",
              transform: `translateZ(${worldZ}px) rotateX(${worldRotX}deg) rotateY(${worldRotY}deg)`,
            }}
          >
            {CLOUD.map((c, i) => {
              const slot = SHARP_CARDS.indexOf(i);
              const isSharp = slot >= 0;
              const img = i % 10;
              const drift = { x: Math.sin(t * 0.9 + i) * 8, y: Math.cos(t * 0.7 + i * 1.3) * 8 };
              // Burst from the phone screen.
              const b = interpolate(burst, [0, 1], [0, 1]) * interpolate(frame, [BURST + 1 + (i % 6) * 0.6, BURST + 4 + (i % 6) * 0.6], [0, 1], clamp);
              let x = lerp(0, c.x, burst) + drift.x * burst;
              let y = lerp(-70, c.y, burst) + drift.y * burst;
              let z = lerp(-80, c.z, burst);
              let rx = c.rx * burst;
              let ry = c.ry * burst;
              let rz = c.rz * burst;
              let w = 200;
              let h = 250;
              let opacity = b;
              let blur = 0;
              let ghost = 0;
              if (!isSharp) {
                // Blurry frames: soft, then dim and fall away.
                const kind = i % 3;
                blur = (kind === 0 ? 10 : kind === 1 ? 6 : 3.5) + Math.max(0, z) / 60;
                ghost = kind === 2 ? 1 : 0;
                const dimK = interpolate(frame, [SHARP + 2, SHARP + 12], [0, 1], clamp);
                const fall = interpolate(frame, [SHARP + 10 + (i % 7) * 2, SHARP + 36 + (i % 7) * 2], [0, 1], {
                  ...clamp,
                  easing: Easing.in(Easing.quad),
                });
                opacity *= (1 - dimK * 0.7) * (1 - fall);
                y += fall * 700;
                z -= fall * 500;
                rx += fall * 50;
                if (opacity <= 0.001) return null;
              } else {
                const g = toGrid(slot);
                const gp = gridPos(slot);
                const gx = gp.x - shiftLeft * 446;
                x = lerp(x, gx, g);
                y = lerp(y, gp.y, g);
                z = lerp(z, 0, g);
                rx = lerp(rx, 0, g);
                ry = lerp(ry, 0, g);
                rz = lerp(rz, 0, g);
                w = lerp(200, TILE, g);
                h = lerp(250, TILE, g);
              }
              const picked = isSharp ? interpolate(frame, [SHARP + slot * 2, SHARP + 6 + slot * 2], [0, 1], clamp) : 0;
              const wipe = isSharp ? interpolate(frame, [CLEAN + 12 + slot * 3, CLEAN + 26 + slot * 3], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) }) : 0;
              const badgeOut = interpolate(wipe, [0, 0.4], [1, 0], clamp);
              const numberIn = isSharp ? interpolate(frame, [CLEAN + 28 + slot * 3, CLEAN + 36 + slot * 3], [0, 1], clamp) : 0;
              const hl = slot === 2 ? frame3Hl : 0;
              const borderColor = picked > 0.5 ? C.agent : C.line;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: w,
                    height: h,
                    transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${lerp(0.3, 1, b) * (isSharp ? lerp(1.12, 1, toGrid(slot)) : 1)})`,
                    opacity,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 12,
                      overflow: "hidden",
                      background: C.sunken,
                      border: `${picked > 0.5 ? 3 : 2}px solid ${borderColor}`,
                      boxShadow:
                        picked > 0.5 || hl > 0
                          ? `0 0 ${18 + hl * 20}px rgba(139,170,255,${0.35 * picked + 0.4 * hl}), 0 24px 50px rgba(0,0,0,0.55)`
                          : "0 24px 50px rgba(0,0,0,0.55)",
                    }}
                  >
                    <div style={{ position: "absolute", inset: 0, filter: blur ? `blur(${blur}px)` : undefined }}>
                      <Img src={staticFile(`frames/raw-0${img}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {ghost ? (
                        <Img
                          src={staticFile(`frames/raw-0${img}.png`)}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5, transform: "translateX(14px)" }}
                        />
                      ) : null}
                    </div>
                    {isSharp ? (
                      <>
                        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
                          <Img
                            src={staticFile(`frames/clean-0${CLEAN_INDEX[i]}.png`)}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                        {wipe > 0 && wipe < 1 ? (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              bottom: 0,
                              left: `${wipe * 100}%`,
                              width: 3,
                              marginLeft: -1.5,
                              background: C.agent,
                              boxShadow: `0 0 16px ${C.agent}, 0 0 4px ${C.agent}`,
                            }}
                          />
                        ) : null}
                        {/* "Sharp" tick */}
                        <div
                          style={{
                            position: "absolute",
                            left: 10,
                            bottom: 10,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 12px 4px 8px",
                            borderRadius: 8,
                            background: C.agentSoft,
                            color: C.agent,
                            fontFamily: SANS,
                            fontWeight: 600,
                            fontSize: 24,
                            opacity: picked * badgeOut,
                            transform: `scale(${lerp(0.8, 1, picked)})`,
                            transformOrigin: "left bottom",
                          }}
                        >
                          <Tick size={22} />
                          Sharp
                        </div>
                        {/* Frame number after cleaning */}
                        <div
                          style={{
                            position: "absolute",
                            left: 10,
                            top: 10,
                            padding: "3px 9px",
                            borderRadius: 7,
                            background: hl > 0.5 ? C.agent : "rgba(17,19,21,0.82)",
                            color: hl > 0.5 ? C.void : C.ink,
                            fontFamily: MONO,
                            fontSize: 24,
                            opacity: numberIn,
                          }}
                        >
                          0{slot + 1}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>

        {/* Identification card */}
        <div style={{ position: "absolute", inset: 0, perspective: 1600 }}>
          <div
            style={{
              position: "absolute",
              left: 1010,
              top: 198,
              opacity: cardIn,
              transform: `translate3d(${(1 - cardIn) * 120 + Math.sin(t * 0.8) * 4}px, ${(1 - cardIn) * 40 + Math.cos(t * 0.7) * 4}px, ${(1 - cardIn) * 380}px) rotateX(${(1 - cardIn) * 16}deg) rotateY(${-6 + (1 - cardIn) * -14 + Math.sin(t * 0.5) * 1.5}deg)`,
              transformOrigin: "left center",
            }}
          >
            <Card width={780} elevated style={{ padding: "30px 34px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Label size={24}>Identified · Vision + Exa</Label>
              </div>
              <div style={{ marginTop: 18 }}>
                {ROWS.map(([k, v], i) => {
                  const p = interpolate(frame, [rowAt(i), rowAt(i) + 7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
                  const tick = interpolate(frame, [rowAt(i) + 3, rowAt(i) + 8], [0, 1], clamp);
                  return (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "15px 0",
                        borderTop: i === 0 ? "none" : `1.5px solid ${C.line}`,
                        opacity: p,
                        transform: `translateY(${(1 - p) * 12}px)`,
                      }}
                    >
                      <div style={{ width: 190, fontFamily: SANS, fontSize: 28, color: C.ink2 }}>{k}</div>
                      <div style={{ flex: 1, fontFamily: SANS, fontSize: 31, fontWeight: 600, color: C.ink, letterSpacing: "-0.01em" }}>{v}</div>
                      <div style={{ opacity: tick, transform: `scale(${lerp(0.5, 1, tick)})` }}>
                        <Tick size={28} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 18,
                  borderTop: `1.5px solid ${C.line}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: SANS,
                  fontSize: 25,
                  fontWeight: 500,
                  color: C.agent,
                  opacity: interpolate(frame, [footerAt, footerAt + 8], [0, 1], clamp),
                }}
              >
                <AgentMark size={13} />
                Matched: label in frame 3, 7 identical listings online
              </div>
            </Card>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
