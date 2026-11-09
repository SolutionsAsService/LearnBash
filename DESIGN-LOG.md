# DESIGN-LOG: Learn Bash (redesign)

**Run.** DADA, Adaptive mode, Full run type, **bounded to one panel round**. Look: the new design pack `shell-session` (SolutionsAsService/dada-changes, `skills/dada/designpacks/`). The pages are generated from `data/*.json` and the recorded outputs of real runs (`scripts/run_examples.py`); the previous version is kept on the branch `legacy/pre-redesign`.

## R0. The inherited site
Six pages and about 65 KB of decent outline: an introduction, 54 command entries (description, usage, one example each), scripting and advanced chapters, a resources list. But: no output shown for any example (a reader could not tell what a command prints), a README and a footer that were unfilled templates ("Your Name", `git clone .../yourusername/...`), a `script.js` referenced on every page that did not exist, a neon-green-on-black terminal costume with no structure behind it, nothing said about what a command can do to your files, and a link to a community wiki that has since moved. The Frontier: (1) real output for every example, (2) say what each command can do before you run it, (3) make the safe reading of a command line a tool, (4) the Mobile Floor.

## Decisions
**D1 Every output is real.** Each example runs in a throwaway sandbox of sample files with a minimal environment; the page prints what Bash printed, and the build refuses to run if any example lacks a recorded output. A `--check` re-runs everything and compares. D2 **The mark on every command.** Only reads / Changes things / Can delete data, as a rule style plus a word (solid, dashed, double warm), per command and per flag (`find` reads, but `-delete` deletes). D3 **The measured pipeline** as the home picture: seven stages of a real log pipeline, each box showing how many lines come out of it, counted by running every prefix of the pipeline. D4 **The explainer.** Paste a command line, see its parts and the worst it can do, without running it. D5 **Dark terminal by default, light page on request**; one breakpoint; system fonts; nothing loaded from elsewhere. D6 **Honest scope:** outputs are from GNU bash 5.2 on Linux; BSD and macOS differences are noted where known; external links were not checked from the build environment.

## Panel R1 (3 seats, one agent per reference; verdicts in `panel/R1/`)
Krug (usability), Debord (technical claims, verifying by running things), Cairo (measurement, including 114 adversarial command lines). Not seated, for the bound: an inclusion seat.

