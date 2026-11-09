#!/usr/bin/env python3
"""Generate the Learn Bash site from data/*.json and the recorded example outputs. Standard library only.

    python3 scripts/run_examples.py    (first) run every example for real and record data/outputs.json
    python3 scripts/build.py           write every page
    python3 scripts/build.py --check   exit 1 if a generated file is stale

The build refuses to run if any example has no recorded output, so nothing on a page is typed by hand: every output
shown was printed by Bash, and every count (commands, lines in the pipeline) is read from the data.
"""
import hashlib
import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
e = lambda s: html.escape(str(s), quote=True)
CM = json.loads((ROOT / "data" / "commands.json").read_text(encoding="utf-8"))
LS = json.loads((ROOT / "data" / "lessons.json").read_text(encoding="utf-8"))
PL = json.loads((ROOT / "data" / "pipeline.json").read_text(encoding="utf-8"))
OUTS = json.loads((ROOT / "data" / "outputs.json").read_text(encoding="utf-8"))
commands, groups = CM["commands"], {g["id"]: g for g in CM["groups"]}
pages = {p["id"]: p for p in LS["pages"]}
BASH = OUTS["bash"].replace("GNU bash, version ", "Bash ").split("(")[0]
REPO = "https://github.com/SolutionsAsService/LearnBash"
_site = ROOT / "data" / "site.json"
SITE_URL = (json.loads(_site.read_text(encoding="utf-8")).get("url", "").rstrip("/") if _site.exists() else "")

MARKS = {
    "reads": ("Only reads", "Does not change your files or the system. It can still change the current shell session (cd, export and alias do)."),
    "changes": ("Changes things", "Creates or modifies files or system state, without removing what was there."),
    "destroys": ("Can delete data", "Can remove or overwrite existing data in ordinary use, and there is no undo."),
    "unknown": ("Can't tell", "Part of the line could not be analysed, so it is not called safe."),
}
NAV = [("basics.html", "Basics"), ("commands.html", "Commands"), ("scripting.html", "Scripts"), ("advanced.html", "Advanced"), ("explain.html", "Explain")]
ORDER = ["basics", "commands", "scripting", "advanced", "explain"]
TITLES = {"basics": "Bash basics", "commands": "The command reference", "scripting": "Scripting", "advanced": "Advanced topics", "explain": "Explain a command"}
FOOTNAV = NAV + [("resources.html", "Resources")]


def key(code):
    return hashlib.sha1(code.encode("utf-8")).hexdigest()[:16]


def result(code):
    r = OUTS["examples"].get(key(code))
    if r is None:
        raise SystemExit(f"no recorded output for this example (run scripts/run_examples.py first):\n{code}")
    return r


for c in commands:  # every example must have a recorded output
    for x in c["examples"]:
        result(x)
for p in LS["pages"]:
    for s in p["sections"]:
        for b in s["blocks"]:
            if b["run"]:
                result(b["code"])
N_EX = len(OUTS["examples"])
N_CMD = len(commands)
N_FLAGS = sum(1 for c in commands for f in c["flags"] if f["flag"].startswith("-"))
N_PRINTED = sum(len(c["examples"]) for c in commands) + sum(1 for p in LS["pages"] for s in p["sections"] for b in s["blocks"] if b["run"])


def mark(level):
    return f'<span class="mk mk-{level}"><i aria-hidden="true"></i>{e(MARKS[level][0])}</span>'


def head(title, desc, page, og_image=None):
    nav = "".join(f'<a href="{h}"' + (' aria-current="page"' if h == page else "") + f">{t}</a>" for h, t in NAV)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark light">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:type" content="website">{(f'<meta property="og:image" content="{(SITE_URL + "/" if SITE_URL else "") + og_image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{(SITE_URL + "/" if SITE_URL else "") + og_image}">' if og_image else "")}{(f'<meta property="og:url" content="{SITE_URL}/{page}"><link rel="canonical" href="{SITE_URL}/{page}">' if SITE_URL else "")}
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="styles.css">
</head>
<body class="{'home' if page == 'index.html' else ''}">
<a class="skip" href="#main">Skip to the content</a>
<header class="mast">
  <a class="brand" href="index.html"><span class="ps" aria-hidden="true">$</span> learn-bash</a>
  <nav aria-label="Pages">{nav}</nav>
</header>
<main id="main">
'''


def foot(*scripts):
    s = "".join(f'<script src="{x}"></script>' for x in scripts)
    return f'''</main>
