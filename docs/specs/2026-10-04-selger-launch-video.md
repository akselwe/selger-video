# Selger launch video: design and plan

Approved by Aksel on 2026-10-04 (dark and cinematic, hybrid 3D, English, punchline "Point. Shoot. Sold.").
This is the first draft; footage from the live demo will be added later.

## Goal

A first draft, at most 60 seconds long, used both as the hackathon submission video and to open the stage demo. The audience should leave with a wow. It covers every step of the product and has a punchline at the end.

## Done means

- `out/selger-draft.mp4`: at most 60.0 s, 1920×1080, 30 fps, H.264 with AAC audio (checked with ffprobe).
- Narration and captions are in sync. Stills from every scene have been checked by eye.
- All on-screen text and narration is spelled correctly, in the right language, and makes sense to someone who has never heard of FINN or HAY.
- No sparkles, robots, brains, purple gradients or marketplace logos (design rules in `sales-assistant/design/README.md`).
- `npm run lint` (eslint + tsc) passes.

## Visual system

- Dark Blue Pencil tokens: ground `#111315`, surface `#1a1c1f`, sunken `#0c0d10`, line `#2d2f33`, ink `#ebedef`, ink-2 `#a7abb3`, agent `#8baaff` (and deeper `#2d49c9`), mark `#edd854`, danger `#f47c70`.
- Type: Schibsted Grotesk (sans) and Fragment Mono (mono labels such as "SEARCH · EXA").
- The agent's mark is the blue square. In 3D it is a glowing cube: the hero of the video.
- UI cards are recreated from the real design system (ItemIntake, PriceCheck, CrossPost, OfferCard, ScamFlag, CallReceipt, SoldEverywhere, ShipIt) and placed in 3D space.
- Platform tags are text only (`eBay`, `FINN`, `Tise`) with route tags (`API`, `BROWSER`, `PHONE`).

## Audio (ElevenLabs)

- Narrator: Brian (`nPczCjzI2devNBz1zQrb`). Selger agent on the phone: Sarah (`EXAVITQu4vr4xnSDxMaL`). Seller's reply: Chris (`iP95p4xoKVk53GoZ742B`). Model `eleven_v4`, with timestamps.
- Music: ElevenLabs Music, about 60 s of cinematic electronic music that builds to the negotiation and hits on the punchline. Ducked under the narration.
- Sound effects: ElevenLabs sound generation (whoosh, shutter, phone ring, deal chime, glass break, sub-boom for the logo).
- `scripts/generate-audio.ts` writes everything to `public/audio/` plus `public/audio/timing.json`. Nothing is generated during rendering.

## Script and storyboard

| # | Scene | Visual | Audio |
|---|---|---|---|
| 1 | Hook | Black. One highlighter stroke draws under the line. | N: "Selling your old stuff is a second job." |
| 2 | Film | 3D phone films the chair; the seller's narration appears as a transcript: "Bought it in 2022. Small scratch on the leg." | N: "Meet Selger. Just film what you want to sell." |
| 3 | See | Frames burst out of the phone into space; the six sharpest snap into clean product shots. The identification card shows Brand HAY · Model About A Chair (AAC22) · Oiled oak · Small scratch on left leg, with evidence. | N: "It picks the sharpest frames, cleans up the photos, and finds the exact model." |
| 4 | Price | 3D price strip of comparable listings; List 1 900 kr, Target 1 700 kr, Floor 1 400 kr (private, locked). | N: "It checks what it's really worth. You set the floor. It aims higher." |
| 5 | List | Three listings fly to eBay · API, FINN · BROWSER (form filling live), Tise · PHONE. | N: "Then it lists everywhere. eBay, FINN, Tise. Even the ones with no API." |
| 6 | Negotiate (hero) | Arena: Selger cube in the centre, buyer agents in orbit. Offers stream in; the main thread: "Still available? 1 200?" → "It is. I can do 1 750." → "1 600, shipped?" → "1 650 shipped. It goes out tomorrow." → "Deal." A scam link flies in, gets flagged and shatters. | N: "Buyers come in from every channel. Selger negotiates with all of them at once. It anchors high, concedes slowly, and never goes below your floor. Scams? Caught before you ever see them." |
| 7 | Call | 1 650 is under the 1 700 target, so the rules say ask. The phone rings; call card with live transcript. | Selger (Sarah): "Hi, it's Selger. Ola offers sixteen fifty, shipped. That's just under your target. Should I take it?" Seller (Chris): "Yeah, take it." |
| 8 | Sold | Sold on FINN · 1 650 kr (largest number); eBay and Tise withdrawn; shipping card with the code and "Leave it in your mailbox before 5 PM tomorrow". "41 actions by Selger. 1 answer from you." | N: "Sold. Delisted everywhere else. You just drop it in the mailbox." |
| 9 | Punchline | Everything collapses into the blue square, then the Selger wordmark. Sponsor line in small mono. | N: "Selger. Point. Shoot. Sold." |

## Structure

- `src/theme.ts`: tokens and fonts. `src/ui/*`: shared 2D card components. `src/three/*`: shared 3D pieces (agent cube, stage lighting, bloom, chair, phone).
- `src/scenes/S1Hook.tsx` … `S9Punchline.tsx`: one file per scene, each registered as its own composition so it can be previewed and later swapped for demo footage.
- `src/SelgerVideo.tsx`: `TransitionSeries` of all scenes, with scene lengths from `timing.json`, plus audio layers (narration, phone, music with ducking, sound effects) and captions.

## Plan

1. Audio first: generate narration with timestamps, the phone voices, music and sound effects, and derive scene lengths (total of 60 s or less).
2. Foundation: theme, fonts, shared 3D stage (bloom, fog, lights), agent cube, UI cards.
3. Scenes 1–9, previewed one at a time with stills.
4. Assemble the full video with captions and the audio mix; render the draft.
5. Review: stills from every scene, a spelling and sense check of all text, ffprobe, lint. Fix, then deliver.