| Seat(s): finding | Resolution |
|---|---|
| **All three, BLOCKER:** the explainer said "Only reads" about things it could not analyse: `sh -c 'rm -rf ~'`, `bash -c`, `env rm -rf /`, `eval`, `dd`, `shred`, `mkfs`, `git clean -fdx`, `for ... do rm -rf $f`, `echo $(rm -rf /)`, the fork bomb, `chmod -R 777 /`, unknown commands (24 of Cairo's 114 lines too safe) | ADAPT: a fourth verdict, **Can't tell**, for any part it cannot analyse; it never reassures when something is unanalysed. The analyser now looks inside `$( )` and backticks, `sh -c`, `env`, `xargs`, `sudo`, `timeout`, `nohup`, `find -exec`, loops and conditions, skips here-document text and comments, rates `git clean`/`reset --hard`, recognises the fork bomb, device redirects and recursive `chmod` from the root. 75 command lines in `scripts/check-explain.js` get the expected verdict (including a check that "reads" never comes with an unanalysed part) |
| Krug F2: the banner used canned text; the real reason was three screens down | ADAPT: the banner lists the specific reasons (up to four) under the verdict |
| Cairo F3: here-document text was judged as commands | ADAPT: heredoc bodies and comments are skipped; `ls # don't` no longer refused |
| Cairo: `ls \|\|\| wc` accepted; 300 KB token overflowed the page; empty submit left a stale result | ADAPT: connector sequences validated, input capped at 2000 characters, empty submit gets a hint |
| Cairo F2: advice to write `"$dir/*"` is wrong; `rm -rf "$dir"/*` got no empty-variable warning | ADAPT: advice now `"$dir"/*`, and the empty-variable warning fires for quoted forms too (quoting does not help when the variable is empty) |
| Debord / Cairo F4: the legend said "remove or overwrite" but cp, mv, tee, sed -i, tar -x, curl -o, `>` were only "changes"; the home page said "a command that only reads is safe to try anywhere" (false for find, curl, awk, sort -o) | ADAPT: cp, mv, tee, `>` and the flags sed -i, tar -x, curl -o/-O, sort -o are marked Can delete data; legend reworded; the home sentence now says a command marked Only reads will not change your files in everyday form and to check flag marks; the legend notes cd, export and alias change the shell session |
| Debord: dd, shred, mkfs missing from a "can delete" reference | ADAPT: added (45 commands); `xargs` and `awk` notes say they run other commands |
| Debord lessons (each verified by running): "exit status 127" on the `set -u` example was a `bash -c` quirk (a script file exits 1) | ADAPT: the example is now a script file and shows exit status 1 |
| Debord: "trap EXIT fires however it ends" is false for kill -9 and exec; `[ ]` with `==` fails in dash; basename/dirname note false for a trailing slash; Mac Terminal defaults to zsh so globbing and word-splitting lessons do not reproduce; set -e exceptions worded loosely | ADAPT: all five reworded, and a zsh note added at the start of Basics and in the quoting lesson |
| Debord minor: unsorted `find -maxdepth` example contradicts its note; "120 flags" counted 17 non-flags; touch -d / date -d macOS claims; curl -s; cut -c; mtime; heredoc "Home" line; CONTRIBUTING said "no build step"; wiki.bash-hackers.org "moved" | ADAPT: example sorted; the flag count now counts only dashed flags (109); wordings corrected; heredoc example changed to a computed value; CONTRIBUTING rewritten for the real build; the wiki line now says it is not listed because it could not be checked |
| Cairo F9: "149 examples" is the distinct count but 151 are printed | ADAPT: pages say "N examples, all run" per page, computed |
| Krug F3 / Cairo F5: "copy folder", "duplicate", "delete", "recursive", "permissions", "download" found nothing; without JS there was no index (cp 5,705px down) | ADAPT: every command has everyday keywords and search matches every word you type; "copy folder" finds cp, "delete" finds find/rm/rmdir/shred/tr, "download" curl; a collapsible jump list of all 45 commands works without JavaScript |
| Krug F4: lessons ended in a footer; "Getting help" came last | ADAPT: Previous/Next links on every page; Getting help is now the third lesson of Basics |
| Krug F5: the home page led with an unexplained pipeline; "Where to go" was 2,200px down | ADAPT: the cards come first, the pipeline has a one-sentence setup, the marks follow |
| Krug F6: nav wrapped to two rows (header 146px) | ADAPT: tighter nav; the header is 103px at 360, 390 and 430 |
| Krug: a blank line above each terminal output; basics intro and contents pushed lesson 1 below the fold | ADAPT: stray newline removed; the contents list is a collapsed "On this page" control (first lesson at y=482 on a 390px phone) |
| Cairo: placeholder 3.58:1 in dark, control borders 1.8 to 2.2:1 | ADAPT: placeholder opacity fixed, controls use a stronger border colour; contrast preset n:0 on home, commands and explain at 390 and 1280 |
| Debord: the Rounded-versus-marks and "Only reads on cd" worries; spectacle risk of three marks | PARTLY ADAPTED: the marks mean "what it can do in ordinary use", stated; the explainer says it is a reading aid, not a safety scanner. Not done: rating every flag |
| Krug F1 (the fourth state also for unknown commands in the reference) | ADAPT: unknown commands give Can't tell everywhere |
| Cairo: `2>&1` ordering not explained; command-card flags stacked; search box below the legend | DEFERRED |

## Measured
Before the fixes (Cairo): Mobile Floor 12 of 12 on 7 pages at 360, 390 and 430px; contrast preset n:0; 0 horizontal overflow at 360, 390, 430, 1280; one h1 per page; 160 internal links resolve; 0 external requests; no-JS shows 45 cards and no dead controls; 12 of 12 recorded outputs re-run independently identical; pipeline counts 40, 16, 16, 16, 3, 3, 3 reproduced; 0 HTML injection and no hang in 114 adversarial lines. After the fixes (this log): Mobile Floor passes on all seven pages; contrast preset n:0 on home, commands and explain at 390 and 1280; `run_examples.py --check` and `build.py --check` pass; `check-explain.js` 75 of 75; in a real browser the explainer rates `git push --force`, `xyzzy` and `for ... rm -rf $f` as expected, an `<img onerror>` line is not injected, search finds `cp` for "copy folder"; the nav fits one row at 360, 390 and 430px.

## Stop test
S1 not met (no R2). S2 not met (the changes were judged by measurement and a real-browser check, not by the panel). S4 not run. **Reported as incomplete under the one-round bound.**

## Open
- The explainer is a reading aid, not a safety scanner. It covers 45 commands; anything else is "Can't tell". It does not model every shell feature (aliases, functions defined elsewhere, unusual quoting), and a verdict of Only reads can still be wrong for your situation.
- Contrast was re-measured with the contrast preset after the fixes, not with Cairo's full both-schemes walk.
- Examples ran in one environment (GNU bash 5.2.21 on Linux, as root in a container). Output on macOS or other systems can differ; the pages say where known. Several BSD and macOS claims are from memory.
- External links were not checked from the build environment.
- No inclusion seat; not shown on a real phone (copying a command, the keyboard over the explainer result, text zoom).
- Not done: `2>&1` ordering in the explainer, rating every flag, a copy button on terminal blocks.

---

# Round 2: the landing (graded C by the owner)

**Why.** The owner graded round 1 **C**: correct and well built, but "no bold landing graphic, nothing that stands out". The first screen was a headline, two buttons and a row of small boxes. Run type: **Landing** (only the home page's first screen and what sits under it change; the other pages, palette and type are frozen, the landing may push them), bounded to one panel round, with the social card regenerated to match.

## Decisions
**D7 The pipe is the hero.** The site's real idea is that you can *see* what each command does, so the first screen shows a real seven-command pipeline as one continuous pipe whose thickness is the measured number of lines still flowing through it, at an exact scale of 3.6 px per line (40 lines is 144 px, 3 lines is 10.8 px, the true ratio), with the real final output beneath it. It sits in a terminal window under an oversized `$ learn bash` headline with a block cursor. D8 **The poster is dark in both colour schemes,** and on the landing the header joins the dark band, so the first screen is one object and not a light bar over a black block. D9 **Green is rationed:** saturated green is only on the pipe and the primary button; the headline, counts and kicker are white and grey. D10 **The pipe narrows where lines are thrown away:** each segment runs from the lines that came into the command to the lines it let out, so `grep` and `uniq -c` (the real reducers) taper, and `cat`, `sort` and `awk` do not.

## Panel R2 (3 seats; verdicts in `panel/R2/`)
Arnheim (visual force and balance), Krug (the five-second test), Cairo (first-screen measurement in both colour schemes).

| Seat(s): finding | Resolution |
|---|---|
| Arnheim (biggest change): the headline outweighed the pipe, which is the idea; make the pipe the hero, headline about 60%, one continuous pipe, everything above the fold | ADAPT: headline reduced (clamp 2.4rem to 4.4rem) and set beside the lede and buttons on desktop; seven segments joined with no gaps; the pipe, its commands and the real output now all fit above the fold at 1280 x 800 and 1440 x 900 (output ends at y=723) |
| Arnheim: green on every element ranks nothing; the glow softens the pipe | ADAPT: green only on the pipe and the primary button; glow removed from text and the pipe |
| Arnheim / Cairo: the 3-line stage was drawn at 0.117 of the 40-line height against a true 0.075 (a lie factor of 1.56), and the taper was on the wrong commands | ADAPT: exact scale, no minimum; thickness 144 to 10.8 px; each segment tapers from its input to its output. Verified by reading the rendered custom properties |
| Arnheim: the light header against the black hero is a hard seam | ADAPT: on the landing the header sits on the dark band |
| Arnheim: black-and-green terminal frame is the template; only the thickness-as-count pipe is not | ACCEPTED: the frame is kept because the site is about the terminal; the pipe is the distinction and is now the largest element |
| Krug MAJOR: on a phone the demo ran 913 px and the first card sat at 1.8 screens | PARTLY ADAPTED: the funnel rows are shorter and the jargon line is hidden on a phone; the demo is 735 px and the first card is at y=1272 (about 1.5 screens). The demo stays as the second screen, as Krug advised |
| Krug MAJOR: the pipe does not explain itself; the caption is off the first screen; "(7 commands, joined by pipes)" is jargon | ADAPT: a one-line key above the pipe ("as thick as the number of lines left after each command"), plain wording ("Seven small commands, one after another"), and "See it explained, step by step" is now a visible button |
| Krug: two cursors with two spellings; the kicker (the only "who is it for" line) is too small | ADAPT: one cursor (the brand mark is static); the kicker is a 15 px sentence: "Learn the Bash shell, from your first command to real scripts" |
| Cairo MAJOR: print unreadable (h1 1.09:1, pipe invisible) | ADAPT: a print stylesheet: black on white, the pipe in grey; verified in print emulation |
| Cairo MAJOR: 200% text zoom clipped the no-wrap headline | ADAPT: the headline may wrap; verified no overflow at 320, 360, 390, 768, 1024, 1440, 2560 and at 200% text size on a 360 px viewport |
| Cairo MAJOR: og:image / twitter:image relative (do not work for crawlers); no og:url or canonical | ADAPT: `data/site.json` holds the deployed URL; when it is set, og:image, twitter:image, og:url and a canonical link become absolute. It is empty now because no live address is known; set it after deploying |
| Cairo MINOR: primary-button focus ring the same colour as its fill; 15 px body floor | ADAPT: white focus rings on the hero; kicker, key and caption raised to 15 px (the floor caught them) |
| Cairo / Arnheim: the social card crops command names, the output and has no wordmark | ADAPT: regenerated with the headline, the whole pipe, the command names and the real output |
| Arnheim: streak animation unjudged (stills only); Cairo: 8% of the pipe above the fold at 360 x 640 | NOT CHANGED: the animation measured 60 fps with 0 long tasks and stops under reduced motion; a 640 px tall phone shows only the top of the pipe |

## Measured (after the fixes)
Mobile Floor passes on all seven pages. Contrast preset n:0 on the home page at 360, 390, 430 and 1280. The pipe's custom properties: 144, 57.6 and 10.8 px for 40, 16 and 3 lines. Headline: one line at every width tested, no page overflow, no overflow at 200% text size. Print: black on white. First screen at 1280 x 800: h1 at y=172, primary button at 204, pipe at 377 to 626, real output at 626 to 723. Social card 1200 x 630 with a dark background to the edge.

## Stop test
S1 not met (no R3). S2 not met (round 2's changes were judged by measurement, not re-judged by the panel). **Reported as incomplete under the one-round bound.**

## Open
- Not shown on a real phone: thumb reach of the primary button (centre about a third of the way down), scroll feel past the pipe, the animation on a low-end device, sunlight legibility of the dark band.
- The deployed URL is not set, so og:image is relative until `data/site.json` is filled in.
- At 360 x 640 only the top of the pipe is above the fold.