<footer class="foot">
  <nav class="footnav" aria-label="Pages"><a href="index.html">Home</a>{"".join(f'<a href="{h}">{t}</a>' for h, t in FOOTNAV)}</nav>
  <p><strong>Every output here is real.</strong> Each example was run in a sandbox with {e(BASH)} on Linux (GNU coreutils, mawk) when this site was built. macOS and BSD tools differ in some flags; the pages say where it matters. External links were not checked from the build environment.</p>
  <p class="small">Code and text are MIT-licensed. Nothing on this site loads from another domain, and the explainer never runs what you paste.</p>
</footer>
{s}
</body>
</html>
'''


def term(code, run=True, note=None, status_ok=True):
    lines = code.split("\n")
    shown = "".join(
        (f'<span class="ln"><span class="ps" aria-hidden="true">{"$" if i == 0 else " "}</span> {e(l)}</span>') for i, l in enumerate(lines))
    out = ""
    if run:
        r = result(code)
        body = e(r["out"]) if r["out"] else '<span class="muted">(no output)</span>'
        st = f'<span class="st">exit status {r["status"]}</span>' if r["status"] else ""
        out = f'<pre class="out" aria-label="Output"><code>{body}</code></pre>{("<p class=\"stl\">" + st + "</p>") if st else ""}'
    else:
        out = '<p class="notrun">Not run here.</p>'
    nt = f'<p class="bnote">{e(note)}</p>' if note else ""
    return f'<figure class="term"><pre class="cmd"><code>{shown}</code></pre>{out}{nt}</figure>'


def funnel():
    """The pipeline drawn as one pipe at an exact scale (3.6 px per line). Each segment runs from the number of lines that
    came into the command to the number it let out, so the pipe narrows at the commands that throw lines away."""
    stages, counts = PL["stages"], OUTS["pipeline"]["counts"]
    PX = 3.6
    items = []
    for i, st in enumerate(stages):
        into = counts[i - 1] if i > 0 else counts[0]
        items.append(f'<li class="fs" style="--a:{round(into * PX, 1)};--b:{round(counts[i] * PX, 1)}"><span class="fn">{counts[i]}<small>line{"" if counts[i] == 1 else "s"}</small></span>'
                     f'<span class="fp" aria-hidden="true"></span><code class="fc">{e(st)}</code></li>')
    return f'<ol class="funnel" aria-label="The pipeline, stage by stage; the number is how many lines come out of each command">{"".join(items)}</ol>'


def index():
    cards = [("basics.html", "Basics", f"{sum(1 for s in pages['basics']['sections'] for b in s['blocks'] if b['run'])} examples, all run", pages["basics"]["summary"]),
             ("commands.html", "Commands", f"{N_CMD} commands, {N_FLAGS} flags", "A reference where every command says whether it only reads, changes things, or can delete data."),
             ("scripting.html", "Scripting", f"{sum(1 for s in pages['scripting']['sections'] for b in s['blocks'] if b['run'])} examples, all run", pages["scripting"]["summary"]),
             ("advanced.html", "Advanced topics", f"{sum(1 for s in pages['advanced']['sections'] for b in s['blocks'] if b['run'])} examples, all run", pages["advanced"]["summary"]),
             ("explain.html", "Explain a command", "paste one, get a breakdown", "Break a command line into its parts and see what each does, and whether it is safe. It never runs anything."),
             ("resources.html", "Resources", "a short, honest list", "The manual, ShellCheck and a few guides worth your time.")]
    ch = "".join(f'<li class="card"><p class="tag">{e(t)}</p><h3><a href="{h}">{e(n)}</a></h3><p>{e(d)}</p></li>' for h, n, t, d in cards)
    lg = "".join(f'<li>{mark(k)}<span>{e(v[1])}</span></li>' for k, v in MARKS.items() if k != "unknown")
    n_stage = len(PL["stages"]); total = OUTS["pipeline"]["counts"][0]
    q = PL["question"]
    return head("Learn Bash: every output is real", f"Learn the Bash shell with {N_PRINTED} examples that were actually run, a command reference marked by what each command can do to your files, and a tool that explains a command line.", "index.html", "social.png") + f'''
