(function () {
  "use strict";

  var reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var noMotion = reduceMotion || saveData;
  var root = document.documentElement;
  if (noMotion) { root.classList.add("no-motion"); }

  var nav = document.querySelector("[data-nav]");
  var list = document.querySelector("[data-nav-list]");
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav-link]"));
  var openBtn = document.querySelector("[data-nav-open]");
  var expandBtn = document.querySelector("[data-nav-expand]");
  var scrim = document.querySelector("[data-scrim]");
  var indicator = document.querySelector("[data-indicator]");
  var phoneMQ = window.matchMedia("(max-width: 699.98px) and (min-height: 500px)");
  var railMQ = window.matchMedia("(max-height: 499.98px)");
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  var current = -1;
  var ticking = false;

  function isDrawer() { return phoneMQ.matches; }

  function setDrawer(open) {
    if (!isDrawer() || !nav) { return; }
    var wasOpen = nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    root.classList.toggle("drawer-open", open);
    scrim.classList.toggle("is-open", open);
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open && !wasOpen) { links[0].focus({ preventScroll: true }); }
    if (!open && wasOpen && nav.contains(document.activeElement)) { openBtn.focus({ preventScroll: true }); }
  }

  function setRailExpanded(open) {
    if (!railMQ.matches || !nav) { return; }
    nav.classList.toggle("is-expanded", open);
    expandBtn.setAttribute("aria-expanded", open ? "true" : "false");
    expandBtn.setAttribute("aria-label", open ? "Collapse navigation" : "Expand navigation");
  }

  function go(id, e) {
    var target = document.getElementById(id);
    if (!target) { return; }
    if (e) { e.preventDefault(); }
    target.scrollIntoView({ behavior: noMotion ? "auto" : "smooth", block: "start" });
    if (history.replaceState) { history.replaceState(null, "", "#" + id); }
    if (isDrawer()) { setDrawer(false); }
    if (railMQ.matches && nav.classList.contains("is-expanded")) { setRailExpanded(false); }
  }

  function moveIndicator(link) {
    if (!indicator || !link || !list) { return; }
    var lr = link.getBoundingClientRect();
    var cr = list.getBoundingClientRect();
    indicator.style.transform = "translateY(" + Math.round(lr.top - cr.top) + "px)";
    indicator.style.height = Math.round(lr.height) + "px";
    indicator.classList.add("is-ready");
  }

  function setCurrent(idx) {
    if (idx === current) { return; }
    current = idx;
    links.forEach(function (a, i) {
      if (i === idx) { a.setAttribute("aria-current", "true"); }
      else { a.removeAttribute("aria-current"); }
    });
    moveIndicator(links[idx]);
  }

  function updateActive() {
    ticking = false;
    var line = window.innerHeight * 0.35;
    var idx = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] && sections[i].getBoundingClientRect().top <= line) { idx = i; }
    }
    setCurrent(idx);
  }

  function scheduleActive() {
    if (ticking) { return; }
    ticking = true;
    requestAnimationFrame(updateActive);
  }

  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      go(a.getAttribute("href").slice(1), e);
    });
  });

  var brandLinks = document.querySelectorAll(".brand, .brand-mini");
  Array.prototype.forEach.call(brandLinks, function (a) {
    a.addEventListener("click", function (e) { go("home", e); });
  });

  if (openBtn) {
    openBtn.addEventListener("click", function () {
      setDrawer(!nav.classList.contains("is-open"));
    });
  }
  if (expandBtn) {
    expandBtn.addEventListener("click", function () {
      setRailExpanded(!nav.classList.contains("is-expanded"));
    });
  }
  if (scrim) {
    scrim.addEventListener("click", function () { setDrawer(false); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (nav && nav.classList.contains("is-open")) { setDrawer(false); }
      else if (nav && nav.classList.contains("is-expanded")) { setRailExpanded(false); }
    }
  });
  function onLayoutChange() {
    if (!isDrawer()) { setDrawer(false); }
    if (!railMQ.matches) { setRailExpanded(false); }
    if (current >= 0) { moveIndicator(links[current]); }
    scheduleActive();
  }
  if (phoneMQ.addEventListener) { phoneMQ.addEventListener("change", onLayoutChange); }
  if (railMQ.addEventListener) { railMQ.addEventListener("change", onLayoutChange); }

  window.addEventListener("scroll", scheduleActive, { passive: true });
  window.addEventListener("resize", onLayoutChange);

  // Reveal on scroll (off for reduced motion and data saver)
  var revealIO = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add("is-in"); revealIO.unobserve(entry.target); }
    });
  }, { threshold: 0.12 }) : null;
  var reveals = document.querySelectorAll(".reveal");
  Array.prototype.forEach.call(reveals, function (n) {
    if (!revealIO || noMotion) { n.classList.add("is-in"); }
    else { revealIO.observe(n); }
  });

  // Video: scroll position maps to the clip, forward on down and back on up, across the whole page.
  function initScrub() {
    var scrub = document.querySelector("[data-scrub]");
    var video = document.querySelector("[data-hero-video]");
    if (!scrub || !video) { return; }
    video.muted = true;
    video.pause();

    if (noMotion) {
      scrub.classList.add("is-static");
      video.preload = "none";
      video.controls = true;
      var playBtn = document.querySelector("[data-hero-play]");
      if (playBtn) {
        playBtn.hidden = false;
        playBtn.addEventListener("click", function () {
          video.muted = true;
          var p = video.play();
          if (p && typeof p.then === "function") {
            p.then(function () { playBtn.hidden = true; }, function () {});
          }
        });
      }
      return;
    }

    video.addEventListener("play", function () { video.pause(); });

    var ready = false;
    var queued = false;
    var pending = false;
    var last = -1;

    function schedule() {
      if (queued) { return; }
      queued = true;
      requestAnimationFrame(draw);
    }
    // One full pass of the clip covers two screen heights of scroll, as the approved hero did.
    function scrollPerPass() { return Math.max(1, 2 * window.innerHeight); }
    function draw() {
      queued = false;
      if (!ready || !isFinite(video.duration) || video.duration <= 0) { return; }
      if (video.seeking) { pending = true; return; }
      var D = video.duration;
      var y = window.scrollY || window.pageYOffset || 0;
      var t = (y / scrollPerPass()) * D;
      t = t - D * Math.floor(t / D);
      if (Math.abs(t - last) < 0.0005) { return; }
      last = t;
      video.currentTime = Math.max(0, Math.min(t, D - 0.04));
    }
    function markReady() {
      if (ready) { return; }
      ready = true;
      last = -1;
      schedule();
    }
    function fullyBuffered() {
      var b = video.buffered;
      if (!b || !b.length || !isFinite(video.duration) || video.duration <= 0) { return false; }
      return b.end(b.length - 1) >= video.duration - 0.05;
    }

    video.addEventListener("seeked", function () { if (pending) { pending = false; schedule(); } });
    video.addEventListener("progress", function () { if (!ready && fullyBuffered()) { markReady(); } });
    video.addEventListener("canplaythrough", function () { if (!ready && fullyBuffered()) { markReady(); } });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    var source = video.querySelector("source");
    var url = source ? source.getAttribute("src") : null;
    if (url && window.fetch && window.URL && URL.createObjectURL) {
      fetch(url).then(function (r) {
        if (!r.ok) { throw new Error("video status " + r.status); }
        return r.blob();
      }).then(function (blob) {
        source.parentNode.removeChild(source);
        video.addEventListener("loadeddata", markReady, { once: true });
        video.src = URL.createObjectURL(blob);
        video.load();
      }).catch(function () {});
    }
    schedule();
  }

  initScrub();

  // Start on the section named in the address bar, if any
  var hash = (location.hash || "").slice(1);
  if (hash && document.getElementById(hash)) {
    document.getElementById(hash).scrollIntoView({ behavior: "auto", block: "start" });
  }
  onLayoutChange();
  scheduleActive();
})();
