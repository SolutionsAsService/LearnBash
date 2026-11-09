# Critic: Provocateur (Debord) - CLAIMS CHECK, round 1

Anchor used: Debord, The Society of the Spectacle, thesis 1 and 10 (the image that replaces the lived relation). The three marks are an image of rigour. The question for each is whether the thing can back it.

## Verdict: OBJECT

The site's prose and recorded outputs are mostly honest. I re-ran `run_examples.py --check` and `build.py --check`: all 149 recorded outputs and the pipeline reproduce, and the counts 71 / 42 / 80 / 40-line log all hold. The spectacle is concentrated in the three marks. The explainer prints a green "Only reads - Nothing in this changes your files or the system" over `sh -c "rm -rf ~"`, `eval`, `date -s`, `sort -o f f` and `dd`. The reference defines "Can delete data" as "remove or overwrite data" and then files cp, mv, tee, sed -i and tar -x, which its own notes say overwrite silently, under "Changes things". The homepage promises that a command that only reads "is safe to try anywhere", and 28 of the 42 commands wear that mark, including `find`, `curl`, `awk`, `xargs`-adjacent tools and shell-state builtins. A few lesson sentences are stated more firmly than Bash behaves: the trap EXIT "however it ends" claim, the `[ ]` with `==` advice, and the "same results as basename/dirname" note. One recorded status, 127, is an artefact of `bash -c` and teaches the wrong thing. The footer claim "Every output here is real" is true. It is also true that the reader on a stock Mac (zsh) will not get several of them, and the site never says so.

## Findings

### 1. BLOCKER - The explainer's verdict "Only reads" is false for shells, eval and unknown-flag writers
- Site says (explain.js SAYS.reads / explain-core.js): "Only reads. Nothing in this changes your files or the system. Nothing was run." The page also says "It is a reading aid, not a safety scanner", but only lower down.
- Verified by running explain-core.js under node against the shipped data. These all return impact `reads` with `unknown=0` (so even the "reference does not know" caveat is absent): `bash -c "rm -rf ~"`, `sh -c "rm -rf ~"`, `eval rm`, `date -s 2020-01-01`, `curl -d @f https://x`, `sort -o f f`, `sed -n "w f" g`, `awk 'BEGIN{system("rm x")}'`, `uniq in out` (the OUTPUT operand is overwritten). `dd if=/dev/zero of=/dev/sda`, `shred -u`, `truncate -s0`, `git clean -fdx`, `rsync --delete` and `mkfs` also return `reads`, with only a footnote that one part is unknown. `bash`/`sh`/`zsh`/`dash` are special-cased as "a shell: it runs the text it is given" and still score `reads`. Only `... | sh` is raised to `destroys`.
- Confidence: high. Verified by running.
- Fix: (a) any unknown command, or any of `bash sh zsh dash eval exec source . xargs sudo`, sets the overall verdict to a fourth state, "Not rated", styled neutral, text: "This reference cannot say what this does. It is not 'only reads'." Never fall back to `reads`. (b) For `bash/sh -c STRING`, `eval`, `awk` with `system(` or `>`, `sed` with a `w` or `e` command, `sort -o`: at least `changes`. (c) Replace SAYS.reads with: "Nothing in this line that the reference knows about changes files." Move "a reading aid, not a safety scanner" to directly under the verdict.

### 2. MAJOR - "Can delete data" is defined as "remove or overwrite", then not applied to overwriters
- Site says: MARKS.destroys = "Can permanently remove or overwrite data. There is no undo." Notes: cp "overwrites an existing destination without asking"; mv "replaces an existing destination silently"; tee "Without -a it overwrites the file"; tar "-x overwrites existing files of the same name"; sed -i "overwriting it". All five are marked `changes` (cp, mv, tee, tar commands; sed command is `reads` with -i flag `changes`). Only rm (1 of 42 commands) and 3 flags carry `destroys`. The explainer test file also asserts `sed -i` and `tar -czf` are `changes`.
- Verified: `tee` twice leaves only the second content (ran it). `cp -n` warning verified separately (item 12).
- Confidence: high that the mark contradicts its own definition. A policy choice remains about how to repair it.
- Fix, either: (A) give cp, mv, tee, sed -i, tar -x, `>` (explainer) and curl -o/-O the mark `destroys`; or (B) change the legend wording to "Can delete data: Removes files or directories permanently." and add a fourth line to the legend, "Changes things: ... may replace a file of the same name without asking." Choose (A) if the aim is the "worst it can do" rule stated in the commands lede. Under (A) the explainer test cases for `sed -i`, `tar` and `echo hi > out.txt` change. A plain `>` into an existing file is currently `changes`; it should be `destroys`, since the page itself says it "empties" the file.

