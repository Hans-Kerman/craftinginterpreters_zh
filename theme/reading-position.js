(function () {
  "use strict";

  var POS_PREFIX = "ci-reader:pos:";
  var LAST_KEY = "ci-reader:last";
  var DEBOUNCE_MS = 500;
  var INDEX_PATHS = ["/", "/index.html"];

  function clamp01(n) {
    return Math.min(1, Math.max(0, n));
  }

  function scrollableHeight() {
    return document.documentElement.scrollHeight - window.innerHeight;
  }

  function savePosition() {
    var h = scrollableHeight();
    var ratio = h <= 0 ? 0 : clamp01(window.scrollY / Math.max(1, h));
    var ts = Date.now();
    try {
      localStorage.setItem(POS_PREFIX + location.pathname, JSON.stringify({ ratio: ratio, ts: ts }));
      localStorage.setItem(LAST_KEY, JSON.stringify({ path: location.pathname, title: document.title, ts: ts }));
    } catch (e) { /* localStorage 不可用（隐私模式等）时静默跳过 */ }
  }

  var timer = null;
  window.addEventListener("scroll", function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(savePosition, DEBOUNCE_MS);
  }, { passive: true });

  function restorePosition() {
    try {
      var raw = localStorage.getItem(POS_PREFIX + location.pathname);
      if (!raw) return;
      var pos = JSON.parse(raw);
      if (pos && pos.ratio > 0) {
        window.scrollTo(0, pos.ratio * scrollableHeight());
      }
    } catch (e) { /* ignore */ }
  }

  function onReady(fn) {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", fn);
  }

  onReady(function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        setTimeout(restorePosition, 100);
      });
    });
  });

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) restorePosition();
  });

  (function autoJump() {
    if (INDEX_PATHS.indexOf(location.pathname) === -1) return;
    if (location.hash) return;
    var sameOriginRef = false;
    if (document.referrer) {
      try { sameOriginRef = new URL(document.referrer).origin === location.origin; }
      catch (e) { sameOriginRef = false; }
    }
    if (sameOriginRef) return;
    var last = null;
    try { last = JSON.parse(localStorage.getItem(LAST_KEY) || "null"); } catch (e) {}
    if (!last || !last.path) return;
    if (INDEX_PATHS.indexOf(last.path) !== -1) return;
    location.replace(last.path);
  })();
})();
