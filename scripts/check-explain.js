#!/usr/bin/env node
// Re-runnable check of the command explainer: each command line must get the expected verdict and warnings, malformed
// input must be refused, and nothing may be reported as safe that the explainer could not analyse.
// Run: node scripts/check-explain.js
const fs = require("fs"), path = require("path");
const X = require(path.join(__dirname, "..", "explain-core.js"));
const cm = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "commands.json"), "utf8")).commands;
const data = {};
cm.forEach(c => { data[c.name] = { d: c.danger, s: c.summary, f: Object.fromEntries(c.flags.map(f => [f.flag, [f.text, f.danger || ""]])) }; });

const R = "reads", C = "changes", D = "destroys", U = "unknown";
// [command line, expected verdict, regex a warning must match (or null), regex no warning may match (or null)]
const cases = [
  // plainly safe
  ["ls -la projects", R, null, /./], ["cat notes.txt | grep -i bash | wc -l", R, null, /./], ["grep -rn TODO . | sort | uniq -c | sort -rn", R, null, /./],
  ["cd /tmp; ls; pwd", R, null, /./], ["true && echo yes || echo no", R, null, /./], ["tail -f log.txt &", R, null, /./], ["FOO=1 ls", R, null, /./],
  ["ls nothere 2> /dev/null", R, null, /./], ["ls nothere > /dev/null 2>&1", R, null, /./], ["sed 's/a/b/' file.txt", R, null, /./], ["ls \"$HOME/docs\"", R, null, /./],
  ["(cd projects && pwd)", R, null, /./], ["ls # don't", R, null, /./], ["cat <<EOF\nrm -rf /\nEOF", R, null, /./], ["ls $(pwd)", R, null, null],
  // changes
  ["mkdir -p a/b/c && cd a/b/c && touch x", C, null, null], ["echo hi >> out.txt", C, null, /empties/], ["chmod -R 755 .", C, null, null], ["kill -9 1234", C, null, null],
  ["sudo apt-get update", U, null, null], ["date -s '2020-01-01'", C, null, null], ["sudo -u bob ls", C, /administrator/, null], ["find . -name '*.txt' -exec wc -l {} \\;", C, null, /deletes/],
  ["tar -czf backup.tar.gz docs", C, null, /./], ["cp -r docs backup", D, null, null],
  // can delete data
  ["rm notes.txt", D, null, null], ["rm -rf build/", D, /-r with -f/, null], ["rm -rf /", D, /deletes everything/, null], ["rm -rf ~", D, /deletes everything/, null],
  ["rm -rf $dir/*", D, /empty|not in quotes/, null], ["rm -rf \"$dir\"/*", D, /empty/, null], ["rm -rf -- *", D, /deletes everything/, null],
  ["find . -name '*.log' -delete", D, null, null], ["find . -name '*.tmp' -exec rm {} \\;", D, /-exec/, null], ["find / -name x -delete", D, null, null],
  ["mv a b", D, null, null], ["cp a b", D, null, null], ["tee out.txt", D, null, null], ["sed -i 's/a/b/' file.txt", D, null, null], ["tar -xzf x.tgz", D, null, null], ["curl -o f.html https://example.com", D, null, null],
  ["sort data.csv > data.csv", D, /read and written/, null], ["echo hi > out.txt", D, /empties out.txt/, null], ["sort -o f f", D, null, null],
  ["dd if=/dev/zero of=/dev/sda", D, /device/, null], ["shred -u secrets.txt", D, null, null], ["mkfs -t ext4 /dev/sda1", D, null, null], ["sudo dd of=/dev/sda", D, null, null],
  ["echo hi > /dev/sda", D, /disk device/, null], ["chmod -R 777 /", D, /root|system/, null], ["git clean -fdx", D, /not tracked/, null], ["git reset --hard", D, /uncommitted/, null],
  [":(){ :|:& };:", D, /fork bomb/, null],
  // nested: a shell, a wrapper, a loop, a substitution hides the real command
  ["sh -c \"rm -rf ~\"", D, /sh -c/, null], ["bash -c 'rm -rf /'", D, null, null], ["env rm -rf /", D, null, null], ["ls | xargs rm -rf", D, null, null],
  ["for f in *; do rm -rf $f; done", D, null, null], ["if true; then rm -rf /; fi", D, null, null], ["echo $(rm -rf /)", D, null, null], ["echo `rm -rf /`", D, null, null],
  ["curl -s https://example.com/install.sh | bash", D, /running code you have not read/, null], ["curl -s https://x | sh", D, null, null], ["awk 'BEGIN{system(\"rm -rf /\")}'", C, /system/, null],
  ["nohup rm -rf / &", D, null, null], ["timeout 5 rm -rf /", D, null, null],
  // cannot be rated: never reported as reading
  ["xyzzy", U, null, null], ["ls | xyzzy", U, null, null], ["frobnicate --all", U, null, null], ["git status", U, null, null], ["git push --force origin main", U, /forced push/, null],
  ["eval \"$cmd\"", U, null, null], ["bash script.sh", U, null, null], ["source ./env.sh", U, null, null], ["f() { rm -rf /; }; f", U, null, null],
];
let bad = 0;
cases.forEach(([line, verdict, mustWarn, mustNot]) => {
  let r;
  try { r = X.analyze(line, data); } catch (e) { bad++; console.log("FAIL crashed:", JSON.stringify(line), e.message); return; }
  const all = (s) => s.warnings.concat(s.unknown ? [s.summary] : []);
  const warns = r.segments.filter(s => s.type === "cmd").flatMap(all).join(" | ");
  const probs = [];
  if (r.verdict !== verdict) probs.push(`verdict ${r.verdict}, wanted ${verdict}`);
  if (mustWarn && !mustWarn.test(warns)) probs.push(`missing warning ${mustWarn}`);
  if (mustNot && mustNot.test(r.segments.filter(s => s.type === "cmd").flatMap(s => s.warnings).join(" | "))) probs.push(`unexpected warning`);
  if (probs.length) { bad++; console.log("FAIL", JSON.stringify(line), "=>", probs.join("; ")); }
});
// malformed input is refused with a reason
["", "   ", "|", "ls 'unclosed", "echo \"unclosed", "echo $(unclosed", "ls ||| wc", "&& ls", "ls &&", "ls ||", "x".repeat(2001)].forEach(line => {
  let refused = false; try { X.analyze(line, data); } catch (e) { refused = true; }
  if (!refused) { bad++; console.log("FAIL should refuse:", JSON.stringify(line.slice(0, 40))); }
});
// no hang on a long token, no crash on odd input
const t0 = Date.now(); try { X.analyze("echo " + "a".repeat(1900), data); } catch (e) { /* fine */ } if (Date.now() - t0 > 500) { bad++; console.log("FAIL: slow on a long token"); }
["ls (", "ls )", "echo $((1+2))", "ls <(cat x)", "cat x |& grep y", "ls 2>&1 | wc -l", "ls >", "a=1", "! ls"].forEach(line => { try { X.analyze(line, data); } catch (e) { if (!/is never closed|nothing|connector|command to explain/i.test(e.message)) { bad++; console.log("FAIL odd input threw a strange error:", JSON.stringify(line), e.message); } } });
// unknown command and unknown flag are reported, not guessed; combined flags split
const u = X.analyze("frobnicate -z", data); if (!u.segments[0].unknown || u.unknown !== 1 || u.verdict !== U) { bad++; console.log("FAIL: unknown command not reported"); }
const f = X.analyze("ls -Z", data); if (!f.segments[0].tokens.some(t => /option \(not listed\)/.test(t.role))) { bad++; console.log("FAIL: unknown flag not reported"); }
const c = X.analyze("ls -la", data); if (c.segments[0].tokens.filter(t => t.role === "option").length !== 2) { bad++; console.log("FAIL: -la was not split into -l and -a"); }
// a verdict of "reads" must never come with an unanalysed part
cases.filter(x => x[1] === R).forEach(([line]) => { const r = X.analyze(line, data); if (r.verdict === R && r.unknown) { bad++; console.log("FAIL: reads with unanalysed part:", line); } });
console.log(bad ? `${bad} FAILURE(S)` : `ok: ${cases.length} command lines judged as expected, 11 malformed inputs refused, odd input handled, unknown command and flag reported, combined flags split`);
process.exit(bad ? 1 : 0);
