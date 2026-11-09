# R2 Measurement seat: Cairo (Evidence). Landing hero
Method: run in Chromium (playwright), file:// build of /home/user/learnbash. No site file edited.

## Measurements
| # | Check | Result | Verdict |
|---|---|---|---|
| 1a | check_floor.py | 360/390/430: 12/12 hold, PASS | PASS |
| 1b | measure.py contrast preset, 360/390/430/1280 | fails: [] at all four | PASS |
| 2a | Contrast, dark scheme, every hero+header text node | min 7.10 (window title ~/demo: bash); next 7.10-7.86 (small "lines", "(7 commands...)"); kicker 11.19, h1 17.84, lede 12.47, primary btn 9.78, ghost btn 11.19, counts 13.87, commands 15.02, question 16.5, final output 12.58, caption 9.92, caption link 11.39; header brand 14.97, nav 10.07 | PASS |
| 2b | Contrast, light scheme | Hero is pinned dark (.hero-dark), numbers identical to 2a. Header follows scheme: brand 16.65, nav 9.63, "$"/"_" accent 5.07 (10,122,64 on 245,248,246) | PASS (lowest 5.07) |
| 2c | Focus rings (keyboard Tab) | Hero: outline 3px solid #4ade80, offset 3px on #0a0d0f = 11.19:1 vs bg. Primary button: ring colour equals its fill (#4ade80) but the 3px offset leaves a dark gap, so ring still reads. Header light: 3px #0a7a40 on #f5f8f6 = 5.07 | PASS |
| 3a | h1 top y / primary btn top / pipe window top / pipe bottom / fraction of pipe above fold (pipe = 7 .fp boxes) | 360x640: 171 / 329 / 462 / 1099, 0.08. 390x844: 171 / 335 / 467 / 1096, 0.49. 430x932: 171 / 314 / 447 / 1076, 0.71. 768x1024: 117 / 311 / 389 / 996, 1.00 (pipe top 503). 1280x800: 134 / 365 / 455 / 768, 1.00 (pipe 608-768). 1440x900 and 1920x1080: same as 1280 (pipe 608-768) | Primary button above fold at every size (max bottom 413). Mobile pipe mostly below fold at 360 (8%) |
| 3b | Page overflow (scrollWidth - innerWidth) | 0 at all 7 viewports and at 320/360/390/768/1024/1440/2560 | PASS |
| 3c | h1 wrap/clip, widths 320/360/390/768/1024/1440/2560 | 1 line everywhere; cursor right edge inside viewport (309/337/364/697/924/1139/1699). Font 40px at 320 (clamp floor): h1 content overflows its own box by 6px at 320 only, but stays inside the viewport (no clip) | PASS (320 marginal) |
| 3d | Text zoom emulation | Root font 32px (=200% text size) at 360 wide: h1 80px, cursor right edge 618 > 360, page overflow 258px, h1 clipped. At 720 wide: fits. Reflow-style 200% (css viewport 180 and 195): cursor right 309 > 180/195, overflow 129 / 114px, h1 clipped (floor 2.5rem=40px cannot shrink). 640 css width (200% of 1280): fits | FAIL at 200% on phone widths |
| 4a | Printed counts vs outputs.json pipeline.counts [40,16,16,16,3,3,3] | All 7 equal | PASS |
| 4b | --a/--b == max(14, round(120*c/40)) and next stage | All 7 segments match (120/48, 48/48, 48/48, 48/14, 14/14, 14/14, 14/14) | PASS (formula); see F1 for the formula itself |
| 4c | Rendered pipe thickness ratio vs counts (clip polygon: half-width = a*0.6px) | Thickness px: 144, 57.6, 57.6, 57.6, 16.8, 16.8, 16.8. 16:40 drawn 0.400 vs data 0.400 (exact). 3:40 drawn 0.117 vs data 0.075 | FAIL for the 3-line stages (lie factor 1.56) |
| 4d | Final output vs pipeline.final | Byte-identical (6 spaces + "9 /old-page", "5 /missing.png", "2 /favicon.ico") | PASS |
| 4e | Caption "40 to 16 to 3" | Generated from dict.fromkeys(counts) in build.py:158 = 40, 16, 3; sample size 40 = counts[0] | PASS |
| 5a | prefers-reduced-motion: reduce | all 7 .fp animation: none; .blk (hero cursor) none; header .cur none. Without reduce: flowv x7, blink | PASS |
| 5b | Frames over 3s, long tasks, CPU | Animated 390: 180 frames (60.0 fps), 0 long tasks, main-thread TaskDuration 0.158s per 3s (5.3%), style recalc 0.031s; static: 182 frames, 0.034s (1.1%). Animated 1280: 181 frames, 0.175s (5.8%) vs static 0.038s. Layout 0.000 in both. Headless, no GPU, so paint cost is not isolated | PASS (+4.5 pts of one core for the animation) |
| 5c | JS disabled | 0 script tags; h1 and 7 pipe segments present; screenshot rendered | PASS |
| 5d | Print (emulate print, PDF, default no background graphics) | Hero text is extracted fine but is painted light on white because only .hero-dark background is reset: h1 #eef7f2 on white 1.09:1, lede 1.56, commands 1.32, counts 1.43, question 1.20, final output 1.55, caption 2.00, kicker/ghost button/link #4ade80 1.74. Pipe invisible (background gradient dropped). With backgrounds printed it keeps the dark window | FAIL |
| 6a | social.png | 1200x630, 187,957 bytes (183.5 KB) | PASS |
| 6b | Meta tags | og:title, og:description, og:type, og:image="social.png", twitter:card=summary_large_image, twitter:image="social.png" all present. No og:url, no canonical | PARTIAL |
| 6c | Card content vs page | Same "$ learn bash" headline with cursor, same 7 counts, same pipe shapes (viewed). Commands under the pipe and the final output are cropped off by the 630px height, so the card shows counts and a pipe without the commands that name each stage | NOTE |
| 6d | og:image relative URL | Relative values are not resolved by Facebook, LinkedIn, Slack, X, Discord or iMessage crawlers; they require an absolute URL. No site origin is in the build, so the card will not show | FAIL |
| 7 | Weight | index.html 7,336 B (2,463 gz); styles.css 21,245 B (5,391 gz); social.png 187,957 B; external requests: none (0 http/url()/@import in css, 0 http in index.html, no script, one local favicon.svg) | PASS |

