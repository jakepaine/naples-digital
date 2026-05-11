# Video Pipeline — Caption / Clip Render Recommendation

**Author:** Claude (research task, no code changes)
**Date:** 2026-05-11
**Scope:** Replace or upgrade `apps/render-worker/` clip rendering to hit a Submagic / Opus Clip quality bar.

---

## Current State

`apps/render-worker/src/main.ts` is one file, ~245 lines. It:

1. Claims a `render_jobs` row, downloads the source MP4 from Supabase Storage.
2. Runs a single ffmpeg pipeline: `-ss` cut → center-crop to 9:16 → `scale=1080:1920` → burn captions via `drawtext` → x264 / AAC encode.
3. Builds captions from AssemblyAI `word_timestamps` by chunking into **3-word phrases**, drawing the phrase in white, then layering a brand-color copy of the **whole phrase** during each individual word's `enable=between(t,...)` window.
4. Generates a midpoint JPG thumbnail.

**What it lacks vs. Submagic / Opus Clip:**

- True karaoke — the "active" word currently re-renders the whole phrase in brand color, not just the spoken word at its own x-position. It's a flicker, not a highlight.
- Word-by-word pop / scale / fade-in animation. `drawtext` has no easing.
- Emoji insertion, dynamic emphasis (CAPS on yelled words), keyword highlighting.
- Speaker labels / colored captions per speaker.
- Scene-aware crop (face tracking) — currently a dumb center crop.
- B-roll insertion, music ducking, sound effects on punchlines.
- Multi-language subtitle burn (single Latin font, no RTL support).
- Per-tenant font / caption-style customization beyond `primary_color`. Brand fields exist (`tenants.brand`) but the renderer reads only `primary_color`.

The ceiling of the current architecture is approximately 30% of Submagic's perceived polish. That is the gap.

---

## Options Table

| Option | Quality Ceiling | Per-Clip Cost (60s, 1080x1920) | Integration Effort | Multi-tenant Fit | Lock-in |
|---|---|---|---|---|---|
| **Stay on ffmpeg + libass (.ass subtitles)** | ~70% of Submagic | ~$0 (Railway CPU only) | Low (1–2 wks, same worker) | Excellent — fonts/colors per tenant in `tenant_integrations` | None |
| **Remotion (Lambda or self-host)** | ~95% — matches Submagic | ~$0.10–0.30 Lambda; ~$0 self-host | High (4–6 wks, React video components) | Excellent — props are tenant-driven | Low (open source, MIT) |
| **Captions.ai API** | ~90% (their style, not ours) | $0.10–0.30/min (~$0.10–0.30/clip) | Low (HTTP wrapper, 3–5 days) | Limited — tenant branding via their template system | High — proprietary |
| **Submagic API** | Submagic-quality (it IS Submagic) | No public API as of 2026 | N/A | N/A | N/A |
| **Opus Clip API** | Opus-quality | No public API; partner-only | N/A | N/A | N/A |
| **Veed.io API** | ~85% | $0.05–0.15/min (template-driven) | Medium | Limited branding flexibility | High |
| **AutoCaptions / Eddie / various npm wrappers** | ~60% (mostly thin ffmpeg wrappers) | Free | Low | Same as ffmpeg today | None |

Reality check: Submagic, Opus Clip, and CapCut do **not** publish stable public APIs. The "API" options that exist are either thin wrappers around ffmpeg (no quality gain) or generic caption services (Captions.ai, Veed) that lock you into their visual style. The DTC tools Jake admires (Submagic) treat their caption design as the product moat — they will not let us white-label it.

---

## Deep Dive — Top 3

### 1. Remotion (recommended)

Remotion is a React-based programmatic video framework. You write a `<Composition>` like a webpage — JSX, CSS, Tailwind, even Framer Motion — and it renders frame-by-frame to MP4 via headless Chromium + ffmpeg under the hood.

**Why it dominates for our use case:**

- Captions are React components. Every Submagic-style trick — word pop-in with spring physics, keyword highlights, emoji injection, speaker color coding, animated progress bars, brand-color glows — is just CSS / Framer Motion. There's no `drawtext` ceiling.
- We already write TypeScript + React for `apps/web/`. The mental model is identical.
- Per-tenant brand tokens flow in as `inputProps`. `tenants.brand.primary_color`, `caption_style`, custom fonts — all become React props.
- Active scene-aware crop is doable: pre-process with a face-tracker (e.g., MediaPipe via a one-shot ffmpeg+Python sidecar or `@vladmandic/face-api` in Node), pass keyframe `{t, x, y}` data to Remotion, and animate the crop window.
- Multi-language Just Works — it's HTML/CSS, so RTL, CJK, ligatures, all native.

**Render options:**

- **Remotion Lambda** — $0.10–0.30 per 60s vertical clip at 1080p30. Fast (parallel chunked frames). Adds AWS to the stack we already don't want.
- **Self-hosted on Railway** — `@remotion/renderer` runs inside our existing Node worker, no Lambda needed. CPU-bound, ~1–2x realtime on a Railway 4-vCPU instance. Cost: whatever the worker already costs. Recommended for us.

**Cost reality:** at 50 clips/day across all tenants × 60s each, self-hosted Remotion fits well inside one Railway service (~$20–40/mo). Lambda would be ~$5–15/day = $150–450/mo. Self-host wins.

