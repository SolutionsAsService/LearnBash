// Progressive enhancement: the reference is complete without this; it adds search and a filter by kind of task.
(function () {
  "use strict";
  var tools = document.getElementById("cmd-tools");
  if (!tools) return;
  tools.hidden = false;
  var cards = Array.prototype.slice.call(document.querySelectorAll(".cmd-card"));
  var chips = document.getElementById("group-chips");
  var q = document.getElementById("q");
  var count = document.getElementById("count");
  var group = "", text = "";
  function apply() {
    var n = 0;
    cards.forEach(function (c) {
      var hay = c.getAttribute("data-name") + " " + c.getAttribute("data-text");
      var show = (!group || c.getAttribute("data-group") === group) && (!text || hay.indexOf(text) > -1);
      c.hidden = !show; if (show) n++;
    });
    count.textContent = (group || text) ? "Showing " + n + " of " + cards.length + " commands." : "Showing all " + cards.length + " commands.";
  }
  chips.addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    group = b.getAttribute("data-group") || "";
    Array.prototype.forEach.call(chips.querySelectorAll("button"), function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    apply();
  });
  q.addEventListener("input", function () { text = q.value.trim().toLowerCase(); apply(); });
  apply();
})();
