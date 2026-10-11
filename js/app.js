(function () {
  "use strict";

  var DATA = window.LOOSE_GOOSE_DATA;
  if (!DATA) { return; }

  var DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  var DAY_NAMES = {
    monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
    friday: "Friday", saturday: "Saturday", sunday: "Sunday"
  };
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

  function h12(hhmm) {
    var p = hhmm.split(":");
    var h = parseInt(p[0], 10);
    return ((h % 12) || 12) + ":" + p[1] + " " + (h < 12 ? "AM" : "PM");
  }

  function toMinutes(hhmm) {
    var p = hhmm.split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function townNow(date) {
    var parts = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: DATA.timeZone, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
    return {
      day: parts.weekday.toLowerCase(),
      minutes: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10)
    };
  }

  function statusFor(shop, date) {
    if (!shop.hours) { return null; }
    var now = townNow(date || new Date());
    var today = shop.hours.week[now.day];
    if (today === "closed") { return { kind: "closed", text: "Closed today" }; }
    var open = toMinutes(today.open);
    var close = toMinutes(today.close);
    if (now.minutes >= open && now.minutes < close) {
      return { kind: "open", text: "Open now · closes " + h12(today.close) };
    }
    if (now.minutes < open) {
      return { kind: "closed", text: "Closed now · opens " + h12(today.open) };
    }
    return { kind: "closed", text: "Closed now" };
  }

  function dayText(v) {
    if (v === "closed") { return "Closed"; }
    return h12(v.open) + " to " + h12(v.close);
  }

  function statusNode(st) {
    var wrap = el("p", "status " + st.kind);
    wrap.appendChild(el("span", "dot"));
    wrap.appendChild(el("span", "status-text", st.text));
    return wrap;
  }

  function pillRow(items, cls) {
    var row = el("ul", "pill-row" + (cls ? " " + cls : ""));
    items.forEach(function (t) { row.appendChild(el("li", "tag", t)); });
    return row;
  }

  function hoursTable(shop) {
    var table = el("table", "hours");
    var body = el("tbody");
    var now = townNow(new Date());
    DAYS.forEach(function (d) {
      var tr = el("tr");
      if (d === now.day) { tr.className = "today"; }
      var th = el("th", null, DAY_NAMES[d]);
      th.scope = "row";
      tr.appendChild(th);
      tr.appendChild(el("td", null, dayText(shop.hours.week[d])));
      body.appendChild(tr);
    });
    table.appendChild(body);
    return table;
  }

  function shopCard(shop) {
    var card = el("article", "shop glass reveal");
    card.setAttribute("data-card", shop.id);
    card.setAttribute("aria-labelledby", "name-" + shop.id);
    var h = el("h2", "shop-name", shop.name);
    h.id = "name-" + shop.id;
    card.appendChild(h);
    var st = statusFor(shop);
    if (st) { card.appendChild(statusNode(st)); }
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
    if (!shop.hours) {
      var fb = el("a", "btn btn-glass", "Facebook page");
      fb.href = DATA.links.facebook;
      fb.target = "_blank";
      fb.rel = "noopener";
      actions.appendChild(fb);
    }
    card.appendChild(actions);
    if (shop.hours) {
      var det = el("details", "hours-details");
      det.appendChild(el("summary", "pill-sm", "All hours"));
      det.appendChild(hoursTable(shop));
      card.appendChild(det);
    }
    return card;
  }

  function observeReveal(root) {
    var nodes = (root || document).querySelectorAll(".reveal:not(.is-in)");
    nodes.forEach(function (n) {
      if (!revealIO || reduceMotion || saveData) { n.classList.add("is-in"); }
      else { revealIO.observe(n); }
    });
  }

  var revealIO = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 }) : null;

  function renderShops() {
    var first = document.querySelector("[data-shops-first]");
    var after = document.querySelector("[data-shops-after]");
    if (!first || !after) { return; }
    first.textContent = "";
    after.textContent = "";
    var deskNow = desktop && desktop.matches;
    DATA.shops.forEach(function (shop, i) {
      var card = shopCard(shop);
      if (!deskNow && i === 0) { first.appendChild(card); }
      else { after.appendChild(card); }
    });
    observeReveal(document);
  }

  function renderMenuCards(target) {
    target.textContent = "";
    DATA.menu.forEach(function (cat) {
      var card = el("section", "block glass reveal");
      card.setAttribute("aria-labelledby", "menu-" + cat.id);
      var h = el("h3", "block-title", cat.name);
      h.id = "menu-" + cat.id;
      card.appendChild(h);
      card.appendChild(pillRow(cat.items, "pill-row-menu"));
      target.appendChild(card);
    });
  }

  function renderMenuPage() {
    var list = document.querySelector("[data-menu-list]");
    if (list) { renderMenuCards(list); }
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

  function renderContact() {
    var box = document.querySelector("[data-contact-list]");
    if (!box) { return; }
    box.textContent = "";
    var call = el("section", "block glass reveal");
    call.appendChild(el("h2", "block-title", "Call"));
    var south = shopById("south");
    call.appendChild(el("p", "shop-line", south.name + ", " + addressText(south)));
    var actions = el("div", "actions");
    var tel = el("a", "btn btn-primary", "Call " + south.phone.display);
    tel.href = telHref(south);
    actions.appendChild(tel);
    actions.appendChild(el("a", "btn btn-glass", "Directions"));
    actions.lastChild.href = directionsHref(south);
    actions.lastChild.target = "_blank";
    actions.lastChild.rel = "noopener";
    call.appendChild(actions);
    box.appendChild(call);

    var north = shopById("north");
    var visit = el("section", "block glass reveal");
    visit.appendChild(el("h2", "block-title", "North shop"));
    visit.appendChild(el("p", "shop-line", north.name + ", " + addressText(north)));
    visit.appendChild(pillRow(north.tags));
    var nActions = el("div", "actions");
    var nGo = el("a", "btn btn-glass", "Directions");
    nGo.href = directionsHref(north);
    nGo.target = "_blank";
    nGo.rel = "noopener";
    nActions.appendChild(nGo);
    var nFb = el("a", "btn btn-glass", "Facebook page");
    nFb.href = DATA.links.facebook;
    nFb.target = "_blank";
    nFb.rel = "noopener";
    nActions.appendChild(nFb);
    visit.appendChild(nActions);
    box.appendChild(visit);

    var online = el("section", "block glass reveal");
    online.appendChild(el("h2", "block-title", "Online"));
    var oActions = el("div", "actions");
    [["Facebook page", DATA.links.facebook], ["Yelp reviews", DATA.links.yelp], ["Google reviews", DATA.links.googleReviews]].forEach(function (pair) {
      var a = el("a", "btn btn-glass", pair[0]);
      a.href = pair[1];
      a.target = "_blank";
      a.rel = "noopener";
      oActions.appendChild(a);
    });
    online.appendChild(oActions);
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
    var saveData = !!(navigator.connection && navigator.connection.saveData);
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
    function progress() {
      var span = scrub.offsetHeight - window.innerHeight;
      if (span <= 0) { return 0; }
      var p = -scrub.getBoundingClientRect().top / span;
      return p < 0 ? 0 : (p > 1 ? 1 : p);
    }
    function draw() {
      queued = false;
      if (!ready || !isFinite(video.duration) || video.duration <= 0) { return; }
      if (video.seeking) { pending = true; return; }
      var p = progress();
      if (Math.abs(p - last) < 0.0005) { return; }
      last = p;
      video.currentTime = Math.max(0, Math.min(p * video.duration, video.duration - 0.04));
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
