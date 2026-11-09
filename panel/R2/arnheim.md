# Critic: Formalist (Arnheim), R2 landing, verdict

Work argued from: Arnheim, Art and Visual Perception (balance, weight, the structural skeleton, figure and ground, directed tension). Caveat: I did not load the live page for a motion pass; I judged the supplied stills, so streak animation is unjudged.

**Verdict: OBJECT (conditional).** The first screen has a dominant focal point, but it is the wrong one. The headline ($ learn bash plus a solid green cursor block, about 950 px wide and 107 px tall at 1280) is the heaviest mass in the frame and takes the eye first. The pipe, which is the site's actual idea, enters second and sits at the bottom edge, where at 1280x800 and 390x844 it is cut off before its meaning is complete. The pipe is a real data form and not decoration: width is fixed and height varies, 40 to 16 to 3. But it is drawn as seven separate tiles with gaps, not as one continuous conduit, and thickness is only roughly proportional. Green is on every element, so it ranks nothing. The glow thickens the forms where it should be sharpening the one that matters. The tension the headline sets up (a left-to-right reading toward the cursor) dies at the right edge and does not hand the eye down to the pipe.

1. **MAJOR. Eye path breaks at the right edge.**
   - Evidence, 1280x800: the eye enters at the "$" (x 110-180, y 130-265), runs along the headline to the cursor (x 993-1059, y 145-252), the brightest solid mass on the screen, and ends there. The lede (x 108-628, y 285-345) and buttons (y 365-413) sit left and below. x 640-1170 at y 280-430 is empty. The cursor is a dead end, with nothing pulling the eye back left or down.
   - Proposed change: stop the cursor from being the highest-contrast solid. Make it outlined, or white at reduced weight, so the eye does not park there. Let the pipe's first funnel (cat access.log, 40) sit directly under the cursor's column or run into it, so the headline's end flows into the pipe's start.

2. **MAJOR. Headline outweighs the pipe; the best thing is not the biggest thing.**
   - Evidence: the headline cap height is about 107 px and 950 px wide. The pipe's tallest stage is about 143 px and its right half is 16 px or less. The pipe block is quieter than the title above it, and the title is a statement every terminal template makes.
   - Proposed change: cut the headline to about 60-65% of its current size, or stack it on one line at roughly 64 px. Give the freed height to the pipe, with the tallest stage about 220-260 px at desktop. The pipe should be the largest area of saturated colour.

3. **MAJOR. At 1280x800 and 1440x900 the fold cuts the pipe off from its meaning.**
   - Evidence, 1280x800: the command labels are at y 782, the very last line before the cut. The real output (9 /old-page ...) and the explanation are below the fold. At 1440x900 the output box is just starting (y 818+, three lines clipped). The viewer sees pipe, counts and commands but not the payoff.
   - Proposed change: pull the pipe up about 100-150 px (smaller headline plus the lede and buttons beside it, not stacked) so the output lines land above y 800. On wide screens use a two-column band: headline, lede and buttons at left, pipe window at right.

4. **MAJOR. Phone fold shows only the funnel and the first count.**
   - Evidence, 390x844: the window starts at y 470. Visible are the 40 stage with its funnel (y 603-760) and the labels 40 and 16. The rest of the pipe, which is the thin part and so the point (16, 16, 3, 3, 3), is below. A funnel with no narrow end reads as a bowl or a decorative shape and not as data. The two stacked buttons and the lede take 270 px of vertical space ahead of it.
   - Proposed change: on the phone put the buttons in one row or drop the secondary to a text link, tighten the headline's block, and start the window by about y 400. Compress the vertical pipe so all seven stages, including the narrow ones, show by 844 (for example 36 px per stage rather than about 70).

5. **MAJOR. Green is overused and carries no rank.**
   - Evidence: in one frame the same hue marks the eyebrow, "$", cursor, primary button, outline button, header cursor, window dot, prompt, all seven counts and the whole pipe, with glow on most of them. The "$ ... " headline is white with a green "$" and cursor, so the headline is two-toned, the pipe is one-toned, and nothing says "this one".
   - Proposed change: ration it. Pipe and the primary button only in saturated green. Counts in white or pale grey with the pipe behind. Eyebrow, outline button, the "$" and the cursor drop to white or a dim green. One hue used with discipline reads as an accent. The current use reads as a theme.

