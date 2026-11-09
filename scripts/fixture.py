"""The sample files every example runs against. Built fresh in a temporary directory for each example, so no
example can touch anything outside it and every output shown on the site is reproducible.

Dates are fixed (touch -d) so listings sort the same way every time.
"""
import os
import subprocess

LOG_LINES = [
    ("203.0.113.5", "GET", "/index.html", 200, 1043), ("198.51.100.7", "GET", "/about.html", 200, 512),
    ("203.0.113.5", "GET", "/missing.png", 404, 150), ("192.0.2.44", "GET", "/index.html", 200, 1043),
    ("198.51.100.7", "GET", "/old-page", 404, 150), ("203.0.113.9", "POST", "/login", 302, 0),
    ("192.0.2.44", "GET", "/about.html", 200, 512), ("203.0.113.5", "GET", "/old-page", 404, 150),
    ("198.51.100.7", "GET", "/index.html", 200, 1043), ("203.0.113.9", "GET", "/missing.png", 404, 150),
    ("192.0.2.44", "GET", "/old-page", 404, 150), ("203.0.113.5", "GET", "/contact.html", 200, 733),
    ("198.51.100.7", "GET", "/old-page", 404, 150), ("203.0.113.9", "GET", "/index.html", 200, 1043),
    ("192.0.2.44", "GET", "/favicon.ico", 404, 150), ("203.0.113.5", "GET", "/about.html", 200, 512),
    ("198.51.100.7", "GET", "/contact.html", 200, 733), ("203.0.113.9", "GET", "/old-page", 404, 150),
    ("192.0.2.44", "GET", "/index.html", 200, 1043), ("203.0.113.5", "GET", "/missing.png", 404, 150),
    ("198.51.100.7", "GET", "/about.html", 200, 512), ("203.0.113.9", "POST", "/login", 302, 0),
    ("192.0.2.44", "GET", "/old-page", 404, 150), ("203.0.113.5", "GET", "/index.html", 200, 1043),
    ("198.51.100.7", "GET", "/favicon.ico", 404, 150), ("203.0.113.9", "GET", "/about.html", 200, 512),
    ("192.0.2.44", "GET", "/missing.png", 404, 150), ("203.0.113.5", "GET", "/old-page", 404, 150),
    ("198.51.100.7", "GET", "/index.html", 200, 1043), ("203.0.113.9", "GET", "/contact.html", 200, 733),
    ("192.0.2.44", "GET", "/about.html", 200, 512), ("203.0.113.5", "GET", "/index.html", 200, 1043),
    ("198.51.100.7", "GET", "/old-page", 404, 150), ("203.0.113.9", "GET", "/missing.png", 404, 150),
    ("192.0.2.44", "GET", "/index.html", 200, 1043), ("203.0.113.5", "GET", "/contact.html", 200, 733),
    ("198.51.100.7", "GET", "/about.html", 200, 512), ("203.0.113.9", "GET", "/old-page", 404, 150),
    ("192.0.2.44", "POST", "/login", 302, 0), ("203.0.113.5", "GET", "/index.html", 200, 1043),
]


def access_log():
    out = []
    for i, (ip, method, path, status, size) in enumerate(LOG_LINES):
        out.append(f'{ip} - - [10/Nov/2025:10:{i // 6:02d}:{(i * 7) % 60:02d} +0000] "{method} {path} HTTP/1.1" {status} {size}')
    return "\n".join(out) + "\n"


FILES = {
    "notes.txt": "bash is a shell\nbash is also a scripting language\nls lists files\ncd changes directory\nBash was first released in 1989\n",
    "fruits.txt": "apple\nbanana\ncherry\napple\nbanana\napple\n",
    "numbers.txt": "10\n9\n100\n1\n",
    "data.csv": "name,team,score\nana,red,12\nben,blue,7\ncho,red,9\ndee,blue,15\n",
    "access.log": access_log(),
    "projects/web/index.html": "<h1>Home</h1>\n",
    "projects/web/style.css": "body { margin: 0; }\n",
    "projects/api/server.py": "print('serving')\n",
    "projects/api/notes.txt": "TODO: add tests\n",
    "docs/readme.md": "# Docs\nSee notes.txt\n",
    "scripts/hello.sh": '#!/usr/bin/env bash\necho "Hello, ${1:-world}!"\n',
    ".hidden": "secret\n",
}
DIRDATES = {"docs": "2025-01-08 10:00", "projects": "2025-01-07 10:00", "scripts": "2025-01-06 10:00"}
DATES = {"notes.txt": "2025-01-05 10:00", "fruits.txt": "2025-01-04 10:00", "numbers.txt": "2025-01-03 10:00", "data.csv": "2025-01-02 10:00",
         "access.log": "2025-01-01 10:00", ".hidden": "2025-01-01 09:00"}


def make(root):
    os.umask(0o022)
    for rel, text in FILES.items():
        p = os.path.join(root, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(text)
        os.chmod(p, 0o644)
    base = "2025-01-01 08:00"
    for dirpath, dirnames, filenames in os.walk(root):
        for n in filenames:
            rel = os.path.relpath(os.path.join(dirpath, n), root)
            subprocess.run(["touch", "-d", DATES.get(rel, base), os.path.join(dirpath, n)], check=True)
    for rel, d in DIRDATES.items():
        subprocess.run(["touch", "-d", d, os.path.join(root, rel)], check=True)
    subprocess.run(["touch", "-d", base, root], check=True)