### 3. MAJOR - Homepage promise: "A command that only reads is safe to try anywhere"
- Site says (index.html, band "Know what a command can do before you run it"). Reference lede on commands.html: "Each command carries a mark for the worst it can do in its everyday form; a flag that is more dangerous than the command says so."
- Wrong or unproven: the first sentence is stated without the "everyday form" qualifier and is false for `find` (mark `reads`; `-delete` is `destroys` and `-exec rm` is not flagged `destroys`), `curl` (mark `reads`; `-X DELETE` and `-d` change a remote system and are unflagged), `awk`, `sed`, `sort -o`, `date -s`, `history` (`!!` re-runs the last command, which may be `rm`), `less` (shell escape with `!`), and `cat`/`tail -f` on a huge or binary file. 28 of 42 commands are marked `reads`.
- Confidence: high on the logic; verified for the explainer by running.
- Fix: replace with: "A command marked 'Only reads' does not change files when used the plain way shown in its examples. Check its flags: some commands marked 'Only reads', such as find, curl and awk, can do more when you add the flags listed on their card."

### 4. MAJOR - The `reads` mark on shell-state builtins (cd, export, alias) and on curl
- Site says: legend "Does not change files or the system. (It may change the current shell session.)". cd, export and alias are all `reads`. The note on cd is "it changes where the shell is, not any file"; export's note is "A builtin".
- Wrong or unproven: the parenthetical is honest, but it makes the mark's definition depend on a footnote, and the entry is tagged `reads` while its whole purpose is to change state (cd changes PWD/OLDPWD, export changes what every later program inherits, alias redefines commands, so `alias ls='rm -rf'` is a one-liner). The one place a reader is told this is in the legend. The words `Only reads` appear on the card. For curl the parenthesis does not cover the problem at all: it concerns a remote system.
- Confidence: medium (judgment of the mark, high on the facts). Not run, no facts to run.
- Fix: add a fourth mark, "Changes the shell only", for cd, export, alias, history (and `unset`/`source` in the explainer). Legend text: "Changes this shell session (directory, variables, aliases) and nothing on disk." For curl: `changes` with the card note "Marked for what it can do to the other end: -X, -d and -T change data on the server."

### 5. MAJOR - `find` and `xargs`, `sudo`, `-exec`: the mark understates a wrapper
- Site says: find `reads`, `-exec` flag `changes`, `-delete` flag `destroys`. xargs `changes`, with the note "It runs whatever command you give it, so it is as dangerous as that command." sudo `changes`, note "Everything the command does, it does with full rights." kill `changes` and `kill -9` flag `changes` (the flag mark equals the command mark, so it adds nothing).
- Wrong or unproven: a wrapper cannot be rated by its own name. `find . -exec rm {} +` is rated `destroys` by the explainer only through a hard-coded `rm` special case (`-exec mv`, `-exec sh -c`, `xargs rm -rf` return `changes`, verified: `xargs rm -rf` -> `changes`). The notes say "as dangerous as that command" while the mark says otherwise.
- Confidence: high; verified by running.
- Fix: find `-exec`: `destroys`, with text "Run a command on each match. Treat it as dangerous as that command: -exec rm and -exec mv can destroy data." xargs and sudo: mark `destroys` or the new "Depends on the command" mark. kill -9: `destroys` with text "SIGKILL: the process cannot catch it, so it cannot save or clean up; unsaved work in it is lost."

