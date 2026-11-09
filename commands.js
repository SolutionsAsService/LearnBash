// Progressive enhancement: the reference is complete without this (with a jump list); it adds search and a filter by kind of task.
// Search matches every word you type against the command name, its summary and a few everyday words for it
// ("duplicate" finds cp, "delete" finds rm), so you can ask for what you want to do.
(function () {
  "use strict";
  var tools = document.getElementById("cmd-tools");
  if (!tools) return;
  tools.hidden = false;
  var cards = Array.prototype.slice.call(document.querySelectorAll(".cmd-card"));
  var chips = document.getElementById("group-chips");
  var q = document.getElementById("q");
  var count = document.getElementById("count");
  var group = "", words = [];
  function apply() {
    var n = 0;
    cards.forEach(function (c) {
      var hay = c.getAttribute("data-name") + " " + c.getAttribute("data-text");
      var show = (!group || c.getAttribute("data-group") === group) && words.every(function (w) { return hay.indexOf(w) > -1; });
      c.hidden = !show; if (show) n++;
    });
    count.textContent = (group || words.length) ? "Showing " + n + " of " + cards.length + " commands." + (n === 0 ? " Try one word, such as copy, delete, search or download." : "") : "Showing all " + cards.length + " commands.";
  }
  chips.addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    group = b.getAttribute("data-group") || "";
    Array.prototype.forEach.call(chips.querySelectorAll("button"), function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    apply();
  });
  q.addEventListener("input", function () { words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean); apply(); });
  apply();
})();
