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
  var desktop = window.matchMedia ? window.matchMedia("(min-width: 820px)") : null;
  var selectedId = DATA.shops[0].id;
  var barShown = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined && text !== null) { n.textContent = text; }
    return n;
  }

  function ph(text) { return el("span", "placeholder", "[" + text + "]"); }

  function tag(text) { return el("span", "tag", text || "to be confirmed"); }

  function fill(node, parts) {
    node.textContent = "";
    parts.forEach(function (p) {
      if (p === null || p === undefined || p === false) { return; }
      node.appendChild(typeof p === "string" ? document.createTextNode(p) : p);
    });
    return node;
  }

  function shopById(id) {
    return DATA.shops.filter(function (s) { return s.id === id; })[0];
  }

  function selectedShop() { return shopById(selectedId) || DATA.shops[0]; }

  function addressText(s) { return s.address.line1 + ", " + s.address.line2; }

  function mapsSearch(s) {
    return "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(s.name + ", " + addressText(s));
  }

  function mapsDirections(s) {
    return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(addressText(s));
  }

  function telHref(s) { return s.phone.tel ? "tel:" + s.phone.tel : null; }

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

  function estadoSede(shop, date) {
    var now = townNow(date || new Date());
    var today = shop.hours.week[now.day];
    var base = { day: now.day, today: today };
    if (!shop.hours.confirmed || today === null || today === undefined) {
      return Object.assign(base, { kind: "pending", text: "Hours to be confirmed" });
    }
    if (today === "closed") {
      return Object.assign(base, { kind: "closed", text: "Closed today" });
    }
    var open = toMinutes(today.open);
    var close = toMinutes(today.close);
    if (now.minutes >= open && now.minutes < close) {
      return Object.assign(base, { kind: "open", text: "Open now · closes " + h12(today.close) });
    }
    if (now.minutes < open) {
      return Object.assign(base, { kind: "closed", text: "Closed now · opens " + h12(today.open) });
    }
    return Object.assign(base, { kind: "closed", text: "Closed now" });
  }

  function dayText(v) {
    if (v === null || v === undefined) { return null; }
    if (v === "closed") { return "Closed"; }
    return h12(v.open) + " to " + h12(v.close);
  }

  function statusNode(est) {
    var wrap = el("p", "status " + (est.kind === "pending" ? "pending" : est.kind));
    wrap.appendChild(el("span", "dot"));
    wrap.appendChild(el("span", "status-text", est.text));
    return wrap;
  }

  function row(label, valueParts) {
    var r = el("div", "row");
    r.appendChild(el("span", "k", label));
    r.appendChild(fill(el("div", "v"), valueParts));
    return r;
  }

  function phoneParts(shop, withTag) {
    if (!shop.phone.display) { return [ph("phone to be confirmed")]; }
    var a = el("a", null, shop.phone.display);
    a.href = telHref(shop);
    return [a, withTag && !shop.phone.confirmed ? tag() : null];
  }

  function callLink(shop, cls) {
    var a = el("a", cls);
    if (shop.phone.tel) {
      a.href = telHref(shop);
      a.textContent = "Call";
    } else {
      a.textContent = "Call · to be confirmed";
      a.setAttribute("aria-disabled", "true");
      a.classList.add("is-off");
    }
    return a;
  }

  function unconfirmedNote(shop) {
    var items = [];
    if (!shop.address.confirmed) { items.push("address"); }
    if (!shop.phone.display || !shop.phone.confirmed) { items.push("phone number"); }
    if (shop.service && !shop.service.confirmed) { items.push("service (" + shop.service.text.toLowerCase() + ")"); }
    if (!shop.hours.confirmed) { items.push("hours"); }
    if (!items.length) { return null; }
    var last = items[items.length - 1];
    var list = items.length === 1 ? items[0] : items.length === 2 ? items[0] + " and " + last : items.slice(0, -1).join(", ") + ", and " + last;
    var text = "To be confirmed: " + list + ".";
    if (!shop.hours.confirmed) { text += " Hours shown are samples."; }
    return el("p", "card-note", text);
  }

  function hoursRow(shop, est) {
    var text = dayText(est.today);
    var value;
    if (text === null) {
      value = [ph("hours to be confirmed")];
    } else {
      value = [el("span", "draw-line", text)];

    }
    return row("Today, " + DAY_NAMES[est.day], value);
  }

  function shopCard(shop) {
    var card = el("article", "shop");
    card.setAttribute("data-card", shop.id);
    card.setAttribute("aria-labelledby", "name-" + shop.id);

    var head = el("div", "shop-head");
    var h = el("h2", "shop-name", shop.name);
    h.id = "name-" + shop.id;
    var pick = el("button", "pick");
    pick.type = "button";
    pick.className = "pick";
    pick.appendChild(el("span", "pick-text"));
    pick.appendChild(el("span", "sr-only", " " + shop.name));
    pick.addEventListener("click", function () { selectShop(shop.id); });
    head.appendChild(h);
    head.appendChild(pick);
    card.appendChild(head);

    var est = estadoSede(shop);
    card.appendChild(statusNode(est));
    card.appendChild(row("Address", [addressText(shop)]));
    card.appendChild(hoursRow(shop, est));
    card.appendChild(row("Phone", phoneParts(shop)));
    if (shop.service) {
      card.appendChild(row("Service", [shop.service.text]));
    }

    var note = unconfirmedNote(shop);
    if (note) { card.appendChild(note); }
    var actions = el("div", "actions");
    actions.appendChild(callLink(shop, "btn btn-primary"));
    var go = el("a", "btn btn-secondary", "Get directions");
    go.href = mapsDirections(shop);
    actions.appendChild(go);
    card.appendChild(actions);
    return card;
  }

  function refreshSelection() {
    document.querySelectorAll("[data-card]").forEach(function (card) {
      var on = card.getAttribute("data-card") === selectedId;
      card.classList.toggle("is-selected", on);
      var pick = card.querySelector(".pick");
      pick.setAttribute("aria-pressed", on ? "true" : "false");
      pick.querySelector(".pick-text").textContent = on ? "Selected" : "Select";
    });
  }

  function updateBottomBar() {
    var s = selectedShop();
    var call = document.querySelector("[data-bb-call]");
    var callSub = document.querySelector("[data-bb-call-sub]");
    var map = document.querySelector("[data-bb-map]");
    var mapSub = document.querySelector("[data-bb-map-sub]");
    if (s.phone.tel) {
      call.href = telHref(s);
      call.removeAttribute("aria-disabled");
      call.classList.remove("is-off");
      callSub.textContent = s.shortName;
    } else {
      call.removeAttribute("href");
      call.setAttribute("aria-disabled", "true");
      call.classList.add("is-off");
      callSub.textContent = "to be confirmed";
    }
    map.href = mapsDirections(s);
    mapSub.textContent = s.shortName;
  }

  function selectShop(id) {
    selectedId = id;
    refreshSelection();
    updateBottomBar();
  }

  function observeDraws(root) {
    var nodes = (root || document).querySelectorAll(".draw-line:not(.in-view)");
    if (!nodes.length) { return; }
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("in-view"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function renderShops() {
    var box = document.querySelector("[data-shops]");
    box.textContent = "";
    DATA.shops.forEach(function (shop) { box.appendChild(shopCard(shop)); });
    refreshSelection();
    updateBottomBar();
  }

  function menuRow(cat, item) {
    var li = el("li", "menu-row");
    var name = item.name ? el("span", "item-name", item.name) : fill(el("span", "item-name"), [ph(cat.id === "goose-juice" ? "flavor to be confirmed" : "name to be confirmed")]);
    var price = fill(el("span", "item-price"), [ph("price to be confirmed")]);
    li.appendChild(name);
    li.appendChild(price);
    return li;
  }

  function renderFeatured() {
    var list = document.querySelector("[data-featured]");
    list.textContent = "";
    DATA.menu.categories.forEach(function (cat) {
      cat.items.forEach(function (item) {
        if (item.featured) { list.appendChild(menuRow(cat, item)); }
      });
    });
  }

  function renderMenu() {
    var jump = document.querySelector("[data-menu-jump]");
    var list = document.querySelector("[data-menu-list]");
    jump.textContent = "";
    list.textContent = "";
    DATA.menu.categories.forEach(function (cat) {
      var chip = el("button", "chip", cat.name);
      chip.type = "button";
      chip.addEventListener("click", function () {
        var target = document.getElementById("cat-" + cat.id);
        if (target) { target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); }
      });
      jump.appendChild(chip);

      var section = el("section", "menu-cat");
      section.id = "cat-" + cat.id;
      section.setAttribute("aria-labelledby", "h-" + cat.id);
      var title = el("h2", "menu-cat-title", cat.name);
      title.id = "h-" + cat.id;
      section.appendChild(title);
      var ul = el("ul", "menu-list");
      cat.items.forEach(function (item) { ul.appendChild(menuRow(cat, item)); });
      section.appendChild(ul);
      list.appendChild(section);
    });
  }

  function hoursTable(shop, est) {
    var table = el("table", "hours");
    var caption = el("caption", null, shop.hours.confirmed ? "Hours" : "Sample hours, to be confirmed");
    table.appendChild(caption);
    var body = el("tbody");
    DAYS.forEach(function (d) {
      var tr = el("tr");
      if (d === est.day) { tr.className = "today"; }
      var th = el("th", null, DAY_NAMES[d]);
      th.scope = "row";
      var td = el("td");
      var text = dayText(shop.hours.week[d]);
      if (text === null) {
        td.appendChild(ph("hours to be confirmed"));
      } else {
        td.appendChild(el("span", d === est.day ? "draw-line" : null, text));
      }
      tr.appendChild(th);
      tr.appendChild(td);
      body.appendChild(tr);
    });
    table.appendChild(body);
    return table;
  }

  function findBlock(shop) {
    var section = el("section", "site-block shop-find");
    section.setAttribute("aria-labelledby", "find-" + shop.id);
    var h = el("h2", "shop-name", shop.name);
    h.id = "find-" + shop.id;
    section.appendChild(h);

    var est = estadoSede(shop);
    section.appendChild(statusNode(est));
    section.appendChild(row("Address", [addressText(shop)]));
    section.appendChild(row("Phone", phoneParts(shop)));
    if (shop.service) {
      section.appendChild(row("Service", [shop.service.text]));
    }
    section.appendChild(row("Entrance", [shop.entrance || ph("entrance directions to be confirmed")]));

    var photo = el("figure", "photo-ph");
    photo.setAttribute("role", "img");
    photo.setAttribute("aria-label", "Photo placeholder: " + shop.shortName + " entrance, to be provided");
    photo.appendChild(el("span", "photo-ph-title", "Photo placeholder"));
    photo.appendChild(el("span", "photo-ph-text", shop.shortName + " entrance, to be provided"));
    section.appendChild(photo);

    section.appendChild(hoursTable(shop, est));

    var findNote = unconfirmedNote(shop);
    if (findNote) { section.appendChild(findNote); }
    var actions = el("div", "actions");
    var search = el("a", "btn btn-primary", "Search on Google Maps");
    search.href = mapsSearch(shop);
    search.target = "_blank";
    search.rel = "noopener";
    actions.appendChild(search);
    actions.appendChild(callLink(shop, "btn btn-secondary"));
    section.appendChild(actions);
    return section;
  }

  function renderFind() {
    var list = document.querySelector("[data-find-list]");
    list.textContent = "";
    var grid = el("div", "find-grid");
    DATA.shops.forEach(function (shop) { grid.appendChild(findBlock(shop)); });
    list.appendChild(grid);
  }

  function renderFooterAndContact() {
    var footList = document.querySelector("[data-foot-shops]");
    footList.textContent = "";
    DATA.shops.forEach(function (shop) {
      var li = el("li");
      fill(li, [el("strong", null, shop.name), el("br"), addressText(shop), shop.address.confirmed ? null : " ", shop.address.confirmed ? null : tag()]);
      footList.appendChild(li);
    });

    var phones = document.querySelector("[data-contact-phones]");
    phones.textContent = "";
    DATA.shops.forEach(function (shop) {
      var li = el("li");
      fill(li, [el("strong", null, shop.name + ": ")].concat(phoneParts(shop, true)));
      phones.appendChild(li);
    });

    var F = DATA.footer;
    var C = DATA.contact;
    var slots = {
      story: [DATA.story, "story to be written with the owner"],
      mainPhone: [C.mainPhone, "main phone to be confirmed"],
      email: [C.email, "email to be confirmed"],
      legalName: [F.legalName, "legal name to be confirmed"],
      facebook: [F.facebook, "official page to be confirmed"],
      instagram: [F.instagram, "to be confirmed"],
      privacyPolicy: [F.privacyPolicy, "to be confirmed"],
      termsOfUse: [F.termsOfUse, "to be confirmed"],
      accessibilityStatement: [F.accessibilityStatement, "to be confirmed"],
      copyright: [F.copyright, "year and legal owner to be confirmed"]
    };
    document.querySelectorAll("[data-fill]").forEach(function (node) {
      var pair = slots[node.getAttribute("data-fill")];
      if (!pair) { return; }
      fill(node, [pair[0] ? pair[0] : ph(pair[1])]);
    });
  }

  function showPage(name) {
    if (!PAGE_TITLES[name]) { name = "home"; }
    document.querySelectorAll("[data-page]").forEach(function (section) {
      section.hidden = section.getAttribute("data-page") !== name;
    });
    document.querySelectorAll("[data-link]").forEach(function (a) {
      if (a.getAttribute("data-link") === name) { a.setAttribute("aria-current", "page"); }
      else { a.removeAttribute("aria-current"); }
    });
    document.title = PAGE_TITLES[name] + " · Loose Goose demo";
    setMenu(false);
    window.scrollTo(0, 0);
    var page = document.querySelector("[data-page='" + name + "']");
    observeDraws(page);
    var main = document.getElementById("main");
    if (main) { main.focus({ preventScroll: true }); }
    syncBar();
  }

  function routeName() {
    var key = (location.hash || "").replace(/^#\/?/, "");
    return key === "" ? "home" : key;
  }

  var menuBtn = document.querySelector("[data-menu-btn]");
  var nav = document.querySelector("[data-nav]");
  var menuLabel = document.querySelector("[data-menu-label]");

  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuLabel.textContent = open ? "Close" : "Menu";
  }

  function syncBar() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (y > 300) { barShown = true; }
    else if (y < 80) { barShown = false; }
    var isPhone = !(desktop && desktop.matches);
    var show = barShown && isPhone;
    var bar = document.querySelector("[data-bottom]");
    bar.classList.toggle("is-shown", show);
    bar.toggleAttribute("inert", !show);
  }

  function initMenu() {
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
    if (desktop && desktop.addEventListener) {
      desktop.addEventListener("change", function () { setMenu(false); syncBar(); });
    }
  }

  var form = document.querySelector("[data-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      document.querySelector("[data-form-status]").textContent =
        "Demo only. This form does not send messages yet, so nothing was sent.";
    });
  }

  function initHeroVideo() {
    var video = document.querySelector("[data-hero-video]");
    if (!video) { return; }
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    if (reduceMotion || saveData) { video.remove(); return; }
    video.muted = true;
    var started = video.play();
    if (started && typeof started.catch === "function") {
      started.catch(function () { video.remove(); });
    }
    document.addEventListener("visibilitychange", function () {
      if (!video.isConnected) { return; }
      if (document.hidden) { video.pause(); }
      else { var again = video.play(); if (again && again.catch) { again.catch(function () {}); } }
    });
  }

  function init() {
    renderShops();
    renderFeatured();
    renderMenu();
    renderFind();
    renderFooterAndContact();
    initHeroVideo();
    initMenu();
    window.addEventListener("hashchange", function () { showPage(routeName()); });
    window.addEventListener("scroll", syncBar, { passive: true });
    window.addEventListener("resize", syncBar);
    showPage(routeName());
    observeDraws(document);
  }

  init();

  window.LooseGoose = { estadoSede: estadoSede, townNow: townNow, selectShop: selectShop };
})();