### 6. MAJOR - Recorded "exit status 127" under the set -u example teaches the wrong number
- Site says (scripting.html, example `bash -c 'set -u; dir=""; echo "would run: rm -rf $dirr/"'`): output `bash: line 1: dirr: unbound variable` then "exit status 127". No explanation anywhere.
- Wrong or unproven: 127 is the conventional "command not found" status, and the lesson on exit status says only "anything else is failure". Verified: the same fault in a script file (`bash u.sh`) exits with status 1, not 127; 127 is a quirk of the `bash -c` form. The page shows a real number that a reader will not get when they follow the lesson.
- Confidence: high. Verified by running both forms.
- Fix: run the example as a script file (`printf 'set -u\n...' > t.sh; bash t.sh`) so the recorded status is 1, or add a `note`: "(Status 127 here is how `bash -c` reports it; a script file exits with 1.)"

### 7. MAJOR - trap EXIT: "fires whenever the script ends, however it ends"
- Site says (advanced.html, "Cleaning up with trap"): "The EXIT pseudo-signal fires whenever the script ends, however it ends, which makes it the right place to delete temporary files."
- Wrong: verified `kill -KILL` on a process with `trap "echo bye" EXIT` prints nothing (status 137); `exec sleep` after setting the trap prints nothing. It does fire on exit, error exit and SIGTERM/SIGINT/SIGHUP (SIGTERM verified, status 143).
- Confidence: high; verified by running.
- Fix: "The EXIT pseudo-signal fires when the script finishes, fails, or is ended by Ctrl-C or a plain `kill`. It cannot fire if the script is killed with `kill -9` or the machine loses power, so a temporary file can still be left behind."

### 8. MAJOR - Quoting/globbing lessons are demonstrated for Bash only; the default Mac shell is zsh and the site never says so
- Site says: "Bash is the most common one on Linux and the default on many other systems." Later, macOS "ships Bash 3.2". The Wildcards lesson: "If nothing matches, Bash passes the pattern through unchanged". The Quoting lesson shows `printf '[%s]\n' $name` splitting into two words.
- Wrong or unproven: "default on many other systems" is unsupported (macOS has used zsh as the interactive default since 2019). In zsh an unmatched glob is an error ("no matches found") and an unquoted `$name` is not split, so two lessons do not reproduce on a Mac Terminal. I could not run zsh here (not installed): this is from memory of documented zsh defaults. Confidence: medium-high.
- Fix: replace the sentence with: "Bash is the usual shell on Linux. macOS ships an old Bash 3.2 but its Terminal starts zsh by default; type `bash` to get a Bash prompt before following the examples, since zsh differs on some of the first lessons (unmatched globs, word splitting)."

### 9. MAJOR - `[ ]` advice: "strings with == and !="
- Site says (scripting.html, "Making decisions"): "[[ ... ]] in Bash ... or [ ... ] in any POSIX shell. Compare numbers with -eq, -lt, -gt and strings with == and !=."
- Wrong: `==` is not POSIX inside `[ ]`. Verified: dash (/bin/sh on Debian/Ubuntu, which the portability section itself names) answers `[ a == a ]` with `[: a: unexpected operator`. POSIX uses `=`.
- Confidence: high; verified by running dash.
- Fix: "... and strings with = and != (inside [[ ]] you can also write ==; a bare [ ] in a POSIX shell only knows =)."

### 10. MAJOR - Parameter-expansion note: "The same results as basename and dirname, without starting a program" / "quicker and safer"
- Site says: note on `${path##*/}` and `${path%/*}`; prose "These are quicker and safer than calling sed or basename for simple edits."
- Wrong: verified the results differ. For `/a/b/` `basename` gives `b` but `${p##*/}` gives an empty string; `dirname` gives `/a` but `${p%/*}` gives `/a/b`. For a bare name `file`, `dirname` gives `.` but `${p%/*}` gives `file`. "Safer" is unsupported.
- Confidence: high; verified by running.
- Fix: note: "The same results as basename and dirname for a plain path like this one. They differ for a trailing slash or a name with no slash, so use the real commands when the path might look like that." Delete "and safer".

