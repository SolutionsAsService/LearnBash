# Learn Bash

A small site for learning the Bash shell, from the first command to scripts. Its distinguishing idea: **every output shown was printed by Bash**. Each example runs in a sandbox with a few sample files when the site is built, and the page shows what came out, so nothing on a page is typed by hand.

- **Basics, Scripting, Advanced:** 71 examples (28, 25 and 18), every one run.
- **Commands:** 45 commands and 109 flags, each marked *Only reads*, *Changes things* or *Can delete data*, with 80 examples that were run. Search by what you want to do ("copy", "delete", "download").
- **Explain a command:** paste a command line and see its parts and the worst it can do. It never runs the command and nothing leaves the browser. It looks inside `$( )`, `sh -c`, `env`, `xargs`, `find -exec` and loops, and when part of a line cannot be analysed it says *Can't tell* instead of calling it safe.

The previous version of this site is kept on the `legacy/pre-redesign` branch.

## How it is built

Everything is data plus three small scripts (Python 3 standard library, and Bash with GNU tools for the examples):

```bash
python3 scripts/run_examples.py     # run every example for real, write data/outputs.json
python3 scripts/build.py            # generate the pages (refuses if any example has no recorded output)
python3 scripts/build.py --check    # exit 1 if a generated page is stale
python3 scripts/run_examples.py --check   # exit 1 if a recorded output differs from a fresh run
node scripts/check-explain.js       # the explainer judges 75 command lines as expected, and refuses malformed ones
```

Data lives in `data/` (`commands.json`, `lessons.json`, `pipeline.json`). The sample files the examples run against are in `scripts/fixture.py`; dates are fixed so listings are reproducible. Outputs were produced with GNU bash 5.2 on Linux (GNU coreutils, mawk). macOS and BSD tools differ in some flags, and the pages say where it matters.

## Contributing

Open an issue with a correction, ideally naming the page and the command. See `CONTRIBUTING.md`. Code and text are MIT-licensed (see `LICENSE`).
