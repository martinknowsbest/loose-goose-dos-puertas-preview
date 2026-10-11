(function () {
  "use strict";

  var DATA = window.LOOSE_GOOSE_DATA;
  if (!DATA) { return; }

  var PAGE_TITLES = { home: "Loose Goose", menu: "Menu", "find-us": "Find Us", contact: "Contact" };
  var reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var desktop = window.matchMedia ? window.matchMedia("(min-width: 820px)") : null;
  var barShown = false;

  if (reduceMotion || saveData) { document.documentElement.classList.add("no-motion"); }

  var nav = document.querySelector("[data-nav]");
  var menuBtn = document.querySelector("[data-menu-btn]");
  var menuLabel = document.querySelector("[data-menu-label]");

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined && text !== null) { n.textContent = text; }
    return n;
  }

  function shopById(id) {
    return DATA.shops.filter(function (s) { return s.id === id; })[0];
  }

  function addressText(s) { return s.address.line1 + ", " + s.address.line2; }

  function directionsHref(s) {
    return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(s.name + ", " + addressText(s));
  }

  function telHref(s) { return "tel:" + s.phone.tel; }

  function pillRow(items, cls) {
    var row = el("ul", "pill-row" + (cls ? " " + cls : ""));
    items.forEach(function (t) { row.appendChild(el("li", "tag", t)); });
    return row;
  }

  function facebookButton() {
    var fb = el("a", "btn btn-glass", "Facebook page");
    fb.href = DATA.links.facebook;
    fb.target = "_blank";
    fb.rel = "noopener";
    return fb;
  }

  function shopCard(shop) {
    var card = el("article", "shop glass reveal");
    card.setAttribute("data-card", shop.id);
    card.setAttribute("aria-labelledby", "name-" + shop.id);
    var h = el("h2", "shop-name", shop.name);
    h.id = "name-" + shop.id;
    card.appendChild(h);
    card.appendChild(el("p", "shop-line", addressText(shop)));
    card.appendChild(pillRow(shop.tags));
    var actions = el("div", "actions");
    if (shop.phone) {
      var call = el("a", "btn btn-primary", "Call " + shop.phone.display);
      call.href = telHref(shop);
      actions.appendChild(call);
    }
    var go = el("a", "btn btn-glass", "Directions");
    go.href = directionsHref(shop);
    go.target = "_blank";
    go.rel = "noopener";
    actions.appendChild(go);
    actions.appendChild(facebookButton());
    card.appendChild(actions);
    return card;
  }

  var revealIO = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 }) : null;

  function observeReveal(root) {
    var nodes = (root || document).querySelectorAll(".reveal:not(.is-in)");
    nodes.forEach(function (n) {
      if (!revealIO || reduceMotion || saveData) { n.classList.add("is-in"); }
      else { revealIO.observe(n); }
    });
  }

  function renderShops() {
    var first = document.querySelector("[data-shops-first]");
    var after = document.querySelector("[data-shops-after]");
    if (!first || !after) { return; }
    first.textContent = "";
    after.textContent = "";
    var deskNow = desktop && desktop.matches;
    DATA.shops.forEach(function (shop, i) {
      var card = shopCard(shop);
      if (!deskNow && i === 0) { card.classList.remove("reveal"); first.appendChild(card); }
      else { after.appendChild(card); }
    });
    observeReveal(document);
  }

  function renderMenuPage() {
    var list = document.querySelector("[data-menu-list]");
    if (list) {
      list.textContent = "";
      DATA.menu.forEach(function (cat) {
        var card = el("section", "block glass reveal");
        card.setAttribute("aria-labelledby", "menu-" + cat.id);
        var h = el("h3", "block-title", cat.name);
        h.id = "menu-" + cat.id;
        card.appendChild(h);
        card.appendChild(pillRow(cat.items, "pill-row-menu"));
        list.appendChild(card);
      });
    }
    var featured = document.querySelector("[data-featured]");
    if (featured) {
      featured.textContent = "";
      featured.appendChild(pillRow(DATA.menu.reduce(function (acc, cat) { return acc.concat(cat.items); }, []), "pill-row-menu"));
    }
  }

  function renderFind() {
    var list = document.querySelector("[data-find-list]");
    if (!list) { return; }
    list.textContent = "";
    var grid = el("div", "find-grid");
    DATA.shops.forEach(function (shop) { grid.appendChild(shopCard(shop)); });
    list.appendChild(grid);
  }

  function linkButton(label, href, cls) {
    var a = el("a", cls || "btn btn-glass", label);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    return a;
  }

  function renderContact() {
    var box = document.querySelector("[data-contact-list]");
    if (!box) { return; }
    box.textContent = "";
    var south = shopById("south");
    var north = shopById("north");

    var call = el("section", "block glass reveal");
    call.appendChild(el("h2", "block-title", "Call"));
    call.appendChild(el("p", "shop-line", south.name + ", " + addressText(south)));
    var a1 = el("div", "actions");
    var tel = el("a", "btn btn-primary", "Call " + south.phone.display);
    tel.href = telHref(south);
    a1.appendChild(tel);
    a1.appendChild(linkButton("Directions", directionsHref(south)));
    call.appendChild(a1);
    box.appendChild(call);

    var visit = el("section", "block glass reveal");
    visit.appendChild(el("h2", "block-title", "North shop"));
    visit.appendChild(el("p", "shop-line", north.name + ", " + addressText(north)));
    visit.appendChild(pillRow(north.tags));
    var a2 = el("div", "actions");
    a2.appendChild(linkButton("Directions", directionsHref(north)));
    a2.appendChild(facebookButton());
    visit.appendChild(a2);
    box.appendChild(visit);

    var online = el("section", "block glass reveal");
    online.appendChild(el("h2", "block-title", "Online"));
    var a3 = el("div", "actions");
    a3.appendChild(linkButton("Facebook page", DATA.links.facebook));
    a3.appendChild(linkButton("Yelp reviews", DATA.links.yelp));
    a3.appendChild(linkButton("Google reviews", DATA.links.googleReviews));
    online.appendChild(a3);
    box.appendChild(online);
  }

  function updateBottomBar() {
    var s = shopById("south");
    var call = document.querySelector("[data-bb-call]");
    var map = document.querySelector("[data-bb-map]");
    if (call) { call.href = telHref(s); }
    if (map) { map.href = directionsHref(s); }
  }

  function setMenu(open) {
    if (!nav || !menuBtn) { return; }
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (menuLabel) { menuLabel.textContent = open ? "Close" : "Menu"; }
  }

  function initMenu() {
    if (!nav || !menuBtn) { return; }
    menuBtn.addEventListener("click", function () {
      setMenu(!nav.classList.contains("open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("open")) { return; }
      if (nav.contains(e.target) || menuBtn.contains(e.target)) { return; }
      setMenu(false);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) { setMenu(false); }
    });
  }

  function syncBar() {
    var bar = document.querySelector("[data-bottom]");
    if (!bar) { return; }
    var y = window.scrollY || window.pageYOffset || 0;
    if (y > 300) { barShown = true; }
    else if (y < 80) { barShown = false; }
    var isPhone = !(desktop && desktop.matches);
    var show = barShown && isPhone;
    bar.classList.toggle("is-shown", show);
    bar.toggleAttribute("inert", !show);
  }

  function routeName() {
    var key = (location.hash || "").replace(/^#\/?/, "");
    return key === "" ? "home" : key;
  }

  function showPage(name) {
    if (!PAGE_TITLES[name]) { name = "home"; }
    document.querySelectorAll("[data-page]").forEach(function (section) {
      section.hidden = section.getAttribute("data-page") !== name;
    });
    document.querySelectorAll("[data-link]").forEach(function (a) {
      var on = a.getAttribute("data-link") === name;
      a.classList.toggle("is-active", on);
      if (on) { a.setAttribute("aria-current", "page"); }
      else { a.removeAttribute("aria-current"); }
    });
    document.title = name === "home" ? "Loose Goose · Terre Haute" : PAGE_TITLES[name] + " · Loose Goose";
    setMenu(false);
    window.scrollTo(0, 0);
    var page = document.querySelector("[data-page='" + name + "']");
    observeReveal(page);
    var main = document.getElementById("main");
    if (main) { main.focus({ preventScroll: true }); }
    syncBar();
  }

  function initScrub() {
    var scrub = document.querySelector("[data-scrub]");
    var video = document.querySelector("[data-hero-video]");
    if (!scrub || !video) { return; }
    video.muted = true;
    video.pause();

    if (reduceMotion || saveData) {
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
    // One full pass of the clip covers two screen heights of scroll, as the hero did.
    // The same rate holds at the top of the page; further down, the clip keeps moving.
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

  function init() {
    renderShops();
    renderMenuPage();
    renderFind();
    renderContact();
    updateBottomBar();
    initMenu();
    initScrub();
    window.addEventListener("hashchange", function () { showPage(routeName()); });
    window.addEventListener("scroll", syncBar, { passive: true });
    window.addEventListener("resize", syncBar);
    if (desktop && desktop.addEventListener) {
      desktop.addEventListener("change", function () { setMenu(false); syncBar(); renderShops(); });
    }
    showPage(routeName());
    syncBar();
  }

  init();
})();