### 11. MINOR - `find . -maxdepth 1 -type d` example is unsorted, contradicting the card's own note
- Site says: find note "It lists matches in whatever order the file system gives them, so the examples sort the result." The `-maxdepth 1 -type d` example has no `| sort` and shows `. ./projects ./scripts ./docs`.
- Verified: `find d -maxdepth 1 -type d` on this sandbox gave `d/x d/z d/y` order for a tree created in x,y,z order. The recorded output reproduces only on a matching file system, so `run_examples.py --check` can fail elsewhere. The claim "every output is real" is intact; the claim "examples sort the result" is false for this one.
- Confidence: high; verified.
- Fix: change the example to `find . -maxdepth 1 -type d | sort` and re-record (output `.` `./docs` `./projects` `./scripts`).

### 12. MINOR - Counts: "120 flags"
- Site says: "42 commands, 120 flags" (index card, commands title/description, README, explainer "knows the 42 commands and 120 flags").
- Verified: 120 flag entries, of which 103 start with a dash. The other 17 are keystrokes and non-flag items (`q`, `/word`, `space`, `Ctrl-R`, `!!`, `aux`, `$1, $2, ...`, `NR`, `NF`, `~`, `..`, `-` for cd, `644`, `755`, `u+x`, `+%F`, `+%T`). The lesson count "71 runnable examples" is exact (28 + 25 + 18). The index meta says "149 examples", which is distinct example texts (80 in the reference + 71 in lessons = 151, two are duplicates).
- Confidence: high; computed from the data.
- Fix: "42 commands, 120 options" in the generated copy (change `flags` to `options` where N_FLAGS is printed), or 103 if only dashed flags are counted. Index meta: "149 distinct examples".

### 13. MINOR - set -e exceptions stated loosely
- Site says: "set -e ignores failures inside if conditions and && lists, and it can surprise you."
- Verified: `true && false` as the last item of an && list DOES exit (status 1); `false && true` does not. Inside a function called as `f || echo handled`, the failing `false` does not stop the function (verified: it printed `inside-f`). `((n=0))` exits under set -e (status 1).
- Confidence: high; verified.
- Fix: "set -e is switched off for a command whose failure is being tested: an if or while condition, any command of an && or || list except the last, and everything inside a function called that way. Others surprise too: `((n=0))` returns 1 and ends the script."

### 14. MINOR - touch -d and date -d macOS claims
- Site says: touch `-d` "(GNU; BSD uses -t)". Portability lesson: "date -d does not exist" on macOS.
- Unproven or wrong from memory: BSD/macOS touch has `-d` too, with a stricter format (`YYYY-MM-DDThh:mm:SS`) than GNU's free-form dates; the site's fixture (`touch -d "2025-01-02 10:00"`) would fail there. macOS `date -d` exists but means "set DST", so it errors rather than "does not exist". Not runnable here. Confidence: medium (touch), medium-low (date).
- Fix: touch: "-d: Use the given date instead of now. GNU takes free-form text such as '2 days ago'; BSD/macOS wants YYYY-MM-DDThh:mm:SS. -t [[CC]YY]MMDDhhmm[.SS] works on both." date lesson: "date -d means something else on macOS (it will not parse a date); use `date -j -f FORMAT` there."

