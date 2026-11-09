#!/usr/bin/env python3
"""Run every example on the site for real and record what Bash printed. Standard library plus bash and GNU tools.

    python3 scripts/run_examples.py          run everything, write data/outputs.json
    python3 scripts/run_examples.py --check  exit 1 if any recorded output differs from a fresh run

Each example runs in its own temporary directory holding the sample files from scripts/fixture.py, with a minimal
environment (LC_ALL=C, TZ=UTC, no profile or rc files), a 10 s limit, and standard input closed. The sandbox path is
replaced by /home/you/demo in the recorded output, and the same replacement is made in the code before it runs, so
absolute paths in the lessons work. Nothing here can reach outside the temporary directory except by an absolute path.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import fixture  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DEMO = "/home/you/demo"
MAXOUT = 3000


def key(code):
    return hashlib.sha1(code.encode("utf-8")).hexdigest()[:16]


def run(code):
    tmp = tempfile.mkdtemp(prefix="learnbash-")
    try:
        sandbox = os.path.join(tmp, "demo")
        os.makedirs(sandbox)
        fixture.make(sandbox)
        env = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "LC_ALL": "C", "TZ": "UTC", "HOME": sandbox, "PS4": "+ "}
        real = code.replace(DEMO, sandbox)
        try:
            p = subprocess.run(["bash", "--noprofile", "--norc", "-c", real], cwd=sandbox, env=env, stdin=subprocess.DEVNULL,
                               stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=10)
            out, status = p.stdout.decode("utf-8", "replace"), p.returncode
        except subprocess.TimeoutExpired:
            out, status = "(timed out)", 124
        out = out.replace(sandbox, DEMO).replace(tmp, "/tmp/x")
        if len(out) > MAXOUT:
            out = out[:MAXOUT] + "\n(output cut)"
        return {"out": out.rstrip("\n"), "status": status}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def collect():
    codes = []
    for c in json.loads((ROOT / "data" / "commands.json").read_text(encoding="utf-8"))["commands"]:
        codes += c["examples"]
    for pg in json.loads((ROOT / "data" / "lessons.json").read_text(encoding="utf-8"))["pages"]:
        for s in pg["sections"]:
            codes += [b["code"] for b in s["blocks"] if b["run"]]
    return codes


def pipeline():
    pl = json.loads((ROOT / "data" / "pipeline.json").read_text(encoding="utf-8"))
    counts, outs = [], []
    for i in range(len(pl["stages"])):
        cmd = " | ".join(pl["stages"][: i + 1])
        counts.append(int(run(cmd + " | wc -l")["out"].strip()))
        outs.append(run(cmd)["out"].split("\n")[0])
    return {"counts": counts, "first_line": outs, "final": run(" | ".join(pl["stages"]))["out"]}


def build():
    ver = subprocess.run(["bash", "--version"], stdout=subprocess.PIPE).stdout.decode().split("\n")[0]
    ex = {}
    for code in collect():
        ex[key(code)] = run(code)
    return {"bash": ver, "examples": ex, "pipeline": pipeline()}


def main():
    new = build()
    path = ROOT / "data" / "outputs.json"
    if "--check" in sys.argv:
        old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        bad = [k for k in new["examples"] if old.get("examples", {}).get(k) != new["examples"][k]]
        if bad or old.get("pipeline") != new["pipeline"]:
            print(f"stale: {len(bad)} example(s) differ from a fresh run" + ("; pipeline differs" if old.get("pipeline") != new["pipeline"] else ""))
            sys.exit(1)
        print(f"ok: {len(new['examples'])} examples and the pipeline match a fresh run ({new['bash']})")
        return
    path.write_text(json.dumps(new, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"recorded {len(new['examples'])} examples with {new['bash']}")


main()
