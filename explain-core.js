// Reads a Bash command line and explains it. It never runs anything: it tokenises the text, splits it at pipes and
// operators, looks each command and flag up in the reference data embedded in the page, and looks inside the places
// where a command hides another one (sh -c, $( ), loops, env, xargs, find -exec).
//
// Four possible verdicts: reads, changes, destroys, and "unknown" (can't tell). When any part cannot be analysed the
// verdict is never a reassuring one: it is "unknown", unless something plainly destructive was found, in which case
// that is reported.
(function (root) {
  "use strict";

  var ORDER = { reads: 0, changes: 1, destroys: 2 };
  var worse = function (a, b) { return ORDER[b] > ORDER[a] ? b : a; };
  var MAXLEN = 2000, MAXDEPTH = 4;
  var SHELLS = ["bash", "sh", "zsh", "dash", "ksh"];
  var NEUTRAL = ["done", "fi", "esac", "}", "{", "then", "do", "else", "elif", "!"];
  var HEADERS = ["for", "select", "case"];
  var CONDS = ["if", "while", "until"];
  var TESTS = ["[", "[[", "test", "true", "false", ":", "read", "local", "return", "exit", "shift", "break", "continue", "unset", "declare", "printf", "wait", "let", "readonly", "umask", "set", "trap", "pwd", "cd"];
  var WRAPPERS = { sudo: 1, nohup: 1, time: 1, env: 1, command: 1, builtin: 1, nice: 1, ionice: 1, timeout: 1, exec: 1, xargs: 1 };
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
    "<<-": "read input from the lines that follow, ignoring leading tabs",
    "<<<": "read input from this string (a here-string)",
    ">&": "send this stream to another one",
    "<&": "read from another stream",
    "&>": "send output and error messages to the file, replacing its contents",
    "&>>": "append output and error messages to the file"
  };
  var DANGEROUS_PATH = /^(\/|\/\*|~|~\/\*?|\.|\.\.|\*|\.\/\*|\/etc|\/usr|\/var|\/home|\$HOME(\/.*)?)$/;

  // ---- tokenising -------------------------------------------------------------------------------------------
  function balanced(s, i) { // s[i] is "(" of "$(" ; returns index of the matching ")" or -1
    var depth = 0, sq = false, dq = false;
    for (var p = i; p < s.length; p++) {
      var c = s[p];
      if (sq) { if (c === "'") sq = false; continue; }
      if (c === "\\") { p++; continue; }
      if (c === "'" && !dq) { sq = true; continue; }
      if (c === '"') { dq = !dq; continue; }
      if (dq) continue;
      if (c === "(") depth++;
      else if (c === ")") { depth--; if (depth === 0) return p; }
    }
    return -1;
  }

  function substitutions(raw) { // the command texts inside $( ) and backticks, ignoring single-quoted text
    var out = [], i = 0, n = raw.length, sq = false;
    while (i < n) {
      var c = raw[i];
      if (sq) { if (c === "'") sq = false; i++; continue; }
      if (c === "\\") { i += 2; continue; }
      if (c === "'") { sq = true; i++; continue; }
      if (c === "$" && raw[i + 1] === "(" && raw[i + 2] !== "(") { var e = balanced(raw, i + 1); if (e < 0) throw new Error("A $( ... ) is never closed."); out.push(raw.slice(i + 2, e)); i = e + 1; continue; }
      if (c === "`") { var j = raw.indexOf("`", i + 1); if (j < 0) throw new Error("A backtick is never closed."); out.push(raw.slice(i + 1, j)); i = j + 1; continue; }
      i++;
    }
    return out;
  }

  function tokenize(s) {
    var toks = [], i = 0, n = s.length, pending = null, lastRedir = null;
    var pushOp = function (v, nl) {
      var prev = toks[toks.length - 1];
      if (nl && (!prev || prev.t === "op")) return;
      toks.push({ t: "op", v: v, nl: !!nl });
    };
    while (i < n) {
      var ch = s[i];
      if (ch === "\n") {
        i++;
        if (pending !== null) {
          var lines = s.slice(i).split("\n"), used = 0, found = false;
          for (var li = 0; li < lines.length; li++) { used += lines[li].length + 1; if (lines[li].replace(/^\t+/, "") === pending || lines[li] === pending) { found = true; break; } }
          i += found ? used : s.length - i; pending = null;
        }
        pushOp(";", true); continue;
      }
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === "#") { while (i < n && s[i] !== "\n") i++; continue; }
      var rest = s.slice(i), m;
      if ((m = rest.match(/^(\d*)(>>|>&|<<<|<<-|<<|<&|>|<)/))) {
        toks.push({ t: "redir", v: m[2], fd: m[1] }); lastRedir = m[2]; i += m[0].length;
        if ((m[2] === ">" || m[2] === "<") && s[i] === "(") { // process substitution
          var pe = balanced(s, i); if (pe < 0) throw new Error("A ( ... ) is never closed.");
          toks.pop(); toks.push({ t: "word", raw: s.slice(i - 1, pe + 1), val: s.slice(i - 1, pe + 1), quoted: false, unqvar: false, subst: false, glob: false, procsub: true }); i = pe + 1; lastRedir = null;
        }
        continue;
      }
      if ((m = rest.match(/^&>>?/))) { toks.push({ t: "redir", v: m[0], fd: "" }); i += m[0].length; continue; }
      if ((m = rest.match(/^(\|&|\|\||&&|\||;|&)/))) { pushOp(m[1], false); i += m[1].length; continue; }
      var raw = "", val = "", quoted = false, unqvar = false, glob = false;
      while (i < n) {
        var c = s[i];
        if (/\s/.test(c) || /[|&;<>]/.test(c)) break;
        if (c === "\\") { raw += c + (s[i + 1] || ""); val += s[i + 1] || ""; quoted = true; i += 2; continue; }
        if (c === "'") { var j = s.indexOf("'", i + 1); if (j < 0) throw new Error("A single quote is never closed."); raw += s.slice(i, j + 1); val += s.slice(i + 1, j); quoted = true; i = j + 1; continue; }
        if (c === '"') {
          var k = i + 1, inner = "";
          while (k < n && s[k] !== '"') { if (s[k] === "\\") { inner += s[k] + (s[k + 1] || ""); k += 2; } else if (s[k] === "$" && s[k + 1] === "(") { var e2 = balanced(s, k + 1); if (e2 < 0) throw new Error("A $( ... ) is never closed."); inner += s.slice(k, e2 + 1); k = e2 + 1; } else { inner += s[k]; k++; } }
          if (k >= n) throw new Error("A double quote is never closed.");
          raw += s.slice(i, k + 1); val += inner; quoted = true; i = k + 1; continue;
        }
        if (c === "$" && s[i + 1] === "(" && s[i + 2] !== "(") { var e3 = balanced(s, i + 1); if (e3 < 0) throw new Error("A $( ... ) is never closed."); raw += s.slice(i, e3 + 1); val += s.slice(i, e3 + 1); unqvar = true; i = e3 + 1; continue; }
        if (c === "`") { var q2 = s.indexOf("`", i + 1); if (q2 < 0) throw new Error("A backtick is never closed."); raw += s.slice(i, q2 + 1); val += s.slice(i, q2 + 1); unqvar = true; i = q2 + 1; continue; }
        if (c === "$") unqvar = true;
        if (c === "*" || c === "?" || c === "[") glob = true;
        raw += c; val += c; i++;
      }
      var w = { t: "word", raw: raw, val: val, quoted: quoted, unqvar: unqvar, glob: glob, subst: false };
      w.subs = substitutions(raw); w.subst = w.subs.length > 0;
      toks.push(w);
      if (lastRedir && (lastRedir === "<<" || lastRedir === "<<-") && toks[toks.length - 2] && toks[toks.length - 2].t === "redir") pending = val;
      lastRedir = null;
    }
    // connectors must have a command on each side
    var prev = null;
    toks.forEach(function (t) {
      if (t.t === "op") {
        if (prev === null || prev.t === "op") throw new Error(prev === null ? "The line starts with a connector (" + t.v + "): nothing comes before it." : "Two connectors in a row (" + prev.v + " then " + t.v + "): a command is missing between them.");
      }
      prev = t;
    });
    var last = toks[toks.length - 1];
    if (last && last.t === "op" && last.v !== "&" && last.v !== ";") throw new Error("The line ends with a connector (" + last.v + "): nothing follows it.");
    return toks;
  }

  // ---- flags ------------------------------------------------------------------------------------------------
  function lookupFlag(info, tok) {
    var f = info.f;
    if (f[tok]) return [{ text: tok, explain: f[tok][0], danger: f[tok][1] }];
    var eq = tok.match(/^([A-Za-z]+=)/); if (eq && f[eq[1]]) return [{ text: eq[1] + "...", explain: f[eq[1]][0], danger: f[eq[1]][1] }];
    if (/^--/.test(tok)) return [{ text: tok, explain: "A long option. See man for this command; the reference lists the short forms.", danger: "", unknown: true }];
    var m = tok.match(/^-([A-Za-z])(.*)$/);
    if (!m) return [{ text: tok, explain: "A numeric option, or one this reference does not list.", danger: "", unknown: true }];
    var first = "-" + m[1];
    if (!f[first]) return [{ text: tok, explain: "Not in this reference. Check man for this command.", danger: "", unknown: true }];
    var restLetters = m[2];
    if (restLetters === "") return [{ text: first, explain: f[first][0], danger: f[first][1] }];
    var allFlags = /^[A-Za-z]+$/.test(restLetters) && restLetters.split("").every(function (l) { return !!f["-" + l]; });
    if (allFlags) return [{ text: first, explain: f[first][0], danger: f[first][1] }].concat(restLetters.split("").map(function (l) { return { text: "-" + l, explain: f["-" + l][0], danger: f["-" + l][1] }; }));
    return [{ text: first, explain: f[first][0] + " (value attached: " + restLetters + ")", danger: f[first][1] }];
  }

  // ---- one command ------------------------------------------------------------------------------------------
  function fold(seg, sub, label) {
    seg.impact = worse(seg.impact, sub.impact);
    if (sub.unknown) { seg.unknownParts = (seg.unknownParts || 0) + sub.unknown; }
    sub.segments.forEach(function (s) { if (s.type === "cmd") s.warnings.forEach(function (w) { seg.warnings.push(label + ": " + w); }); });
    if (sub.verdict === "unknown") seg.warnings.push(label + ": part of it cannot be analysed, so it cannot be rated.");
    if (sub.verdict === "destroys") seg.warnings.push(label + ": this can delete or overwrite data.");
  }

  function analyzeSegment(toks, data, prevOp, depth) {
    var words = [], redirs = [], i;
    for (i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.t === "redir") { var tgt = null; if (toks[i + 1] && toks[i + 1].t === "word") { tgt = toks[i + 1]; i++; } redirs.push({ op: t.v, fd: t.fd, target: tgt }); }
      else if (t.t === "word") words.push(t);
    }
    var seg = { type: "cmd", impact: "reads", unknown: false, tokens: [], warnings: [], text: words.map(function (x) { return x.raw; }).join(" ") };
    var note = function (text, role, explain) { seg.tokens.push({ text: text, role: role, explain: explain || "" }); };

    // sub-shell parentheses and braces around the segment
    if (words[0] && /^\(+/.test(words[0].val) && !words[0].subst) { words[0] = Object.assign({}, words[0], { val: words[0].val.replace(/^\(+/, ""), raw: words[0].raw.replace(/^\(+/, "") }); if (!words[0].val) words.shift(); }
    if (words.length) {
      var lw = words[words.length - 1], lv = lw.val, cnt = function (str, ch) { return str.split(ch).length - 1; };
      while (/\)$/.test(lv) && cnt(lv, ")") > cnt(lv, "(")) lv = lv.slice(0, -1);
      if (lv !== lw.val) { words[words.length - 1] = Object.assign({}, lw, { val: lv, raw: lw.raw.slice(0, lw.raw.length - (lw.val.length - lv.length)) }); if (!lv) words.pop(); }
    }

    // function definition: name() { ... }
    if (words[0] && (/^[A-Za-z_:][A-Za-z0-9_:.-]*\(\)$/.test(words[0].val) || (words[1] && words[1].val === "()"))) {
      seg.cmd = words[0].val; seg.unknown = true; seg.summary = "Defines a function. What the function does when it is called is not analysed here.";
      note(words[0].raw, "function definition", seg.summary); seg.warnings.push("The body of this function is not analysed, so this cannot be rated."); return seg;
    }
    // leading shell syntax: keywords that introduce a command, and ones that carry none
    var guard = 0;
    while (words[0] && guard++ < 6) {
      var k = words[0].val;
      if (NEUTRAL.indexOf(k) > -1) { note(k, "shell syntax", "Marks the structure of a loop or condition; it runs nothing by itself."); words.shift(); continue; }
      if (CONDS.indexOf(k) > -1) { note(k, "shell syntax", "Runs the command after it and acts on whether it succeeded."); words.shift(); continue; }
      if (HEADERS.indexOf(k) > -1) { note(k, "shell syntax", "Starts a loop or a case statement. The commands inside it are rated separately."); seg.header = true; words = []; break; }
      break;
    }
    if (!words.length) { if (!seg.tokens.length && !redirs.length) seg.empty = true; seg.summary = seg.header ? "A loop or case header." : "Shell syntax only."; seg.structure = true; if (!redirs.length) return seg; }

    while (words[0] && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0].val) && !words[0].subst) { note(words[0].raw, "variable for this command only", "Sets this variable for the command that follows, not for the rest of the shell."); words.shift(); }

    var cmd = words.shift(); var info = null;
    if (cmd) {
      seg.cmd = cmd.val; info = data[cmd.val] || null;
      if (cmd.procsub) { seg.unknown = true; seg.summary = "A process substitution; what runs inside it is not analysed."; note(cmd.raw, "process substitution", seg.summary); return seg; }
      if (info) { seg.summary = info.s; seg.impact = worse(seg.impact, info.d); }
      else if (TESTS.indexOf(cmd.val) > -1) { seg.summary = "A shell builtin or test that this reference does not rate. It does not change files."; }
      else if (SHELLS.indexOf(cmd.val) > -1) { seg.summary = "A shell: it runs the text it is given as commands."; }
      else if (WRAPPERS[cmd.val]) { seg.summary = "Runs another command; that command is rated below."; }
      else if (cmd.val === "eval" || cmd.val === "source" || cmd.val === ".") { seg.unknown = true; seg.summary = cmd.val === "eval" ? "Runs text as a command. What the text is cannot be known from here." : "Runs the commands in a file. What is in the file cannot be known from here."; }
      else if (cmd.val === "git") { seg.unknown = true; seg.summary = "Not rated: what git does depends on the subcommand."; }
      else { seg.unknown = true; seg.summary = "Not in this reference, so it cannot be rated. Try man " + cmd.val + " or " + cmd.val + " --help."; }
      seg.tokens.unshift({ text: cmd.raw, role: "command", explain: "" });
      if (cmd.unqvar && !cmd.quoted && !cmd.subst) seg.warnings.push("The command name itself comes from an expansion: check what it expands to.");
    }

    // commands hidden inside $( ) and backticks anywhere on the line
    var allWords = (cmd ? [cmd] : []).concat(words);
    var nested = 0;
    allWords.forEach(function (w) {
      (w.subs || []).forEach(function (sub) {
        if (depth >= MAXDEPTH) { seg.unknown = true; seg.warnings.push("Substitutions nested too deeply to analyse."); return; }
        try { fold(seg, analyze(sub, data, depth + 1), "inside " + (sub.length > 24 ? sub.slice(0, 24) + "…" : sub)); nested++; } catch (e) { seg.unknown = true; seg.warnings.push("A command inside " + w.raw + " could not be read (" + e.message + "), so it cannot be rated."); }
      });
    });

    // wrappers and shells that run another command: rate that command
    function delegate(rest, label) {
      if (!rest.length) return;
      if (depth >= MAXDEPTH) { seg.unknown = true; seg.warnings.push("Commands nested too deeply to analyse."); return; }
      try { var sub = analyze(rest.map(function (w) { return w.raw; }).join(" "), data, depth + 1); fold(seg, sub, label); if (sub.verdict === "unknown") seg.unknown = true; } catch (e) { seg.unknown = true; seg.warnings.push("The command after " + label + " could not be read (" + e.message + ")."); }
    }
    if (cmd && WRAPPERS[cmd.val]) {
      var rest = words.slice(), wv = cmd.val, skipVal = { xargs: ["-n", "-I", "-P", "-L", "-s", "-d", "-E", "-a", "-J"], sudo: ["-u", "-g", "-C"], timeout: ["-s", "-k"], nice: ["-n"], ionice: ["-c", "-n"], env: ["-u"] }[wv] || [];
      var skipped = [];
      while (rest.length) {
        var r0 = rest[0];
        if (wv === "env" && /^[A-Za-z_][A-Za-z0-9_]*=/.test(r0.val)) { skipped.push(rest.shift()); continue; }
        if (/^-/.test(r0.val) && !r0.quoted) { skipped.push(rest.shift()); if (skipVal.indexOf(skipped[skipped.length - 1].val) > -1 && rest.length) skipped.push(rest.shift()); continue; }
        if (wv === "timeout" && /^[0-9.]+[smhd]?$/.test(r0.val) && skipped.every(function (x) { return !/^[0-9]/.test(x.val); })) { skipped.push(rest.shift()); continue; }
        break;
      }
      skipped.forEach(function (w) { note(w.raw, wv + " option", ""); });
      if (wv === "sudo") { seg.impact = worse(seg.impact, "changes"); seg.warnings.push("sudo: this runs with administrator rights, so read it twice."); }
      if (wv === "xargs") { seg.impact = worse(seg.impact, "changes"); seg.warnings.push("xargs runs the command that follows, once or many times, on whatever arrives on its input."); }
      if (wv === "exec" && !rest.length) { seg.unknown = true; }
      rest.forEach(function (w) { note(w.raw, "part of the command that runs", ""); });
      delegate(rest, wv);
      words = [];
    } else if (cmd && SHELLS.indexOf(cmd.val) > -1) {
      var ci = -1;
      for (var q = 0; q < words.length; q++) if (/^-[A-Za-z]*c[A-Za-z]*$/.test(words[q].val) && !words[q].quoted) { ci = q; break; }
      if (ci > -1 && words[ci + 1]) {
        note(words[ci].raw, "option", "Run the text that follows as a command, then exit.");
        note(words[ci + 1].raw, "command text", "The text this shell will run. It is rated below.");
        delegate([{ raw: words[ci + 1].val }], cmd.val + " -c");
        words = [];
      } else if (prevOp === "|" || prevOp === "|&") {
        seg.impact = worse(seg.impact, "destroys");
        seg.warnings.push("Piping into a shell runs whatever text arrives as a program. If the text comes from a download, you are running code you have not read.");
      } else if (words.some(function (w) { return !/^-/.test(w.val); })) {
        seg.unknown = true; seg.warnings.push("This runs a script file, and what is in the file cannot be known from here.");
      }
    }

    // find -exec / -execdir: the command it runs is rated too
    var flagsSeen = {}, firstArg = true, hasE = false, inExec = false, execWords = [];
    var endExec = function () { inExec = false; if (execWords.length) delegate(execWords.map(function (w) { return { raw: w }; }), "-exec"); execWords = []; };
    words.forEach(function (w) {
      if (inExec) {
        if (w.val === ";" || w.val === "+" || w.raw === "\\;") { endExec(); return; }
        execWords.push(w.raw); note(w.raw, "run on each match", execWords.length === 1 ? "The command that find runs for every match; {} stands for the file." : "Part of the command run for each match."); return;
      }
      var isFlag = !w.quoted && /^-./.test(w.val) && info;
      if (isFlag) {
        lookupFlag(info, w.val).forEach(function (f) {
          flagsSeen[f.text] = true;
          seg.tokens.push({ text: f.text, role: f.unknown ? "option (not listed)" : "option", explain: f.explain, danger: f.danger || "" });
          if (f.danger) seg.impact = worse(seg.impact, f.danger);
        });
        if (w.val === "-exec" || w.val === "-execdir") { inExec = true; execWords = []; }
        if (w.val === "-e" || w.val === "-f") hasE = true;
        return;
      }
      if (info && /^[A-Za-z]+=/.test(w.val) && info.f[w.val.match(/^[A-Za-z]+=/)[0]]) {
        var fl = lookupFlag(info, w.val)[0]; seg.tokens.push({ text: fl.text, role: "option", explain: fl.explain, danger: fl.danger || "" }); if (fl.danger) seg.impact = worse(seg.impact, fl.danger); return;
      }
      var role = "argument", ex = "";
      if (firstArg && info && !hasE) {
        if (cmd.val === "grep") { role = "pattern"; ex = "The text or regular expression to look for."; }
        else if (cmd.val === "sed") { role = "script"; ex = "The editing instructions, such as s/old/new/."; }
        else if (cmd.val === "awk") { role = "program"; ex = "What to do with each line, in awk's own language. awk can run commands from inside a program."; }
        else if (cmd.val === "chmod") { role = "mode"; ex = "The permissions to set."; }
      }
      if (!ex) ex = w.glob && !w.quoted ? "Matched against file names by the shell before the command runs." : (w.subst ? "Replaced by the output of a command before this one runs." : "");
      firstArg = false;
      seg.tokens.push({ text: w.raw, role: role, explain: ex });
      if (w.unqvar && !w.subst) seg.warnings.push(w.raw + " is not in quotes: the shell splits it at spaces and expands wildcards in it. Quote the variable itself and keep any wildcard outside the quotes, as in \"$dir\"/* .");
    });
    if (inExec) endExec();
    if (cmd && cmd.val === "awk" && words.some(function (w) { return /system\s*\(/.test(w.val); })) { seg.impact = worse(seg.impact, "changes"); seg.warnings.push("This awk program calls system(), which runs other commands."); }

    // rm, chmod, chown and git: rules that look at what they are pointed at
    var recursive = flagsSeen["-r"] || flagsSeen["-R"], force = flagsSeen["-f"];
    var args = words.filter(function (w) { return !/^-/.test(w.val) || w.quoted; });
    if (seg.cmd === "rm") {
      args.forEach(function (w) {
        if (DANGEROUS_PATH.test(w.val)) seg.warnings.push("rm on " + w.raw + (recursive ? " with -r" : "") + " deletes everything it matches, with no undo. Check the path.");
        else if (/^"?\$\{?[A-Za-z_]\w*\}?"?\//.test(w.raw)) seg.warnings.push("If the variable in " + w.raw + " is empty, this becomes a path from the root, and quoting it does not help. Check it first, or use ${var:?} so the command stops when it is empty.");
        else if (w.val === "--") { /* end of options */ }
      });
      if (recursive && force) seg.warnings.push("-r with -f deletes a whole tree without asking.");
    }
    if ((seg.cmd === "chmod" || seg.cmd === "chown") && recursive) {
      if (args.some(function (w) { return DANGEROUS_PATH.test(w.val) && w.val !== "." && w.val !== ".."; })) { seg.impact = "destroys"; seg.warnings.push("Changing permissions or owners recursively from the root or a system directory can leave the system unusable."); }
      if (seg.cmd === "chmod" && args.some(function (w) { return /^[0-7]?777$/.test(w.val); })) seg.warnings.push("777 lets every user read, write and run these files, which is rarely what you want.");
    }
    if (seg.cmd === "git") {
      var sub = args.map(function (w) { return w.val; });
      if (sub[0] === "clean" && words.some(function (w) { return /^-[a-zA-Z]*f/.test(w.val); })) { seg.impact = "destroys"; seg.unknown = false; seg.warnings.push("git clean -f deletes files that are not tracked by git, with no undo."); }
      else if (sub[0] === "reset" && words.some(function (w) { return w.val === "--hard"; })) { seg.impact = "destroys"; seg.unknown = false; seg.warnings.push("git reset --hard throws away uncommitted changes, with no undo."); }
      else if (sub[0] === "push" && words.some(function (w) { return w.val === "--force" || w.val === "-f" || w.val === "--force-with-lease"; })) seg.warnings.push("A forced push can overwrite other people's commits on the remote.");
    }
    if (seg.cmd === "dd" && words.some(function (w) { return /^of=\/dev\//.test(w.val); })) seg.warnings.push("dd is writing straight onto a device: whatever is there is overwritten, including a whole disk.");

    // pipe into a shell without -c
    // redirections
    redirs.forEach(function (r) {
      var label = (r.fd || "") + r.op, tgt = r.target ? r.target.raw : "(nothing)", ex = REDIR[r.op] || "redirection";
      if (r.op === ">&" || r.op === "<&") ex = (r.fd === "2" && tgt === "1") ? "send error messages to wherever normal output goes" : ex;
      if (r.fd === "2" && r.op === ">") ex = "send error messages to the file, replacing its contents";
      if (r.fd === "2" && r.op === ">>") ex = "append error messages to the file";
      seg.tokens.push({ text: label + " " + (r.op.indexOf("&") === 1 && tgt === "1" ? "" : tgt), role: "redirection", explain: ex });
      var writes = /^(\d*)(>|>>)$/.test(label) || r.op === "&>" || r.op === "&>>";
      if (writes && r.target && r.target.val !== "/dev/null" && !/^&?\d$/.test(r.target.val)) {
        if (/^\/dev\/(sd|hd|nvme|vd|xvd|disk|mmcblk)/.test(r.target.val)) { seg.impact = "destroys"; seg.warnings.push("This writes straight onto a disk device, overwriting whatever is there."); }
        seg.impact = worse(seg.impact, "changes");
        if (r.op === ">" || r.op === "&>") {
          seg.warnings.push("> empties " + tgt + " before the command even starts. If a file may already exist there, its contents are gone.");
          seg.impact = worse(seg.impact, "destroys");
          if (words.some(function (w) { return w.val === r.target.val && !/^-/.test(w.val); })) seg.warnings.push("The same file (" + tgt + ") is read and written: the shell empties it first, so the command sees nothing and the file ends up empty.");
        }
      }
      if (r.target && r.target.subs && r.target.subs.length) r.target.subs.forEach(function (s2) { try { fold(seg, analyze(s2, data, depth + 1), "inside " + s2); } catch (e) { seg.unknown = true; } });
    });
    if (seg.unknownParts) seg.unknown = true;
    return seg;
  }

  function analyze(text, data, depth) {
    depth = depth || 0;
    if (text.length > MAXLEN) throw new Error("That line is longer than " + MAXLEN + " characters. Paste a shorter one.");
    if (/:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/.test(text)) {
      return { segments: [{ type: "cmd", cmd: ":(){ :|:& };:", impact: "destroys", unknown: false, summary: "A fork bomb: a function that calls itself twice in the background, forever, until the machine runs out of processes.", tokens: [], warnings: ["This is the classic fork bomb. It can freeze a machine."], text: text }], impact: "destroys", unknown: 0, verdict: "destroys", reasons: ["This is the classic fork bomb. It can freeze a machine."] };
    }
    var toks = tokenize(text);
    var out = { segments: [], impact: "reads", unknown: 0, verdict: "reads", reasons: [] };
    var cur = [], prev = null;
    function flush(nextOp) {
      if (cur.length) { var s = analyzeSegment(cur, data, prev, depth); out.segments.push(s); out.impact = worse(out.impact, s.impact); if (s.unknown) out.unknown++; }
      cur = []; prev = nextOp;
      if (nextOp) out.segments.push({ type: "conn", op: nextOp, explain: CONNECTORS[nextOp] });
    }
    toks.forEach(function (t) { if (t.t === "op") flush(t.v); else cur.push(t); });
    flush(null);
    out.segments = out.segments.filter(function (s, idx, arr) { return !(s.type === "conn" && idx === arr.length - 1); });
    if (!out.segments.some(function (s) { return s.type === "cmd" && !s.empty; })) throw new Error("There is no command to explain.");
    out.verdict = out.impact === "destroys" ? "destroys" : (out.unknown > 0 ? "unknown" : out.impact);
    out.segments.forEach(function (s) {
      if (s.type !== "cmd") return;
      s.warnings.forEach(function (w) { if (out.reasons.length < 4) out.reasons.push((s.cmd ? s.cmd + ": " : "") + w); });
      if (s.unknown && !s.warnings.length && out.reasons.length < 4) out.reasons.push((s.cmd ? s.cmd + ": " : "") + s.summary);
    });
    return out;
  }

  var api = { analyze: analyze, tokenize: tokenize };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Explain = api;
})(typeof window !== "undefined" ? window : this);