<section class="hero hero-dark" aria-labelledby="h1">
  <div class="herohead">
    <div class="ht"><p class="kicker">Learn the Bash shell, from your first command to real scripts</p>
    <h1 id="h1"><span class="ps" aria-hidden="true">$ </span>learn bash<span class="blk" aria-hidden="true"></span></h1></div>
    <div class="hc"><p class="lede">Every example on this site was run for real, and the output you see is what Bash printed.</p>
    <p class="cta"><a class="btn" href="basics.html">Start with the basics</a><a class="btn ghost" href="explain.html">Explain a command</a></p></div>
  </div>
  <figure class="win">
    <div class="winbar" aria-hidden="true"><i></i><i></i><i></i><span>~/demo: bash</span></div>
    <p class="winq"><span class="ps" aria-hidden="true">$</span> {e(q)} <span class="muted">Seven small commands, one after another.</span></p>
    <p class="key"><span aria-hidden="true">&#9654;</span> The pipe is as thick as the number of lines left after each command.</p>
    {funnel()}
    <pre class="out final" aria-label="Final output of the pipeline"><code>{e(OUTS["pipeline"]["final"])}</code></pre>
    <p class="wincap">The pipe narrows where a command throws lines away: {" to ".join(str(c) for c in dict.fromkeys(OUTS["pipeline"]["counts"]))} lines, measured by running every prefix of the pipeline on a sample log of {total} lines. <a class="btn ghost small-btn" href="scripting.html#example">See it explained, step by step</a></p>
  </figure>
</section>

<section aria-labelledby="h-where">
  <h2 id="h-where" class="sech">Where to go</h2>
  <ul class="cards">{ch}</ul>
</section>

<section class="band" aria-labelledby="h-safe">
  <h2 id="h-safe" class="sech">Know what a command can do before you run it</h2>
  <p class="lede2">Every command in the reference carries a mark for what it can do in ordinary use, and a flag that is riskier than its command says so. A command marked "Only reads" will not change your files in its everyday form; check the marks on its flags too. One that changes things deserves a second look, and one that can delete data deserves a pause.</p>
  <ul class="legend">{lg}</ul>
  <p><a class="more" href="commands.html">Open the command reference</a></p>
</section>
''' + foot()


def next_link(pid):
    i = ORDER.index(pid)
    prev = (ORDER[i - 1], TITLES[ORDER[i - 1]]) if i > 0 else None
    nxt = (ORDER[i + 1], TITLES[ORDER[i + 1]]) if i + 1 < len(ORDER) else None
    pl = f'<a class="prev" href="{prev[0]}.html"><span>Previous</span>{e(prev[1])}</a>' if prev else "<span></span>"
    nl = f'<a class="next" href="{nxt[0]}.html"><span>Next</span>{e(nxt[1])}</a>' if nxt else "<span></span>"
    return f'<nav class="stepnav" aria-label="Previous and next">{pl}{nl}</nav>'


def lesson_page(pid, kicker):
    p = pages[pid]
    toc = "".join(f'<li><a href="#{s["id"]}">{e(s["title"])}</a></li>' for s in p["sections"])
    secs = []
    for s in p["sections"]:
        body = "".join(f"<p>{e(t)}</p>" for t in s["body"])
        blocks = "".join(term(b["code"], b["run"], b.get("note")) for b in s["blocks"])
        secs.append(f'<section class="lesson" id="{s["id"]}" aria-labelledby="h-{s["id"]}"><h2 id="h-{s["id"]}" class="sech">{e(s["title"])}</h2><div class="prose">{body}</div>{blocks}</section>')
    nruns = sum(1 for s in p["sections"] for b in s["blocks"] if b["run"])
    return head(f'{p["title"]}: Learn Bash', p["summary"], f"{pid}.html") + f'''
