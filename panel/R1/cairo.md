# R1 measurement report: Cairo (Evidence), learnbash

Method: everything below was run by me, in this session, against /home/user/learnbash. No site file was edited. Scratch scripts are in the session scratchpad (contrast.js, ex.js, beh.js, ui.js, site.js, indep.py, cases.txt).

## Measurements

| # | Measurement | Result | Pass/Fail |
|---|---|---|---|
| 1 | check_floor.py, 7 pages x 360/390/430 | 12/12 hold on all 21 page-widths | PASS |
| 2 | measure.py --preset contrast, 7 pages x 390/1280 | 0 fails on all 14 runs | PASS |
| 3 | WCAG text contrast, dark, index/basics/commands/explain (explain empty, danger result, safe result) | 7 page-states, 7-17 distinct fg/bg pairs each, 0 under 4.5. Lowest 5.95 (12px muted "lines out"); marks 8.0-9.2; terminal/command/prompt >= 8.8 | PASS |
| 4 | Same, light scheme | 0 under 4.5. Lowest 4.69 (accent link `.more` on band bg 233,240,236), 5.07 (`$` prompt in masthead), 5.24 (destroys mark), 5.28 (button/skip text) | PASS (4.69 is thin) |
| 5 | Button hover `filter:brightness(1.1)` light scheme, computed | 4.66 | PASS (thin) |
| 6 | Mark glyph (border box) vs its background, both schemes | 5.2-10.3 | PASS |
| 7 | Input placeholder (#757575) | dark 3.58 on input bg (24,32,37); light 4.61 | FAIL dark |
| 8 | Non-text UI boundary: input/chip border `--line2` vs bg | dark 1.80-2.05; light 2.07-2.21 (WCAG 1.4.11 asks 3:1) | FAIL |
| 9 | Focus ring, both schemes | 3px solid accent, present | PASS |
| 10 | `run_examples.py --check` x2 | "ok: 149 examples and the pipeline match", rc 0 both; outputs.json byte-identical afterwards | PASS |
| 11 | `build.py --check` | ok, rc 0 | PASS |
| 12 | Independent rerun of 12 recorded outputs in my own fixture copy (ls -l|cut, find|sort, tar -czf/-tzf, diff -u|head, set -e, trap EXIT, diff <(..) <(..), awk, date -d, sort -n, uniq -c, xargs -n1) | 12/12 identical output and exit status | PASS |
| 13 | Home pipeline counts, my own run of the 7 prefixes on access.log | 40,16,16,16,3,3,3 (also python: 40 lines, 16 with " 404 "); final "9 /old-page / 5 /missing.png / 2 /favicon.ico" | PASS |
| 14 | Leaks in outputs.json | "/tmp/" paths: 0; "learnbash-": 0; host name "vm": 0; today's date (2026-11-09 in any format): 0; only year present is 2025 (fixed fixture) | PASS |
| 15 | explain: `node scripts/check-explain.js` | ok, 34 lines judged as expected, 6 malformed refused | PASS |
| 16 | explain: my 114 command lines (cases.txt) in explain-core.js | 0 crashes; 7 deliberate throws (unclosed quote/backtick/$(, bare `;`/`&`) plus 1 false throw (F5); slowest line 9 ms total for all 114. Plainly wrong verdicts: 24 (see findings) | FAIL |
| 17 | explain: stress (2 MB of tokens) | 10k tokens 16 ms; 100k 88 ms; 480k chars 151 ms; 100k pipes 155 ms; 1 MB single word 294 ms; 5000 nested `$(` 0 ms. No hang | PASS |
| 18 | explain: HTML injection in real browser (`<img onerror>`, `<script>`, `"><svg onload>`, `<b>` in args/targets, entities) | 0 injected elements, 0 alert dialogs, 0 page errors. renderer `esc()` covers & < > " and no data lands in an attribute | PASS |
| 19 | explain UI: 7 example chips | all 7 produce a verdict; reads/reads/changes/destroys/destroys/destroys/destroys | PASS |
| 20 | commands.html cards / per-group counts vs data | 42 cards; files 10, view 5, text 11, system 8, net 2, shell 6 = chips 10/5/11/8/2/6; count text correct for each | PASS |
| 21 | commands.html search count vs name+summary data | copy 2, count 1, search 1, GREP 1, zzzz 0, blank 42, "rm" 4, "a" 37: all equal data | PASS |
| 22 | Search by intent word (what a learner types) | "delete" -> `tr` only (not rm); "recursive" 0; "permissions" 0; "download" 0; "zip" 0; "-r" 0 | FAIL (F8) |
| 23 | No-JS, all 7 pages | 0 visible form controls, 0 dead buttons; 42 cards and 80 terminals visible on commands; 28/25/18 on lessons; only hidden things are the JS-only tool wrappers; explain shows a noscript line | PASS |
| 24 | Deep links commands.html#cmd-grep, #cmd-xargs | target top = 16px, not hidden, header not sticky so nothing covers it; `#cmd-nonexistent` no element (no error) | PASS |
| 25 | Horizontal overflow, 7 pages x 360/390/430/1280 | scrollWidth == clientWidth on all 28 | PASS |
| 26 | Same with explain results of 120-char tokens at 360/390 | no overflow. 300,000-char single token: overflow | FAIL (extreme, F10) |
| 27 | Heading outline | one h1 on each of 7 pages; 0 skipped levels (commands has 115 headings) | PASS |
| 28 | Internal links/anchors | 160 href/src checked, 0 broken, 0 duplicate ids | PASS |
| 29 | External requests while loading (7 pages x 4 widths) | 0 non-file requests. 7 external hrefs exist, all on resources.html; none reachable from this sandbox (000/403), so unverified; footer already says so | PASS |
| 30 | Printed counts vs data | 42 commands, 120 flags = data (42, 120). 28/25/18 = lessons data. 71 lesson + 80 command example blocks = 151 shown. "149 examples" (index meta) = 149 distinct code strings (2 repeat: `ls -a`, `type -t cd ls if`). Pipeline "7 commands", "40 lines" = data | PASS with note (F9) |
| 31 | Page weight (html + css + js, raw / gzip) | index 21.0 KB / 6.1; basics 32.2 / 8.3; commands 75.0 / 14.8; scripting 35.8 / 9.0; advanced 30.1 / 7.9; explain 47.0 / 15.4; resources 18.9 / 5.6 | PASS |

## Findings

### BLOCKER

**F1. The explainer says "Only reads / Nothing in this changes your files or the system" for commands it did not analyse.** The caveat is a clause tacked onto the end of a green verdict, and for loops and substitutions there is no caveat at all. Measured with explain-core.js and in the real UI:
- `for f in *; do rm -rf $f; done` -> Only reads (3 segments, all reads; `do` is taken as the command and `rm -rf` as its arguments). `if true; then rm -rf /; fi` -> Only reads. Same for `else`, `{ ...; }` is partly seen but `(cd` and `{` are "unknown", `then`/`do` are not.
- `echo $(rm -rf /)`, ``echo `rm -rf ~` ``, `ls "$(rm -rf ~)"` -> Only reads (substitution bodies are never analysed).
- `bash -c 'rm -rf /'`, `sh -c "rm -rf ~"`, `eval "rm -rf /"` -> Only reads.
- `env rm -rf /`, `command rm -rf /`, `nice rm -rf /` -> Only reads (unknown wrapper). Only `sudo`, `time`, `nohup` are unwrapped.
- Unknown commands: `dd if=/dev/zero of=/dev/sda`, `mkfs.ext4 /dev/sda1`, `shred -u secret`, `truncate -s 0 f`, `git clean -fdx`, `killall node`, `reboot`, and the fork bomb `:(){ :|:& };:` -> headline "Only reads: Nothing in this changes your files or the system." (UI text for dd: "...Part of this uses 1 command the reference does not know, so the verdict covers only the parts it does.")
- Writes hidden in arguments: `awk '{print > "out"}' f`, `sed 's/a/b/w out' f`, `sort data.csv -o data.csv` -> Only reads. `curl -X DELETE http://api` -> Only reads.
- The page's own limits sentence (explain.html:37) says loops and nested substitutions "are shown as plain text"; it does not say the verdict then reads green. Line 36 says "Anything else is shown as unknown"; the per-part badge says so, the headline does not.
Count: 24 of my 114 lines get a verdict that is plainly too safe, 16 of them the green "Only reads".
Fix: (a) add a fourth state "Not fully analysed" (neutral, not green) as the headline whenever `a.unknown > 0`, or the input contains `do|then|else|elif|{|(|$(|backtick|eval|bash -c|sh -c|env|command|nice|xargs`; show "Only reads" only when every part was recognised. (b) After `;`, `&&`, `||`, `|`, `!`, `then`, `do`, `else`, `elif`, `{`, `(` re-read the next word as the command (explain-core.js analyzeSegment: skip leading keywords in `BUILTINS` before choosing `cmd`). (c) Recurse into `$(...)`/backticks and `-c` strings with the same analyser and take the worse impact. (d) Unwrap `env`, `command`, `nice`, `ionice`, `exec`, `builtin`, a leading backslash, and `xargs <cmd>` (take the impact of `<cmd>`). (e) Add `dd`, `mkfs*`, `shred`, `truncate`, `git`, `killall`, `reboot`, `shutdown`, `wget` to the data as unknown-dangerous, or treat any unknown command as "changes" by default.

### MAJOR

**F2. The empty-variable warning gives wrong advice, and misses the quoted form.** `rm -rf $dir/*` warns: Write it as `"$dir/*"`. That string is a literal `*` (quoted glob), so it deletes nothing useful and hides the real fix `"$dir"/*` (or `${dir:?}`). Conversely `rm -rf "$dir"/*`, `rm -rf "${dir}"/`, `rm -rf "$(pwd)"/*` get only "-r with -f deletes a whole tree", no empty-variable warning, although an empty `$dir` gives `/*` exactly as in the unquoted case (the check requires `w.unqvar`, which quotes clear). Fix: for rm paths starting with `$`/`"$` warn regardless of quotes, and suggest `"${dir:?}"/*` or `set -u`. Replace the quote advice with `"$dir"/*` when the glob is outside the variable.

**F3. A here-document body is executed as commands by the analyser.** `cat <<EOF\nrm -rf /\nEOF` -> "Can delete data", two rm warnings, and `EOF` listed as an unknown command (true verdict: prints text). Too alarming, and the reverse of F1. Fix: after `<<WORD` (or `<<-`, `<<'WORD'`), swallow lines up to the terminator in the tokenizer and show them as one "heredoc text" token.

**F4. Marks contradict the page's own definitions.** The legend says "Can delete data = permanently remove or overwrite data". The data marks exactly 1 of 42 commands (`rm`) and 3 flags (`-r`, `-f`, `-delete`) as such. Yet data/commands.json notes say `cp` "overwrites an existing destination without asking", `mv` "replaces an existing destination silently", `tee` "overwrites the file", `tar -x` "overwrites existing files", `sed -i` edits in place; all are marked "Changes things". `xargs` has the note "it is as dangerous as that command" but the explainer shows `ls | xargs rm -rf` and `find . -print0 | xargs -0 rm -f` as "Changes things" (no warning). `chmod -R 777 /` and `chmod 777 -R /` -> "Changes things", 0 warnings. Fix: either narrow the legend ("Can delete data = removes files or directories") and add a fourth mark "Can overwrite", or mark cp/mv/tee/ln -f/sed -i/tar -x as `destroys` in their overwrite form; make `xargs <cmd>` inherit `<cmd>`'s impact; warn on `chmod`/`chown` with `-R` on `/`, `~`, `*`, `.` as rm does.

**F5. Search finds names and summaries only, so the obvious words fail.** "delete" returns only `tr`; `rm` ("Remove files...") is not found. "recursive", "permissions", "download", "zip", "-r" return 0 although `-r`/`-R` and 120 flags are on the page and in `data-text`. Zero results show only "Showing 0 of 42 commands." with no hint. Fix: build `data-text` from summary + flag names + flag text + a small synonym list (delete/remove/erase, zip/compress, permissions/mode, download/fetch/url); on 0 results show "No command matches. Try: copy, count, search, delete."

### MINOR

**F6. Comments and nested quotes.** `ls # don't` throws "A single quote is never closed" (valid Bash; the page then says "Cannot read that"). `ls # rm -rf /` explains `rm` and `-r` as arguments of `ls`. `echo "$(echo "x y")"` is split into 2 arguments (`"$(echo "x` and `y")"`). Fix: stop tokenising at an unquoted `#` at a word start; make the double-quote scanner skip over `$( ... )`.

**F7. Redirection order is not explained.** `ls 2>&1 >/dev/null` and `ls >/dev/null 2>&1` produce identical output (token `2>&` with the `1` dropped, "send error messages to wherever normal output goes"). They behave differently in Bash (first sends errors to the terminal). Fix: render the target (`2>&1`), and note which stream goes where at that point in the line.

**F8. Syntax errors get a verdict.** `ls ||| wc`, `ls && && wc`, `| ls`, `ls |` all return "Only reads" with no warning (Bash refuses all four, or waits for more input). Fix: report "Incomplete or invalid: a connector with nothing on one side" when `flush` runs on an empty `cur` after an operator.

**F9. "149 examples" vs 151 printed examples.** index meta description says 149; basics 28 + scripting 25 + advanced 18 = 71 lesson blocks and 80 command-card blocks = 151 terminals on the pages (no-JS count 151). 149 is the number of distinct code strings (`ls -a` and `type -t cd ls if` appear twice). Fix: say "151 examples" or "149 distinct examples".

**F10. Unbounded input.** `#cmd` has no `maxlength`; a 300,000-char token makes a 1.2 MB result and a horizontally scrolling page (only extreme tokens; 120-char tokens wrap fine at 360). Fix: `maxlength="4000"` and `overflow-wrap:anywhere` on `.result code`.

**F11. Contrast outside text pairs.** Dark placeholder 3.58:1 (needs 4.5). Input and chip borders 1.80-2.21:1 against their backgrounds (needs 3:1 for a control's only visible boundary). Fix: placeholder `color:var(--ink3)` (5.95 dark, 5.97 light); `--line2` to about #6b808b dark and #6f877a light (about 3.3:1).

**F12. Reproducibility record is thin.** outputs.json stores only the Bash version; the footer also claims "GNU coreutils, mawk" but no version is recorded, and the examples ran as uid 0 (`id -u` = 0), where a "Permission denied" example cannot occur (0 in outputs.json). `--check` proves only that this host agrees with itself (it passed twice here; my independent 12/12 and 7/7 reruns used the same fixture.py and so test determinism, not portability). Fix: record `awk --version | head -1`, `ls --version | head -1`, `uname -m` and uid in outputs.json and have `--check` print them.

**F13. 7 external links are unverified** (all failed from this sandbox: curl 000/403). The footer says so honestly; no page request leaves the site (0 external requests, 28 page loads).

## Verdict

PASS on build, determinism, counts, layout, no-JS and navigation. OBJECT on the explainer (F1 is a false-safe on a tool whose job is the worst case) and on F2-F5.