### 15. MINOR - Smaller wording points
- `cut -c` "Which characters to keep": GNU cut -c currently counts bytes (verified: `printf 'é€x' | cut -c1-2` returned 3 bytes of one 2-byte character plus a partial). Say "Which character positions (bytes in GNU cut) to keep."
- `find -mtime` "Modified N days ago; +N means more than N": counts whole 24-hour periods, so `-mtime +1` needs at least 48 hours (verified: a file 36 h old matches `-mtime 1`, not `+1`). Say "N counts whole days (24 h) old; +1 means two or more days old."
- `curl -s` "Silent: no progress meter": also hides error messages unless `-S` is added.
- `sed -i`: suggest `-i.bak`, which keeps a backup and works on GNU and BSD (verified GNU creates f.bak). The card gives the BSD-only form `-i ''`.
- `xargs`: example `ls *.txt | xargs wc -l` is the pattern the same card warns about with `-0`; verified that a file named `a b.txt` produces two "No such file" errors. Use `find . -name '*.txt' -print0 | xargs -0 wc -l`.
- `rm -rf` "the command that empties disks": hyperbole. GNU rm refuses `rm -rf /` by default (preserve-root, from memory); the real danger is `rm -rf $dir/*`. The set -u note "would read rm -rf /" is true as text but understates the glob form.
- Here-document example prints "Home is a variable here too." with no variable in the text, implying an expansion that did not happen. Make it `Home is $HOME` and re-record (`Home is /home/you/demo`).
- "unlike the older backticks it nests": backticks do nest with escaping (verified). Say "nests without escaping".
- Background-jobs: "is stopped when the terminal closes" reads like job-control "Stopped". Say "is ended (it receives SIGHUP)".
- "the current directory is not on PATH": say "usually not on PATH".
- Exported variables: "export marks a variable so programs started from this shell inherit it; those programs are what other tools call the environment" is garbled. The exported variables are the environment. Say: "...inherit it. The set of exported variables is what other tools call the environment."
- `.` in globbing: "* matches any run of characters" omits that it skips a leading dot and never matches `/`.
- Footer says sandbox "Linux (GNU coreutils, mawk)"; it does not say the run used `LC_ALL=C` and English error messages. `ls: cannot access 'nothere': ...` and `cp -v 'a' -> 'b'` read differently on macOS (`ls: nothere: No such file or directory`). "the pages say where it matters" is not true for error wording and `-v` output.
- CONTRIBUTING.md says "This is a static site: no build step" and tells contributors to edit and serve; README says the pages are generated by `scripts/build.py` and `build.py --check` fails on a hand-edited page. A contributor following CONTRIBUTING would have their HTML overwritten.

### 16. MINOR - Resources page
- Site says: "The old community wiki at wiki.bash-hackers.org, which the previous version of this site linked to, has moved; Greg's Wiki above covers much of the same ground."
- From memory, not verifiable (no web): the original domain stopped serving the wiki around 2023-2024 and the content lives on in community mirrors/forks; "has moved" is roughly right but does not say where, and a reader could look for a redirect that does not exist. Greg's Wiki covering "much of the same ground" is fair. Confidence: medium-low.
- Fix: "The old community wiki at wiki.bash-hackers.org, which the previous version of this site linked to, is no longer served from that address; community copies exist (search for 'bash-hackers wiki'), but Greg's Wiki above covers much of the same ground and is actively maintained." If a mirror URL is wanted, check it first.
- The other descriptions are fair: GNU manual ("authoritative", "dense"), ShellCheck, Greg's Wiki ("opinionated"), tldr ("fastest way to remember a flag" is a mild superlative, acceptable), explainshell ("larger cousin" is fair), ABS guide ("dated", "discouraged habits" is fair and honest). The page discloses that links were not checked.

## Claims about the site itself

- "Every output here is real": TRUE for the 149 recorded outputs. Verified by `run_examples.py --check` (ok) and `build.py --check` (ok); the builder refuses to run when an example has no recorded output. Qualifications: stderr and stdout are merged into one stream (the page does not say so), the sandbox path is rewritten to `/home/you/demo`, dates are fixed, locale is C, and outputs for 10 commands are "Not run here" (alias, chown, curl, df, du, history, less, man, ps, sudo). Add to the footer: "Commands that cannot be run safely in a page (curl, sudo, df and a few more) show no output."
- "Nothing leaves your browser" / "never runs what you paste": TRUE as far as the source shows. No `fetch`, `XMLHttpRequest`, `sendBeacon`, `eval`, `new Function` or `localStorage` anywhere in explain*.js or commands.js. The tokenizer and analyzer are pure functions on a string.
- "Nothing on this site loads from another domain": TRUE. The only external URLs in the HTML are seven navigation links (resources, issue tracker); no scripts, stylesheets, fonts or images load from outside; `styles.css` has no `url(`.
- "71 runnable examples": TRUE (28 basics + 25 scripting + 18 advanced). "42 commands, 120 flags": 42 true; 120 true only counting non-flag items (item 12). "34 command lines judged" in the README matches `check-explain.js`, which printed `ok: 34`.
- "macOS and BSD tools differ in some flags; the pages say where it matters": PARTLY. Flag differences are noted for sed -i, date -d, touch -d (wrongly, item 14), ps, ls -S, echo -e. Output wording, `wc` padding, `kill -l` format and zsh as the Mac default are not.