<section class="page-head"><p class="kicker">{e(kicker)}</p><h1>{e(p["title"])}</h1>
<p class="lede">{e(p["summary"])}</p>
<p class="small">{nruns} examples, all run with {e(BASH)}. Paths are shown as /home/you/demo.</p>
<details class="toc"><summary>On this page ({len(p["sections"])} sections)</summary><ul>{toc}</ul></details></section>
{"".join(secs)}
{next_link(pid)}
''' + foot()


def commands_page():
    chips = '<button type="button" class="chip on" data-group="">All</button>' + "".join(
        f'<button type="button" class="chip" data-group="{g["id"]}">{e(g["name"])}</button>' for g in CM["groups"])
    arts = []
    for c in commands:
        fl = "".join(
            f'<li><code class="fl">{e(f["flag"])}</code><span>{e(f["text"])}</span>{mark(f["danger"]) if f.get("danger") else ""}</li>' for f in c["flags"])
        flags = f'<h4 class="h4">Flags</h4><ul class="flags">{fl}</ul>' if fl else ""
        ex = "".join(term(x) for x in c["examples"])
        exs = f'<h4 class="h4">Examples, run for real</h4>{ex}' if ex else ""
        note = f'<p class="cnote">{e(c["note"])}</p>' if c.get("note") else ""
        arts.append(
            f'<article class="cmd-card" id="cmd-{e(c["name"])}" data-group="{c["group"]}" data-name="{e(c["name"])}" data-text="{e((c["summary"] + " " + c.get("keywords", "")).lower())}">'
            f'<header><h3><code>{e(c["name"])}</code></h3>{mark(c["danger"])}</header>'
            f'<p class="sum">{e(c["summary"])}</p><p class="syn"><code>{e(c["synopsis"])}</code></p>{note}{flags}{exs}</article>')
    legend = "".join(f'<li>{mark(k)}<span>{e(v[1])}</span></li>' for k, v in MARKS.items() if k != "unknown")
    index_links = "".join(f'<li><a href="#cmd-{e(c["name"])}"><code>{e(c["name"])}</code></a></li>' for c in commands)
    return head("Bash command reference: Learn Bash", f"{N_CMD} Bash commands with {N_FLAGS} flags, each marked as only reading, changing things or able to delete data, with examples that were actually run.", "commands.html") + f'''
<section class="page-head"><p class="kicker">Reference</p><h1>{N_CMD} commands, and what each can do</h1>
<p class="lede">Each command carries a mark for what it can do in ordinary use; a flag that is riskier than its command says so. Search by what you want to do: copy, delete, search, download.</p>
<ul class="legend">{legend}</ul>
<p class="small">GNU (Linux) flags are shown; where macOS/BSD differs, the entry says so.</p></section>
<section aria-labelledby="h-find">
  <h2 id="h-find" class="sr">Find a command</h2>
  <details class="toc cmdindex"><summary>Jump to a command ({N_CMD})</summary><ul>{index_links}</ul></details>
  <div class="tools" id="cmd-tools" hidden>
    <label class="f"><span class="label">Search commands</span><input id="q" type="search" placeholder="for example copy, count, search" autocomplete="off"></label>
    <div class="chips" id="group-chips" role="group" aria-label="Filter by kind of task">{chips}</div>
  </div>
  <p class="count" id="count" role="status" aria-live="polite"></p>
  <div class="cmds">{"".join(arts)}</div>
</section>
{next_link("commands")}
''' + foot("commands.js")


def explain_page():
    data = {c["name"]: {"d": c["danger"], "s": c["summary"], "f": {f["flag"]: [f["text"], f.get("danger", "")] for f in c["flags"]}} for c in commands}
    ex = ["ls -la projects", "grep -rn TODO . | sort | uniq -c | sort -rn", "tar -czf backup.tar.gz docs", "find . -name '*.log' -delete", "rm -rf $dir/*", "curl -s https://example.com/install.sh | bash", "sort data.csv > data.csv"]
    exb = "".join(f'<button type="button" class="chip ex" data-cmd="{e(x)}">{e(x)}</button>' for x in ex)
    legend = "".join(f'<li>{mark(k)}<span>{e(v[1])}</span></li>' for k, v in MARKS.items())
    return head("Explain a Bash command: Learn Bash", "Paste a Bash command line and see it broken into parts, with what each flag does and whether it is safe. It never runs your command.", "explain.html") + f'''
<section class="page-head"><p class="kicker">Tool</p><h1>Explain a command</h1>
<p class="lede">Paste a command line to see its parts, what each flag does, and the worst it can do. It only reads the text: <strong>nothing is run</strong>, and nothing leaves your browser.</p></section>
<section aria-labelledby="h-form">
  <h2 id="h-form" class="sr">Explainer</h2>
  <form id="explain-form" class="eform js-only" autocomplete="off" hidden>
    <label class="f" for="cmd"><span class="label">Command line</span></label>
    <div class="row"><input id="cmd" name="cmd" type="text" maxlength="2000" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="rm -rf build/ && ls -la" required><button class="btn" type="submit">Explain</button></div>
  </form>
  <div id="result" class="result" role="status" aria-live="polite"></div>
  <div class="js-only" hidden id="examples"><p class="small">Try one:</p><div class="chips">{exb}</div></div>
  <noscript><p class="note">This tool needs JavaScript, which runs it entirely in your browser. The <a href="commands.html">command reference</a> covers every command it knows.</p></noscript>
  <script type="application/json" id="cmd-data">{json.dumps(data, separators=(",", ":"), ensure_ascii=False)}</script>
