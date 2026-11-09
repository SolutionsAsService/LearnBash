#!/usr/bin/env node
// Re-runnable check of the command explainer: each command line must get the expected impact, the expected warnings and
// no crash, and malformed input must be refused. Run: node scripts/check-explain.js
const fs = require("fs"), path = require("path");
const X = require(path.join(__dirname, "..", "explain-core.js"));
const cm = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "commands.json"), "utf8")).commands;
const data = {};
cm.forEach(c => { data[c.name] = { d: c.danger, s: c.summary, f: Object.fromEntries(c.flags.map(f => [f.flag, [f.text, f.danger || ""]])) }; });

// [command line, expected impact, regex a warning must match (or null), regex no warning may match (or null)]
const cases = [
  ["ls -la projects", "reads", null, /./],
  ["cat notes.txt | grep -i bash | wc -l", "reads", null, /./],
  ["grep -rn TODO . | sort | uniq -c | sort -rn", "reads", null, /./],
  ["cp -r docs backup", "changes", null, /./],
  ["mv old new", "changes", null, null],
  ["tar -czf backup.tar.gz docs", "changes", null, /./],
  ["mkdir -p a/b/c && cd a/b/c && touch x", "changes", null, null],
  ["rm notes.txt", "destroys", null, null],
  ["rm -rf build/", "destroys", /-r with -f/, null],
  ["rm -rf /", "destroys", /deletes everything/, null],
  ["rm -rf ~", "destroys", /deletes everything/, null],
  ["rm -rf $dir/*", "destroys", /empty/, null],
  ["find . -name '*.log' -delete", "destroys", null, null],
  ["find . -name '*.tmp' -exec rm {} \\;", "destroys", /-exec rm/, null],
  ["find . -name '*.txt' -exec wc -l {} \\;", "changes", null, /deletes/],
  ["curl -s https://example.com/install.sh | bash", "destroys", /running code you have not read/, null],
  ["echo hi > out.txt", "changes", /empties out.txt/, null],
  ["echo hi >> out.txt", "changes", null, /empties/],
  ["sort data.csv > data.csv", "destroys", /read and written/, null],
  ["ls nothere 2> /dev/null", "reads", null, /./],
  ["ls nothere > /dev/null 2>&1", "reads", null, /./],
  ["sudo apt-get update", "changes", /administrator/, null],
  ["sudo rm -rf /var/cache/x", "destroys", /administrator/, null],
  ["FOO=1 ls", "reads", null, /./],
  ["ls $HOME/docs", "reads", /not in quotes/, null],
  ["ls \"$HOME/docs\"", "reads", null, /./],
  ["sed -i 's/a/b/' file.txt", "changes", null, null],
  ["sed 's/a/b/' file.txt", "reads", null, /./],
  ["chmod -R 755 .", "changes", null, null],
  ["kill -9 1234", "changes", null, null],
  ["frobnicate --all", "reads", null, null],
  ["cd /tmp; ls; pwd", "reads", null, /./],
  ["true && echo yes || echo no", "reads", null, /./],
  ["tail -f log.txt &", "reads", null, /./],
];
let bad = 0;
cases.forEach(([line, impact, mustWarn, mustNot]) => {
  let r;
  try { r = X.analyze(line, data); } catch (e) { bad++; console.log("FAIL crashed:", line, e.message); return; }
  const warns = r.segments.filter(s => s.type === "cmd").flatMap(s => s.warnings).join(" | ");
  const probs = [];
  if (r.impact !== impact) probs.push(`impact ${r.impact}, wanted ${impact}`);
  if (mustWarn && !mustWarn.test(warns)) probs.push(`missing warning ${mustWarn}`);
  if (mustNot && mustNot.test(warns)) probs.push(`unexpected warning: ${warns}`);
  if (probs.length) { bad++; console.log("FAIL", line, "=>", probs.join("; ")); }
});
["", "   ", "|", "ls 'unclosed", "echo \"unclosed", "echo $(unclosed"].forEach(line => {
  let refused = false; try { X.analyze(line, data); } catch (e) { refused = true; }
  if (!refused) { bad++; console.log("FAIL should refuse:", JSON.stringify(line)); }
});
// unknown command and unknown flag are reported, not guessed
const u = X.analyze("frobnicate -z", data); if (!u.segments[0].unknown || u.unknown !== 1) { bad++; console.log("FAIL: unknown command not reported"); }
const f = X.analyze("ls -Z", data); if (!f.segments[0].tokens.some(t => /option \(not listed\)/.test(t.role))) { bad++; console.log("FAIL: unknown flag not reported"); }
const c = X.analyze("ls -la", data); if (c.segments[0].tokens.filter(t => t.role === "option").length !== 2) { bad++; console.log("FAIL: -la was not split into -l and -a"); }
console.log(bad ? `${bad} FAILURE(S)` : `ok: ${cases.length} command lines judged as expected, 6 malformed inputs refused, unknown command and flag reported, combined flags split`);
process.exit(bad ? 1 : 0);