## Checked and found correct (coverage)

- commands.json flag meanings: cat -n; cd -, ~, ..; chmod u+x, 644, 755, -R; chown -R; cp -r/-R, -i, -p, -v; cp -n and its "recent GNU versions warn ... suggest --update=none" (verified with coreutils 9.4: prints `cp: warning: behavior of -n is non-portable and may change in future; use --update=none instead`, exit 0, file not overwritten); curl -o, -O, -L, -I, -X, -H, -d; cut -d, -f; date +%F, +%T; df -h; diff -u, -r, and exit status 0/1; du -h, -s; echo -n, -e (and that `sh` prints `-e`, verified); find -name, -type, -size, -maxdepth, -exec ... `\;`, -delete "put it last"; grep -i, -v, -n, -r, -c, -l, -w, -E, -o, -F and exit status 0/1; head/tail -n, tail -f; kill -l and -9 text; less keys; ln -s; ls -l, -a, -h, -t, -r, -R, -1, -S "GNU and BSD"; man -k; mkdir -p, -v; mv -i, -n, -v; ps aux and -ef; pwd -P/-L; rm -r, -f, -i, -v, -d; rmdir -p; sed -n, -e, -E, -i and the BSD `-i ''` caveat; sort -n, -r, -u, -k, -t; tar -c, -x, -t, -z, -v, and `-f` "must come right before the name"; tee -a; touch -c; tr -d, -s; type -a, -t; uniq -c, -d and the "sort first" note; wc -l, -w, -c; xargs -n, -I, -0 with `find -print0`.
- Danger marks I agree with: cat, head, tail, wc, grep, cut, tr, sort (without -o), uniq (one operand), diff, ls, du, df, ps, pwd, type, man, echo as `reads`; mkdir, touch, ln, chmod, chown, rmdir as `changes`; rm as `destroys`; rm -r and -f as `destroys`; find -delete as `destroys`; `curl ... | bash` as a warning; the notes on rm ("no recycle bin"), rmdir ("safe way to delete"), uniq, mkdir, sed ("Without -i it prints the edited text and leaves the file alone").
- Lessons, verified by running or against recorded output: all 71 lesson outputs agree with their explanation and none contradicts its text. Spot checks that agree: globbing pass-through for unmatched patterns, `printf '[%s]'` with and without quotes, exported versus unexported variable in a child shell, `true; echo $?`, `&&`/`||` chains, the `2>&1` order example (error not in the file when reversed), `${var%.txt}`, `##*.`, `/` substitution, `#` length, `${1:-world}`, `${1:?msg}` (status 1 in a script), `set -e` stopping `bash -c`, pipefail turning 0 into 1 (verified), `bash -n` status 2 (verified), brace expansion, integer division, `${word^^}`/`${word,,}` (output SHELL shell), associative arrays, here-doc quoted versus unquoted delimiter, here-string, process substitution, subshell versus group (`(cd projects && pwd)` leaves the directory unchanged), `trap EXIT` with `exit 3`, `sleep &` plus `wait`, `bash -x` output with `+` prefix, `BASH_VERSION` 5.2.21.
- Prose facts that hold: `[[ ]]` is a keyword and `[ ]` is POSIX; ${var^^} needs Bash 4; process substitution is not POSIX (dash fails with `Syntax error: "(" unexpected`, verified; `[[` is `not found` in dash, verified); `<<-` strips leading tabs; macOS ships Bash 3.2; dash is `/bin/sh` on Debian and Ubuntu; `read -r` and `IFS=` advice; `local`; `return` 0-255; `set -u` and `pipefail` descriptions; the pipeline example (40 requests, 16 are 404s, `/old-page` 9, `/missing.png` 5, `/favicon.ico` 2); the stage counts 40/16/16/16/3/3/3 in the home-page strip.
- The `awk` note ("Examples avoid features only GNU awk has"): the sandbox awk is mawk 1.3.4; the examples are plain field/NR programs. I could not run macOS awk.