</section>
<section class="two" aria-labelledby="h-limits">
  <div><h2 id="h-limits" class="sech">What it knows, and what it does not</h2>
  <ul class="plain"><li>It knows the {N_CMD} commands and {N_FLAGS} flags in the command reference. Anything else is shown as unknown.</li>
  <li>It splits at pipes and operators (<code>|</code> <code>&amp;&amp;</code> <code>||</code> <code>;</code>), reads quotes, and notices redirections such as <code>&gt;</code>, which empties its target file before the command even starts.</li>
  <li>It looks inside <code>$( )</code>, <code>sh -c</code>, <code>env</code>, <code>xargs</code>, <code>find -exec</code> and loops, and rates what it finds there. It skips here-document text and comments.</li>
  <li>When part of a line cannot be analysed (an unknown command, <code>eval</code>, a function, a script file), the verdict is <strong>Can't tell</strong>, never a reassuring one.</li>
  <li>It is a reading aid, not a safety scanner. A line it rates "Only reads" can still be wrong for your situation, and nothing replaces reading a command before you run it.</li></ul>
  <p><a class="more" href="commands.html">Open the command reference</a></p></div>
  <div><h2 class="sech">The marks</h2><ul class="legend">{legend}</ul></div>
</section>
{next_link("explain")}
''' + foot("explain-core.js", "explain.js")


def resources_page():
    items = [
        ("The GNU Bash Reference Manual", "https://www.gnu.org/software/bash/manual/bash.html", "The authoritative description of every feature. Dense; search it rather than read it through."),
        ("ShellCheck", "https://www.shellcheck.net/", "Paste a script and it points out quoting mistakes, portability problems and common bugs, each with an explanation."),
        ("Greg's Wiki: BashGuide and BashPitfalls", "https://mywiki.wooledge.org/BashGuide", "A careful, opinionated guide, and a list of the mistakes almost everyone makes once."),
        ("tldr pages", "https://tldr.sh/", "Short, practical examples for thousands of commands. The fastest way to remember a flag."),
        ("explainshell", "https://explainshell.com/", "Paste a command and it matches each part to the manual page text. A larger cousin of the explainer on this site."),
        ("Advanced Bash-Scripting Guide", "https://tldp.org/LDP/abs/html/", "A huge collection of examples. Parts are dated and some habits it shows are discouraged today; read it with ShellCheck open."),
        ("man bash, help and info", None, "Already on your computer: man bash for the manual, help NAME for built-ins, NAME --help for most programs."),
    ]
    li = "".join(
        f'<li class="res"><h3>{(f"<a href=\"{u}\" rel=\"noopener\">{e(t)}</a>") if u else e(t)}</h3><p>{e(d)}</p></li>' for t, u, d in items)
    return head("Resources: Learn Bash", "A short list of the best places to keep learning Bash: the manual, ShellCheck, Greg's Wiki, tldr and explainshell.", "resources.html") + f'''
<section class="page-head"><p class="kicker">Resources</p><h1>Where to learn more</h1>
<p class="lede">A short list, not a long one. Links were not checked from the build environment; if one is dead, <a href="{REPO}/issues/new">tell us</a>.</p></section>
<section aria-labelledby="h-r"><h2 id="h-r" class="sr">The list</h2><ul class="reslist">{li}</ul>
<p class="small">The previous version of this site linked to wiki.bash-hackers.org. It is not listed here because it could not be checked, and Greg's Wiki above covers much of the same ground.</p></section>
''' + foot()


FAV = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0f1316"/><path d="M7 9l7 7-7 7" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 23h9" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/></svg>'

OUT = {"index.html": index(), "basics.html": lesson_page("basics", "Start here"), "scripting.html": lesson_page("scripting", "Scripts"),
       "advanced.html": lesson_page("advanced", "Going further"), "commands.html": commands_page(), "explain.html": explain_page(),
       "resources.html": resources_page(), "favicon.svg": FAV}


def main():
    check = "--check" in sys.argv
    stale = []
    for name, text in OUT.items():
        p = ROOT / name
        if not p.exists() or p.read_text(encoding="utf-8") != text:
            stale.append(name)
            if not check:
                p.write_text(text, encoding="utf-8")
    if check and stale:
        print("stale:", ", ".join(stale))
        sys.exit(1)
    print("ok" if check else f"written {len(OUT)} files; {N_CMD} commands, {N_FLAGS} flags, {N_EX} recorded examples")


main()