6. **MINOR (verging on MAJOR). The pipe is segmented; "one pipe" reads as a row of cylinders or bars.**
   - Evidence: stages 2-3 are flat rectangles, stages 1 and 4 are trapezoids, stages 5-7 are thin strips, with a visible gap of about 8-10 px between each (x 267/277, 414/424, 562/571 at 1280). The gaps cut the flow into units. The streak texture repeats per tile, and at a glance the row looks like a bar chart.
   - Proposed change: close the gaps so the stages abut and the edges are continuous. Draw one outline and a faint wall or rim, with small flange joints where a pipe goes through each command. Let the taper at 1 and 4 be the only slopes, as it is now, and align the centreline so the pipe stays on one axis.

7. **MINOR. Thickness is only roughly proportional to the count.**
   - Evidence, desktop: the 40-line stage is about 143 px at its mouth, 16 is about 58 px (0.40, true 0.40) and 3 is about 16 px (0.11, true 0.075). So the narrow stages look 1.5x too fat against the count, and there is a floor. At phone width, the narrow stages are even less distinct from the 16s.
   - Proposed change: set height = count x constant exactly (3.6 px per line at 40 = 143 gives 3 = 10.8 px) and say so in the caption. If the floor is for legibility, keep it, and print the real ratio in the caption. The meaning claim, thickness = lines, should be true to within a pixel.

8. **MINOR. The glow mushes the headline and the pipe edges.**
   - Evidence: the text-shadow on "learn bash" and the cursor spreads about 20-30 px and lifts the black ground to a dark green haze around the letters (clearly visible at x 100-1100, y 130-270). On the pipe, the bright stripes inside each tile blur at the edges, so the tile boundary is soft.
   - Proposed change: keep glow only on the cursor, at half strength, or remove it from the headline entirely. Give the pipe a crisp 1 px edge. Use glow as the signal that something is flowing (the streaks) and not as a style for everything.

9. **MINOR. Dark hero against the light header is a seam in light mode, a strength only if the header yields to it.**
   - Evidence, 1280 light: a 59 px near-white bar (#f5f8f6 or so) with dark nav text, then a hard edge to near-black at y 59, with a thin grey hairline inset from the hero's edges (x 90 and 1190) that does not align to the hero's own edge. The change in value is maximum, so it is strong, but the white header stays, in full, the brightest area of the screen and competes with the green for first look. In dark mode (1440 dark) header and hero merge and the seam goes.
   - Proposed change: in light mode make the header transparent over the hero on the home page only (dark bar, light text), so the first screen is one dark field from y 0. Or keep it light and make it 44 px with no hairline. Either way remove the inset hairline.

10. **MINOR. Social card is a faithful crop but cuts the pipe at its most important point.**
   - Evidence, 1200x630: headline, lede and the seven counts and the pipe are in the same arrangement as the page. Cut at y 630: the command names and the output are gone, buttons are gone, and there is no wordmark or URL. The pipe's bottom edge is at about y 617 and its labels fall off. As a thumbnail the headline is the first and only legible thing, so the pipe appears as green decoration.
   - Proposed change: author the card as its own composition, not a crop: smaller headline, the whole pipe with its commands, and the 3 output lines, with a small "learn-bash" wordmark. This is the same graphic but with the payoff included.

11. **MINOR. Distinctiveness: the frame is the template, the pipe is the exception.**
   - Evidence: black field, green on black, monospace headline, a cursor, a window with traffic-light dots and a "$" prompt are what a hundred terminal landing pages ship with. The only thing here no other site has is the thickness-as-count pipe, and it is placed as one panel among others.
   - Proposed change: see the single change below.

**Single change that would raise it most:** make the pipe the headline. Reduce "$ learn bash" to roughly 60% of its size and put it, the lede and the buttons in the left third, or above on a phone. Let one continuous, correctly scaled pipe (3.6 px per line) span the full width as the largest and the only strongly green form, with counts above and commands below, all seven stages and the output above the fold at every viewport. Ration green to it and the primary button. The eye then goes headline (brief), then the funnel's mouth, then along it to the narrow end and the output, and ends on the call to action under it.

Blind spot noted: I have not judged whether "40, 16, 3" is the true measured count, only how it is drawn.
