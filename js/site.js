
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var D = window.SYNCULA || {};

  
  function $(s, c) { return (c || doc).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function fmt(n) { return n.toLocaleString("en-US"); }

  
  var LANG = "en";
  try { LANG = sessionStorage.getItem("syncula_lang") || "en"; } catch (e) {}
  function isPlaceholder(s) { return !s || s.indexOf("LAO_TEXT") === 0; }
  function L(obj) { return (LANG === "lo" && obj.lo && !isPlaceholder(obj.lo)) ? obj.lo : obj.en; }

  function renderDates() {
    var v = (LANG === "lo" && D.EFFECTIVE_DATE_LO) ? D.EFFECTIVE_DATE_LO : (D.EFFECTIVE_DATE || "");
    $all("[data-effective-date]").forEach(function (el) { el.textContent = v; });
  }
  function renderPreps() {
    (D.MATERIALS || []).forEach(function (m) {
      var el = doc.getElementById("prep-" + m.id);
      if (el) el.textContent = (LANG === "lo" && !isPlaceholder(m.prep_lo)) ? m.prep_lo : m.prep_en;
    });
  }
  function applyLang(lang) {
    LANG = lang;
    try { sessionStorage.setItem("syncula_lang", lang); } catch (e) {}
    $all("[data-lo]").forEach(function (el) {
      var lo = el.dataset.lo;
      if (isPlaceholder(lo)) return;
      if (el.dataset.enHtml === undefined) el.dataset.enHtml = el.innerHTML;
      if (lang === "lo") { el.textContent = lo; }
      else { el.innerHTML = el.dataset.enHtml; }
    });
    $all(".lang-toggle").forEach(function (b) { b.textContent = (lang === "lo" ? "EN" : "ລາວ"); });
    root.setAttribute("lang", lang === "lo" ? "lo" : "en");
    renderDates(); renderPreps();
    doc.dispatchEvent(new CustomEvent("syncula:lang"));
  }
  $all(".lang-toggle").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(LANG === "lo" ? "en" : "lo"); });
  });

  
  var revealEls = $all(".reveal");
  function showAll() { revealEls.forEach(function (el) { el.classList.add("in"); }); }
  if (REDUCED) { showAll(); }
  else {
    var pending = revealEls.slice();
    function check() {
      var vh = window.innerHeight || root.clientHeight || 800;
      pending = pending.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92) { el.classList.add("in"); return false; }
        return true;
      });
      if (!pending.length) window.removeEventListener("scroll", onScrollReveal);
    }
    var t0 = null;
    function onScrollReveal() { if (t0) return; t0 = setTimeout(function () { t0 = null; check(); }, 80); }
    window.addEventListener("scroll", onScrollReveal, { passive: true });
    check();
    setTimeout(showAll, 3000); // safety net: ห้ามมีเนื้อหาค้างซ่อนเด็ดขาด
  }

  
  var header = $(".site-header");
  var mnav = $(".mobile-nav");
  var menuBtn = $(".menu-btn");
  if (menuBtn && mnav) menuBtn.addEventListener("click", function () {
    var open = mnav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  function onScrollHeader() {
    if (header) header.classList.toggle("compact", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  
  var nav = $(".nav");
  if (nav && !REDUCED) {
    var ul = doc.createElement("span");
    ul.className = "nav-underline";
    nav.appendChild(ul);
    var current = $('.nav a[aria-current="page"]');
    function moveTo(a) {
      if (!a) { ul.style.width = "0"; return; }
      ul.style.left = a.offsetLeft + 10 + "px";
      ul.style.width = Math.max(a.offsetWidth - 20, 12) + "px";
    }
    $all("a", nav).forEach(function (a) {
      a.addEventListener("mouseenter", function () { moveTo(a); });
      a.addEventListener("focus", function () { moveTo(a); });
    });
    nav.addEventListener("mouseleave", function () { moveTo(current); });
    moveTo(current);
  }

  
  $all("[data-price-of]").forEach(function (el) {
    var m = (D.MATERIALS || []).find(function (x) { return x.id === el.dataset.priceOf; });
    if (m) el.textContent = fmt(m.price);
  });

  
  var hero = $(".hero");
  if (hero && !REDUCED && matchMedia("(min-width:900px)").matches) {
    var pieces = $all(".cutout", hero);
    hero.addEventListener("mousemove", function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5), cy = (e.clientY / window.innerHeight - 0.5);
      pieces.forEach(function (p, i) {
        var f = (i % 3 + 1) * 4;
        p.style.transform = "translate(" + (cx * f) + "px," + (cy * f) + "px) rotate(" + (p.dataset.rot || 0) + "deg)";
      });
    });
  }

  
  var drawn = $all("[data-draw]");
  var counters = $all("[data-count]");
  function inView(el, ratio) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight || 800;
    return r.top < vh * (ratio || 0.85) && r.bottom > 0;
  }
  drawn.forEach(function (p) {
    var len = 0;
    try { len = p.getTotalLength(); } catch (e) { return; }
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = REDUCED ? 0 : len;
    p.style.transition = "stroke-dashoffset 1.4s ease-out";
  });
  function runCount(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    if (REDUCED) { el.textContent = fmt(target); return; }
    var t0c = Date.now(), dur = 900;
    (function tick() {
      var k = Math.min((Date.now() - t0c) / dur, 1);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) setTimeout(tick, 24);
    })();
  }
  var t1 = null;
  function onScrollFx() {
    if (t1) return;
    t1 = setTimeout(function () {
      t1 = null;
      drawn.forEach(function (p) { if (inView(p)) p.style.strokeDashoffset = 0; });
      counters.forEach(function (el) {
        if (!el.dataset.done && inView(el)) { el.dataset.done = "1"; runCount(el); }
      });
    }, 90);
  }
  window.addEventListener("scroll", onScrollFx, { passive: true });
  setTimeout(onScrollFx, 300);

  
  var mcta = $(".mcta"), pcard = $(".pricecard");
  function onScrollCta() {
    var y = window.scrollY, vh = window.innerHeight || 800;
    var docH = doc.body.scrollHeight;
    if (mcta) mcta.classList.toggle("show", y > vh * 0.8 && y + vh < docH - 400);
    if (pcard) pcard.classList.toggle("show", y > vh * 0.9 && y < vh * 4.6);
  }
  window.addEventListener("scroll", onScrollCta, { passive: true });

  
  $all("[data-select-material]").forEach(function (a) {
    a.addEventListener("click", function () {
      try { sessionStorage.setItem("syncula_preselect", a.dataset.selectMaterial); } catch (e) {}
    });
  });

  
  var stepper = $("#stepper");
  if (stepper) {
    var state = { materials: [], volumeId: "", district: "", timeId: "", step: 1 };
    var chipsWrap = $("#matChips");
    (D.MATERIALS || []).forEach(function (m) {
      var b = doc.createElement("button");
      b.type = "button"; b.className = "chip"; b.setAttribute("aria-pressed", "false");
      b.dataset.id = m.id;
      b.innerHTML = '<img src="assets/cutouts/' + m.cutout + '.webp" alt="" width="20" height="20"> <span class="chip-label"></span>';
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") === "true";
        b.setAttribute("aria-pressed", on ? "false" : "true");
        state.materials = $all('.chip[aria-pressed="true"]', chipsWrap).map(function (c) { return c.dataset.id; });
        renderSummary(); validate(1, true);
      });
      chipsWrap.appendChild(b);
    });
    try {
      var pre = sessionStorage.getItem("syncula_preselect");
      if (pre) {
        sessionStorage.removeItem("syncula_preselect");
        var target = $('.chip[data-id="' + pre + '"]', chipsWrap);
        if (target) { target.click(); target.classList.add("shake"); }
      }
    } catch (e) {}

    var distSel = $("#district"), volSel = $("#volume"), timeSel = $("#ptime");
    (D.DISTRICTS || []).forEach(function (dd) {
      var o = doc.createElement("option"); o.value = dd.en; distSel.appendChild(o);
    });
    (D.VOLUMES || []).forEach(function (v) {
      var o = doc.createElement("option"); o.value = v.id; volSel.appendChild(o);
    });
    (D.TIMES || []).forEach(function (v) {
      var o = doc.createElement("option"); o.value = v.id; timeSel.appendChild(o);
    });

    
    function relabel() {
      $all(".chip", chipsWrap).forEach(function (c) {
        var m = D.MATERIALS.find(function (x) { return x.id === c.dataset.id; });
        if (m) $(".chip-label", c).textContent = L(m);
      });
      $all("option", distSel).forEach(function (o, i) {
        if (i > 0) o.textContent = L(D.DISTRICTS[i - 1]);
      });
      $all("option", volSel).forEach(function (o, i) {
        if (i > 0) o.textContent = L(D.VOLUMES[i - 1]);
      });
      $all("option", timeSel).forEach(function (o, i) {
        if (i > 0) o.textContent = L(D.TIMES[i - 1]);
      });
      renderSummary();
    }
    doc.addEventListener("syncula:lang", relabel);

    function matNames() {
      return state.materials.map(function (id) {
        var m = D.MATERIALS.find(function (x) { return x.id === id; });
        return m ? L(m) : id;
      });
    }
    function volLabel() { var v = (D.VOLUMES || []).find(function (x) { return x.id === state.volumeId; }); return v ? L(v) : ""; }
    function timeLabel() { var v = (D.TIMES || []).find(function (x) { return x.id === state.timeId; }); return v ? L(v) : ""; }
    function distLabel() { var v = (D.DISTRICTS || []).find(function (x) { return x.en === state.district; }); return v ? L(v) : state.district; }

    function renderSummary() {
      var s = $("#summary");
      state.volumeId = volSel.value; state.district = distSel.value; state.timeId = timeSel.value;
      var parts = matNames().map(function (n) { return '<span class="schip">' + n + "</span>"; });
      if (state.volumeId) parts.push('<span class="schip">' + volLabel() + "</span>");
      if (state.district) parts.push('<span class="schip">' + distLabel() + "</span>");
      if (state.timeId) parts.push('<span class="schip">' + timeLabel() + "</span>");
      s.innerHTML = parts.length ? parts.join("") :
        '<span class="snote">' + (LANG === "lo" ? "ຍັງບໍ່ໄດ້ເລືອກ" : "Nothing selected yet") + "</span>";
    }
    [volSel, distSel, timeSel].forEach(function (el) { el.addEventListener("change", function () { renderSummary(); validate(2, true); }); });

    function validate(step, silent) {
      var ok = true;
      if (step === 1) {
        ok = state.materials.length > 0;
        var f = $("#f-materials");
        f.classList.toggle("invalid", !ok && !silent);
        if (!ok && !silent) { chipsWrap.classList.add("shake"); setTimeout(function () { chipsWrap.classList.remove("shake"); }, 350); }
      }
      if (step === 2) {
        [["volume", volSel], ["district", distSel], ["ptime", timeSel]].forEach(function (pair) {
          var f = pair[1].closest(".field");
          var v = !!pair[1].value;
          f.classList.toggle("invalid", !v && !silent);
          if (!v) ok = false;
        });
      }
      return ok;
    }
    function go(step) {
      state.step = step;
      $all(".spanel").forEach(function (p) { p.classList.toggle("on", p.dataset.step == step); });
      $all(".stepnav span").forEach(function (s, i) { s.classList.toggle("on", i < step); });
      $("#progressBar").style.width = (step * 33.34) + "%";
      window.scrollTo({ top: stepper.offsetTop - 120, behavior: REDUCED ? "auto" : "smooth" });
    }
    $all("[data-next]").forEach(function (b) {
      b.addEventListener("click", function () { if (validate(state.step)) go(state.step + 1); });
    });
    $all("[data-back]").forEach(function (b) {
      b.addEventListener("click", function () { go(state.step - 1); });
    });

    
    function message() {
      return "ສະບາຍດີ SyncuLa\n" +
        "ຢາກໃຫ້ໄປຮັບເຄື່ອງຣີໄຊເຄິນຕາມລາຍລະອຽດລຸ່ມນີ້\n" +
        "• ວັດສະດຸ: " + matNames().join(", ") + "\n" +
        "• ປະລິມານ: " + volLabel() + "\n" +
        "• ເມືອງ: " + distLabel() + "\n" +
        "• ເວລາ: " + timeLabel() + "\n" +
        "ຂອບໃຈຫຼາຍໆ";
    }
    var wa = $("#waBtn"), ms = $("#msBtn");
    if (wa) wa.addEventListener("click", function () {
      renderSummary();
      wa.href = "https://wa.me/" + (D.WHATSAPP || "") + "?text=" + encodeURIComponent(message());
    });
    if (ms) ms.addEventListener("click", function () {
      renderSummary();
      ms.href = "https://m.me/" + (D.MESSENGER || "") + "?text=" + encodeURIComponent(message());
    });
    relabel();
  }

  
  var mq = $("#partnerTrack");
  if (mq) {
    var ok = (D.PARTNERS || []).filter(function (p) { return p.permission && p.logo; });
    if (!ok.length) {
      var fallback = $("#partnerPending");
      if (fallback) fallback.style.display = "block";
      mq.closest(".marquee").style.display = "none";
    } else {
      var html = ok.map(function (p) { return '<img class="plogo" src="' + p.logo + '" alt="' + p.name + '">'; }).join("");
      mq.innerHTML = html + html;
    }
  }

  
  var imp = $("#impactStrip");
  if (imp) {
    if (!D.IMPACT || D.IMPACT.hidden || !(D.IMPACT.stats || []).length) {
      imp.remove();
    } else {
      $("#impactStats").innerHTML = D.IMPACT.stats.map(function (s) {
        return '<div><div class="n"><span data-count="' + s.n + '">0</span> ' + s.unit + "</div><div>" + s.label_en + '</div><div class="src">' + s.src + "</div></div>";
      }).join("");
    }
  }

  
  if (LANG === "lo") { applyLang("lo"); } else { renderDates(); renderPreps(); }
})();