**Effort:** 4–6 weeks for a polished v1 — Remotion composition library, caption component, brand-token plumbing, optional face-tracker. Could ship a v0 (captions only, no face-tracking, no b-roll) in ~2 weeks.

### 2. Stay on ffmpeg, switch to libass (.ass subtitles)

ASS (Advanced SubStation Alpha) is a subtitle format that supports per-word karaoke (`\k`, `\kf` tags), styled text, fades, moves, rotations, alpha. ffmpeg renders it via `subtitles=file.ass` (libass) and the output looks markedly better than `drawtext`.

**What you can hit:** real karaoke (word-by-word highlight at correct x), per-word fade-in, color changes, two-line layouts, custom fonts, outline + shadow + glow. This is how a lot of "TikTok caption" open-source tools work under the hood.

**What you can't hit:** word-pop scale animation (libass animations are 2D affine only — fades, moves, rotates), emoji insertion, scene-aware crops, b-roll, music ducking. Ceiling is "good lyric video," not "Submagic."

**Effort:** 1–2 weeks. Replace `buildCaptionFilter` with `buildAssFile`, write the .ass to disk, swap `-vf drawtext=...` for `-vf subtitles=...`. Same Dockerfile + Railway service.

**Why this isn't the recommendation:** the quality ceiling sits below Jake's stated bar. You'd ship in two weeks and still be in the "second-tier captions" valley relative to the products the flagship tenant (239 Live / Kevin) is comparing us to.

### 3. Captions.ai or similar third-party API

Captions.ai has a developer API (in beta as of 2026) that takes a video URL + style preset and returns a captioned MP4. Quality is genuinely good. Cost is in the $0.10–0.30/min range.

**Why this is third place:** every tenant gets the same caption look. Their "branding" is a hex color and font picker — that's it. The whole point of a multi-tenant SaaS chassis is per-tenant differentiation; routing all rendering through a single third-party visual template undermines the product story. Also: lock-in. If captions.ai raises prices or shutters, we have no fallback. Self-host Remotion has no such failure mode.

The one scenario where this wins: if Jake wants to **stop owning the rendering problem entirely** for the next 6–12 months and focus engineering elsewhere. It's a valid choice. It's just not the craft choice.

---

## Recommendation

**Move to self-hosted Remotion. Ship a v0 in 2 weeks that matches today's captions plus real word-by-word animation, then iterate.**

Reasoning:

1. **Quality ceiling is the only one that matches Jake's bar.** Submagic-tier output is achievable.
2. **No new vendors, no new bill.** Remotion is MIT-licensed; renders on the Railway worker we already pay for.
3. **Per-tenant branding is native** — React props map cleanly onto the existing `tenants.brand` JSON. Aligns with the platform's multi-tenant DNA rather than fighting it.
4. **No lock-in.** If Remotion stalls, the compositions are React; the captions data is just AssemblyAI word timestamps; we can fall back to libass or any API in a week.
5. **Compounding asset.** Every caption style, animation, transition becomes a reusable component — usable later for the Marketing Automation phase (Meta video ads, UGC remixing) that's already flagged as the most important upcoming build.

**The tradeoff to flag:** Remotion renders are CPU-heavy. A 60s 1080×1920 clip will take 1–2 minutes of wall-clock on a 4-vCPU Railway instance. Throughput is solvable (queue depth, scale workers horizontally) but real — current `drawtext` renders in 15–30s. If 239 Live's volume jumps, we'll need to either scale render-worker replicas or move to Remotion Lambda. Plan for it now; don't be surprised by it.

---

## Migration Sketch

**Phase 0 — Spike (2–3 days)**
- New package: `packages/video-composer/` — Remotion compositions, isolated from `render-worker`.
- Build one composition: `<ClipWithCaptions />` taking `{ src, startSec, endSec, wordTimestamps, brand }`.
- Render one Kevin clip locally via `npx remotion render`. Compare side-by-side with current output.

**Phase 1 — v0 in production (1–2 weeks)**
- New worker mode: `RENDERER=remotion` env flag on `render-worker`. Keep ffmpeg path as fallback.
- Replace caption burn with `@remotion/renderer` programmatic render. Keep crop + encode in ffmpeg post-process (Remotion outputs 1080×1920, ffmpeg does final mux + faststart).
- Per-tenant brand props from `tenants.brand`.
- Roll out to one tenant (`239live`) first. A/B for a week.

**Phase 2 — Quality (4–6 weeks total)**
- Word-pop animation with `spring()` from Remotion.
- Keyword highlighting — Claude already picks the clip; ask it to also tag punchline words in the same call (one extra field in the existing prompt, ~$0 marginal cost).
- Speaker labels using AssemblyAI's `speaker_labels` field.
- Face-tracked center crop (sidecar service or `@vladmandic/face-api` inside the worker).
- Per-tenant caption presets stored in `tenant_integrations` so Kevin and future tenants get distinct looks without code changes.

**Phase 3 — Optional polish**
- B-roll insertion (Claude tags 2–3 "show this concept" moments → pull stock from Pexels API → Remotion composition layers them in).
- Music ducking on speech, swell on visuals.
- Move to Remotion Lambda only if throughput requires it.

**Out of scope:** auto-publish to social. That stays human-in-the-loop per cross-project rules.
