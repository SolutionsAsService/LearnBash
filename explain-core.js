// Reads a Bash command line and explains it. It never runs anything: it tokenises the text, splits it at pipes and
// operators, and looks each command and flag up in the reference data embedded in the page.
(function (root) {
  "use strict";

  var ORDER = { reads: 0, changes: 1, destroys: 2 };
  var worse = function (a, b) { return ORDER[b] > ORDER[a] ? b : a; };
  var BUILTINS = ["if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done", "case", "esac", "function", "[", "[[", "test", "read", "set", "local", "return", "exit", "source", ".", "eval", "exec", "trap", "shift", "true", "false", "unset", "declare", "printf", "wait", "break", "continue", "let", "readonly", "umask"];
  var CONNECTORS = {
    "|": "pipe: the output of the left command becomes the input of the right one",
    "|&": "pipe, including error messages",
    "&&": "run the next command only if the previous one succeeded",
    "||": "run the next command only if the previous one failed",
    ";": "then run the next command, whatever happened",
    "&": "run the previous command in the background, then continue"
  };
  var REDIR = {
    ">": "send output to the file, replacing its contents (the file is emptied before the command starts)",
    ">>": "append output to the file",
    "<": "read input from the file",
    "<<": "read input from the lines that follow (a here-document)",
    "<<<": "read input from this string (a here-string)",
    ">&": "send this stream to another one",
    "<&": "read from another stream",
    "&>": "send output and error messages to the file, replacing its contents",
    "&>>": "append output and error messages to the file"
  };

  function tokenize(s) {
    var toks = [], i = 0, n = s.length;
    while (i < n) {
      var ch = s[i];
      if (ch === "\n") { toks.push({ t: "op", v: ";" }); i++; continue; }
      if (/\s/.test(ch)) { i++; continue; }
      var rest = s.slice(i), m;
      if ((m = rest.match(/^(\d*)(>>|>&|<<<|<<|<&|>|<)/))) { toks.push({ t: "redir", v: m[2], fd: m[1] }); i += m[0].length; continue; }
      if ((m = rest.match(/^&>>?/))) { toks.push({ t: "redir", v: m[0], fd: "" }); i += m[0].length; continue; }
      if ((m = rest.match(/^(\|&|\|\||&&|\||;|&)/))) { toks.push({ t: "op", v: m[1] }); i += m[1].length; continue; }
      var raw = "", val = "", quoted = false, unqvar = false, subst = false, glob = false;
      while (i < n) {
        var c = s[i];
        if (/\s/.test(c) || /[|&;<>]/.test(c)) break;
        if (c === "\\") { raw += c + (s[i + 1] || ""); val += s[i + 1] || ""; quoted = true; i += 2; continue; }
        if (c === "'") {
          var j = s.indexOf("'", i + 1);
          if (j < 0) throw new Error("A single quote is never closed.");
          raw += s.slice(i, j + 1); val += s.slice(i + 1, j); quoted = true; i = j + 1; continue;
        }
        if (c === '"') {
          var k = i + 1, inner = "";
          while (k < n && s[k] !== '"') { if (s[k] === "\\") { inner += s[k] + (s[k + 1] || ""); k += 2; } else { inner += s[k]; k++; } }
          if (k >= n) throw new Error("A double quote is never closed.");
          raw += s.slice(i, k + 1); val += inner; quoted = true; if (/\$\(|`/.test(inner)) subst = true; i = k + 1; continue;
        }
        if (c === "$" && s[i + 1] === "(") {
          var depth = 0, p = i + 1;
          for (; p < n; p++) { if (s[p] === "(") depth++; else if (s[p] === ")") { depth--; if (depth === 0) break; } }
          if (p >= n) throw new Error("A $( ... ) is never closed.");
          raw += s.slice(i, p + 1); val += s.slice(i, p + 1); subst = true; unqvar = true; i = p + 1; continue;
        }
        if (c === "`") {
          var q2 = s.indexOf("`", i + 1);
          if (q2 < 0) throw new Error("A backtick is never closed.");
          raw += s.slice(i, q2 + 1); val += s.slice(i, q2 + 1); subst = true; unqvar = true; i = q2 + 1; continue;
        }
        if (c === "$") unqvar = true;
        if (c === "*" || c === "?" || c === "[") glob = true;
        raw += c; val += c; i++;
      }
      toks.push({ t: "word", raw: raw, val: val, quoted: quoted, unqvar: unqvar, subst: subst, glob: glob });
    }
    return toks;
  }

  function lookupFlag(info, tok) {
    // returns a list of {text, explain, danger}
    var f = info.f;
    if (f[tok]) return [{ text: tok, explain: f[tok][0], danger: f[tok][1] }];
    if (/^--/.test(tok)) return [{ text: tok, explain: "A long option. See man for this command; the reference lists the short forms.", danger: "", unknown: true }];
    var m = tok.match(/^-([A-Za-z])(.*)$/);
    if (!m) return [{ text: tok, explain: "A numeric option, or one this reference does not list.", danger: "", unknown: true }];
    var first = "-" + m[1];
    if (!f[first]) return [{ text: tok, explain: "Not in this reference. Check man for this command.", danger: "", unknown: true }];
    var restLetters = m[2];
    if (restLetters === "") return [{ text: first, explain: f[first][0], danger: f[first][1] }];
    var allFlags = /^[A-Za-z]+$/.test(restLetters) && restLetters.split("").every(function (l) { return !!f["-" + l]; });
    if (allFlags) {
      return [{ text: first, explain: f[first][0], danger: f[first][1] }].concat(restLetters.split("").map(function (l) { return { text: "-" + l, explain: f["-" + l][0], danger: f["-" + l][1] }; }));
    }
    return [{ text: first, explain: f[first][0] + " (value attached: " + restLetters + ")", danger: f[first][1] }];
  }

  function analyzeSegment(toks, data, prevOp) {
    var words = [], redirs = [], i;
    for (i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.t === "redir") {
        var tgt = null;
        if (toks[i + 1] && toks[i + 1].t === "word") { tgt = toks[i + 1]; i++; }
        redirs.push({ op: t.v, fd: t.fd, target: tgt });
      } else if (t.t === "word") words.push(t);
    }
    var seg = { type: "cmd", impact: "reads", unknown: false, tokens: [], warnings: [], text: toks.filter(function (x) { return x.t === "word"; }).map(function (x) { return x.raw; }).join(" ") };
    var prefix = [];
    while (words[0] && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0].val)) { seg.tokens.push({ text: words[0].raw, role: "variable for this command only", explain: "Sets this variable for the command that follows, not for the rest of the shell." }); words.shift(); }
    var wrappers = { sudo: "Runs the next command with administrator rights. Everything it does, it does with full permission.", nohup: "Keeps the command running after the terminal closes.", time: "Reports how long the command took." };
    while (words[0] && wrappers[words[0].val]) {
      var wv = words[0].val; seg.tokens.push({ text: wv, role: "prefix", explain: wrappers[wv] }); prefix.push(wv); words.shift();
      if (wv === "sudo") { while (words[0] && /^-/.test(words[0].val)) { var o = words.shift(); seg.tokens.push({ text: o.raw, role: "sudo option", explain: "An option for sudo itself." }); if (o.val === "-u" && words[0]) { seg.tokens.push({ text: words[0].raw, role: "sudo option", explain: "The user to run as." }); words.shift(); } } }
    }
    if (prefix.indexOf("sudo") > -1) { seg.impact = worse(seg.impact, "changes"); seg.warnings.push("sudo: this runs with administrator rights, so read it twice."); }
    if (!words.length) { if (!seg.tokens.length && !redirs.length) { seg.empty = true; } }
    var cmd = words.shift(); var info = null;
    if (cmd) {
      seg.cmd = cmd.val;
      info = data[cmd.val] || null;
      if (info) { seg.summary = info.s; seg.impact = worse(seg.impact, info.d); }
      else if (BUILTINS.indexOf(cmd.val) > -1) { seg.summary = "A shell keyword or builtin that this reference does not cover. See man bash."; }
      else if (["bash", "sh", "zsh", "dash"].indexOf(cmd.val) > -1) { seg.summary = "A shell: it runs the text it is given as commands."; }
      else { seg.unknown = true; seg.summary = "Not in this reference. Try man " + cmd.val + " or " + cmd.val + " --help."; }
      seg.tokens.unshift({ text: cmd.raw, role: "command", explain: "" });
      if (cmd.unqvar && !cmd.quoted) seg.warnings.push("The command name itself comes from an expansion: check what it expands to.");
    }
    var flagsSeen = {}, firstArg = true, hasE = false, inExec = false, execWords = [];
    words.forEach(function (w) {
      if (inExec) {
        if (w.val === ";" || w.val === "+" || (w.raw === "\\;")) { inExec = false; if (execWords[0] === "rm") { seg.impact = worse(seg.impact, "destroys"); seg.warnings.push("-exec rm: this deletes every match."); } return; }
        execWords.push(w.val); seg.tokens.push({ text: w.raw, role: "run on each match", explain: execWords.length === 1 ? "The command that find runs for every match; {} stands for the file." : "Part of the command run for each match." }); return;
      }
      var isFlag = !w.quoted && /^-./.test(w.val) && info;
      if (isFlag) {
        lookupFlag(info, w.val).forEach(function (f) {
          flagsSeen[f.text] = true;
          seg.tokens.push({ text: f.text, role: f.unknown ? "option (not listed)" : "option", explain: f.explain, danger: f.danger || "" });
          if (f.danger) seg.impact = worse(seg.impact, f.danger);
        });
        if (w.val === "-exec") { inExec = true; execWords = []; }
        if (w.val === "-e" || w.val === "-f") hasE = true;
        return;
      }
      var role = "argument", ex = "";
      if (firstArg && info && !hasE) {
        if (cmd.val === "grep") { role = "pattern"; ex = "The text or regular expression to look for."; }
        else if (cmd.val === "sed") { role = "script"; ex = "The editing instructions, such as s/old/new/."; }
        else if (cmd.val === "awk") { role = "program"; ex = "What to do with each line, in awk's own language."; }
        else if (cmd.val === "chmod") { role = "mode"; ex = "The permissions to set."; }
      }
      if (!ex) ex = w.glob && !w.quoted ? "Matched against file names by the shell before the command runs." : (w.subst ? "Replaced by the output of a command before this one runs." : "");
      firstArg = false;
      seg.tokens.push({ text: w.raw, role: role, explain: ex });
      if (w.unqvar && !w.subst) seg.warnings.push(w.raw + " is not in quotes: the shell splits it at spaces and expands wildcards in it. Write it as \"" + w.raw.replace(/^"|"$/g, "") + "\" unless you want that.");
    });
    // rm checks
    if (seg.cmd === "rm") {
      var rec = flagsSeen["-r"] || flagsSeen["-R"], force = flagsSeen["-f"];
      words.forEach(function (w) {
        if (/^(\/|\/\*|~|~\/\*?|\.|\.\.|\*|\.\/\*|\$HOME(\/.*)?)$/.test(w.val) && !/^-/.test(w.val)) seg.warnings.push("rm on " + w.raw + (rec ? " with -r" : "") + " deletes everything it matches, with no undo. Check the path.");
        else if (w.unqvar && !w.subst && /\//.test(w.val) && w.val.charAt(0) === "$") seg.warnings.push("If the variable in " + w.raw + " is empty, this becomes a path from the root. Use set -u, quote it, or check it first.");
      });
      if (rec && force) seg.warnings.push("-r with -f deletes a whole tree without asking.");
    }
    // pipe into a shell
    if (info === null && ["bash", "sh", "zsh", "dash"].indexOf(seg.cmd) > -1 && (prevOp === "|" || prevOp === "|&")) {
      seg.impact = worse(seg.impact, "destroys");
      seg.warnings.push("Piping into a shell runs whatever text arrives as a program. If the text comes from a download, you are running code you have not read.");
    }
    // redirections
    redirs.forEach(function (r) {
      var label = (r.fd || "") + r.op;
      var tgt = r.target ? r.target.raw : "(nothing)";
      var ex = REDIR[r.op] || "redirection";
      if (r.op === ">&" || r.op === "<&") ex = (r.fd === "2" && tgt === "1") ? "send error messages to wherever normal output goes" : ex;
      if (r.fd === "2" && r.op === ">") ex = "send error messages to the file, replacing its contents";
      if (r.fd === "2" && r.op === ">>") ex = "append error messages to the file";
      seg.tokens.push({ text: label + " " + (r.op.indexOf("&") === 1 && tgt === "1" ? "" : tgt), role: "redirection", explain: ex });
      var writes = /^(\d*)(>|>>)$/.test(label) || r.op === "&>" || r.op === "&>>";
      if (writes && r.target && r.target.val !== "/dev/null" && !/^&?\d$/.test(r.target.val)) {
        seg.impact = worse(seg.impact, "changes");
        if (r.op === ">" || r.op === "&>") {
          seg.warnings.push("> empties " + tgt + " before the command even starts. If a file may already exist there, its contents are gone.");
          if (words.some(function (w) { return w.val === r.target.val && !/^-/.test(w.val); })) { seg.impact = worse(seg.impact, "destroys"); seg.warnings.push("The same file (" + tgt + ") is read and written: the shell empties it first, so the command sees nothing and the file ends up empty.", ""); }
        }
      }
    });
    seg.warnings = seg.warnings.filter(Boolean);
    return seg;
  }

  function analyze(text, data) {
    var toks = tokenize(text);
    var out = { segments: [], impact: "reads", unknown: 0 };
    var cur = [], prev = null;
    function flush(nextOp) {
      if (cur.length) { var s = analyzeSegment(cur, data, prev); out.segments.push(s); out.impact = worse(out.impact, s.impact); if (s.unknown) out.unknown++; }
      cur = []; prev = nextOp;
      if (nextOp) out.segments.push({ type: "conn", op: nextOp, explain: CONNECTORS[nextOp] });
    }
    toks.forEach(function (t) { if (t.t === "op") flush(t.v); else cur.push(t); });
    flush(null);
    // a trailing connector with nothing after it
    out.segments = out.segments.filter(function (s, idx, arr) { return !(s.type === "conn" && idx === arr.length - 1 && s.op !== "&" && s.op !== ";"); });
    if (!out.segments.some(function (s) { return s.type === "cmd"; })) throw new Error("There is no command to explain.");
    return out;
  }

  var api = { analyze: analyze, tokenize: tokenize };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Explain = api;
})(typeof window !== "undefined" ? window : this);
