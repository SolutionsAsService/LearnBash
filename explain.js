// The page around explain-core.js: reads the command, renders the analysis. Nothing is executed and nothing is sent anywhere.
(function () {
  "use strict";
  var form = document.getElementById("explain-form");
  if (!form || !window.Explain) return;
  var data = JSON.parse(document.getElementById("cmd-data").textContent);
  var out = document.getElementById("result"), input = document.getElementById("cmd");
  Array.prototype.forEach.call(document.querySelectorAll(".js-only"), function (el) { el.hidden = false; });

  var NAMES = { reads: "Only reads", changes: "Changes things", destroys: "Can delete data", unknown: "Can't tell" };
  var SAYS = {
    reads: "Nothing in this changes your files or the system.",
    changes: "This can create or modify files or system state.",
    destroys: "This can permanently delete or overwrite data. Check every path before running it.",
    unknown: "Part of this could not be analysed, so it is not being called safe."
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var mark = function (lvl) { return '<span class="mk mk-' + lvl + '"><i aria-hidden="true"></i>' + NAMES[lvl] + '</span>'; };

  function render(a) {
    var v = a.verdict;
    var reasons = a.reasons.length ? '<ul class="why">' + a.reasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join("") + '</ul>' : "";
    var known = v === "unknown" ? '<p class="partial">The parts it does understand are rated "' + NAMES[a.impact] + '".</p>' : "";
    var html = '<div class="verdict v-' + v + '">' + mark(v) + '<p>' + SAYS[v] + ' <strong>Nothing was run.</strong></p>' + reasons + known +
      '<p class="caveat">A reading aid, not a safety scanner: read a command yourself before you run it.</p></div><ol class="parts">';
    a.segments.forEach(function (s) {
      if (s.type === "conn") { html += '<li class="conn"><span><code>' + esc(s.op) + '</code> ' + esc(s.explain) + '</span></li>'; return; }
      var lvl = s.unknown ? "unknown" : s.impact;
      html += '<li class="part"><header><h3><code>' + esc(s.cmd || s.text || "(redirection only)") + '</code></h3>' + (s.structure && !s.cmd ? '<span class="mk"><i aria-hidden="true"></i>Shell syntax</span>' : mark(lvl)) + '</header>';
      if (s.summary) html += '<p class="what">' + esc(s.summary) + '</p>';
      if (s.tokens.length) {
        html += '<dl class="toks">';
        s.tokens.forEach(function (t) {
          html += '<div><dt><code>' + esc(t.text) + '</code></dt><dd><strong>' + esc(t.role) + '.</strong> ' + esc(t.explain || "") + (t.danger ? ' ' + mark(t.danger) : "") + '</dd></div>';
        });
        html += '</dl>';
      }
      if (s.warnings.length) html += '<ul class="warns">' + s.warnings.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join("") + '</ul>';
      html += '</li>';
    });
    out.innerHTML = html + '</ol>';
  }

  function run(text) {
    if (!text.trim()) { out.innerHTML = '<div class="err"><p>Type or paste a command line first, for example <code>ls -la</code>.</p></div>'; return; }
    try { render(window.Explain.analyze(text, data)); }
    catch (e) { out.innerHTML = '<div class="err"><p><strong>Cannot read that.</strong> ' + esc(e.message) + '</p></div>'; }
    try { out.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { /* ignore */ }
  }
  form.addEventListener("submit", function (ev) { ev.preventDefault(); run(input.value); });
  Array.prototype.forEach.call(document.querySelectorAll(".chip.ex"), function (b) {
    b.addEventListener("click", function () { input.value = b.getAttribute("data-cmd"); run(input.value); });
  });
})();