## Findings

BLOCKER
1. None found by measurement.

MAJOR
1. The pipe overstates the final stages. The floor `max(14, round(120*c/40))` (build.py:127) draws 3 lines at 16.8px against 144px for 40: ratio 0.117, true ratio 0.075, lie factor 1.56. Nothing on the page says the thickness is floored, and the caption claims "thickness = lines still flowing" in spirit ("the pipe gets thinner as each command throws lines away"). Fix: either drop the floor to 0.6*120*3/40 = 10.8px (still a visible 10px bar at 1x), or keep it and add to the caption "(thickness drawn to scale, minimum 14 units so 3 lines stay visible)". The first is a one-line change (floor 14 -> 9).
2. The taper is drawn on the wrong command. Segment k uses --a = its own count and --b = the next count, so `cat access.log` (40 out) is drawn narrowing to 16 and `sort` (16 out) narrowing to 3 (data: cat 40, grep 16, awk 16, sort 16, uniq -c 3). The reader sees cat and sort throwing lines away; it is grep and uniq -c that do. The caption "thinner as each command throws lines away" is therefore pinned to the wrong labels. Fix: make each segment taper INTO its own count (--a = previous count, --b = own count, first segment flat at 40), so grep and uniq -c show the narrowing; the numbers above stay unchanged.
3. Print is unreadable. With default print settings (backgrounds off) the hero keeps light-on-dark colours: h1 1.09:1, lede 1.56:1, commands 1.32:1, question 1.20:1, final output 1.55:1, pipe invisible. The only print rule is `.hero-dark{background:#fff;box-shadow:none}` (styles.css:176). Fix: in @media print set `.hero-dark, .hero-dark *, .win {color:#000 !important; background:#fff !important; text-shadow:none; filter:none}`, give `.fp` a `background:#000` (print-color-adjust: exact) so thickness survives, and hide `.blk`.
4. Text zoom 200% breaks the headline on phones. h1 is nowrap and its floor is 2.5rem, so with root font 32px at 360 wide the cursor ends at x=618 (258px horizontal overflow); with a 180-195 CSS px reflow viewport the overflow is 114-129px. Fix: drop nowrap below 760px and let it wrap at the space ("$ learn" / "bash"), or use `font-size: clamp(1.6rem, min(12.2vw, 9rem), 8.2rem)` plus `overflow-wrap:anywhere`; re-measure scrollWidth-innerWidth = 0 at root font 32px/360.
5. og:image and twitter:image are relative ("social.png"). Real crawlers need an absolute https URL; as built the card will not render when the page is shared. Fix: build.py takes a SITE_URL constant and emits `https://<origin>/social.png`, plus og:url and rel=canonical.

MINOR
6. At 360x640 only 8% of the pipe is above the fold (49% at 390x844, 71% at 430x932): the page's evidence is below the fold on the smallest phones, though headline, lede and both buttons (bottom 377) are above it. Fix: reduce `.fs` min-height 4.4rem to 3.6rem at max-width 400px, which would raise the visible share; remeasure.
7. At 320 wide the h1 content overflows its own box by 6px (scroll 6, no viewport clip). Fix: lower the clamp floor to 2.2rem or letter-spacing -.05em.
8. The social card crops away the commands and the final output, so the printed counts have no stage names. Fix: show the 7 command names under the pipe in the card (re-render at 1200x630 with the window top moved up ~80px) so the card is as checkable as the page.
9. Animation costs about 4.5 points of one core (0.158s vs 0.034s per 3s, 60 fps held, no long tasks, layout 0). Animating background-position under clip-path plus a drop-shadow filter forces a repaint of 7 elements each frame (style recalc 0.031s only in the animated runs). Acceptable now; if battery matters, pause with `animation-play-state: paused` once the hero is off screen (IntersectionObserver or `animation-timeline`) or after 6s.
10. Primary-button focus ring has the same colour as the button fill (#4ade80); it is visible only through the 3px offset gap (ring vs page 11.19:1). Fix if desired: `.hero-dark .btn:focus-visible{outline-color:#fff}`.
