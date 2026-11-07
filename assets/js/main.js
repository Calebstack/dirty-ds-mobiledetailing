/* =========================================================================
   Dirty D's Mobile RV Detailing - main script
   Sections: 01 helpers · 02 page chrome · 03 reveal + counters + bubbles
             04 tabs · 05 pricing + estimators · 06 booking form
             07 gallery filter + lightbox · 08 facebook reels · 09 reviews
   ========================================================================= */
(function () {
  'use strict';

  /* 01 helpers ------------------------------------------------------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var DD = window.DD || null;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var safe = function (fn) { try { return fn(); } catch (e) { if (window.console) console.warn(e); } };

  /* 02 page chrome: header, drawer, progress, back-to-top ----------- */
  safe(function () {
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

    var header = $('#siteHeader'), progress = $('#progress'), toTop = $('#toTop');
    function onScroll() {
      var st = window.pageYOffset || document.documentElement.scrollTop;
      if (header) header.classList.toggle('is-scrolled', st > 8);
      if (toTop) toTop.classList.toggle('is-on', st > 700);
      if (progress) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? Math.min(100, st / h * 100) : 0) + '%';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

    var toggle = $('#navToggle'), drawer = $('#drawer');
    if (toggle && drawer) {
      var setOpen = function (open) {
        drawer.classList.toggle('is-open', open);
        drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('menu-open', open);
        if (open) { var f = $('a', drawer); if (f) setTimeout(function () { f.focus(); }, 120); }
      };
      toggle.addEventListener('click', function () { setOpen(!drawer.classList.contains('is-open')); });
      $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
      });
      window.addEventListener('resize', function () { if (window.innerWidth > 960) setOpen(false); });
      drawer.setAttribute('aria-hidden', 'true');
    }

    // services page: highlight the sub-nav link of the section in view
    var sub = $$('.subnav a');
    if (sub.length && 'IntersectionObserver' in window) {
      var map = {};
      sub.forEach(function (a) { var id = a.getAttribute('href').slice(1); var el = document.getElementById(id); if (el) map[id] = a; });
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { sub.forEach(function (a) { a.classList.remove('is-on'); }); map[e.target.id].classList.add('is-on'); } });
      }, { rootMargin: '-35% 0px -55% 0px' });
      Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
    }
  });

  /* 03 reveal, counters, bubbles ------------------------------------ */
  safe(function () {
    document.documentElement.classList.add('js');
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); }
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      els.forEach(function (e, i) { e.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(e); });
    }

    // animated numbers
    $$('[data-count]').forEach(function (el) {
      var target = +el.getAttribute('data-count'), suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion || !('IntersectionObserver' in window)) { el.textContent = target + suffix; return; }
      el.textContent = '0' + suffix;
      var co = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; co.disconnect();
        var t0 = performance.now(), dur = 1300;
        (function tick(t) {
          var p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }, { threshold: 0.6 });
      co.observe(el);
    });

    // soap bubbles
    if (!reduceMotion) {
      $$('[data-bubbles]').forEach(function (box) {
        var n = +box.getAttribute('data-bubbles') || 12;
        if (window.innerWidth < 640) n = Math.ceil(n * 0.55);
        for (var i = 0; i < n; i++) {
          var b = document.createElement('span'), s = 10 + Math.random() * 46;
          b.className = 'bubble';
          b.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (Math.random() * 100) + '%;--dur:' + (11 + Math.random() * 14) + 's;--delay:-' + (Math.random() * 20) + 's;--sway:' + (Math.random() * 60 - 30) + 'px';
          box.appendChild(b);
        }
      });
    }
  });

  /* 04 tabs ---------------------------------------------------------- */
  safe(function () {
    $$('[data-tabs]').forEach(function (root) {
      var tabs = $$('[role="tab"]', root), panels = $$('[role="tabpanel"]', root);
      function show(i, focus) {
        tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1; });
        panels.forEach(function (p, j) { p.hidden = j !== i; });
        if (focus) tabs[i].focus();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { show(i); });
        t.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show((i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true); }
        });
      });
      if (location.hash === '#interior') show(1);
    });
  });

  /* 05 pricing + estimators ----------------------------------------- */
  function findPkg(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  // o: { len, ext, int, slides, toppers, awnings }
  function estimate(o) {
    var lines = [], low = 0, high = 0, len = Math.max(0, +o.len || 0);
    if (!DD) return { lines: lines, low: 0, high: 0 };
    var e = o.ext && findPkg(DD.exterior, o.ext), i = o.int && findPkg(DD.interior, o.int);
    if (e && len) { var a = e.rate * len; low += a; high += a; lines.push([e.short + ' (' + len + ' ft × $' + e.rate + ')', money(a)]); }
    if (i && len) { var b = i.rate * len; low += b; high += b; lines.push([i.short + ' (' + len + ' ft × $' + i.rate + ')', money(b)]); }
    var sl = Math.max(0, +o.slides || 0), tp = Math.max(0, +o.toppers || 0), aw = Math.max(0, +o.awnings || 0);
    if (sl) { low += sl * 25; high += sl * 25; lines.push(['Slide-outs (' + sl + ' × $25)', money(sl * 25)]); }
    if (tp) { low += tp * 50; high += tp * 50; lines.push(['Slide-outs with topper (' + tp + ' × $50)', money(tp * 50)]); }
    if (aw) { low += aw * 50; high += aw * 100; lines.push(['Awnings (' + aw + ' × $50 - $100)', money(aw * 50) + ' - ' + money(aw * 100)]); }
    return { lines: lines, low: low, high: high };
  }
  function totalText(r) { return r.low === r.high ? money(r.low) : money(r.low) + ' - ' + money(r.high); }
  function bookingHref(o) {
    var q = [];
    if (o.ext) q.push('ext=' + encodeURIComponent(o.ext));
    if (o.int) q.push('int=' + encodeURIComponent(o.int));
    if (o.len) q.push('len=' + encodeURIComponent(o.len));
    if (o.slides) q.push('slides=' + encodeURIComponent(o.slides));
    if (o.toppers) q.push('toppers=' + encodeURIComponent(o.toppers));
    if (o.awnings) q.push('awnings=' + encodeURIComponent(o.awnings));
    return 'booking.html' + (q.length ? '?' + q.join('&') : '') + '#book';
  }
  window.DDPricing = { estimate: estimate, totalText: totalText, bookingHref: bookingHref, money: money };

  safe(function () {
    // hero quick price check
    var q = $('[data-quote]');
    if (q && DD) {
      var get = function (k) { return $('[data-q="' + k + '"]', q); };
      var out = $('[data-q-total]', q), book = $('[data-q-book]', q);
      var update = function () {
        var o = { len: get('len').value, ext: get('ext').value, int: get('int').value };
        var r = estimate(o);
        out.textContent = (o.ext || o.int) && o.len ? totalText(r) : '$0';
        book.setAttribute('href', bookingHref(o));
      };
      ['len', 'ext', 'int'].forEach(function (k) { get(k).addEventListener('input', update); get(k).addEventListener('change', update); });
      update();
    }

    // services page estimator
    var est = $('[data-estimator]');
    if (est && DD) {
      var g = function (k) { return $('[data-e="' + k + '"]', est); };
      var lines = $('[data-e-lines]', est), tot = $('[data-e-total]', est), eb = $('[data-e-book]', est);
      var upd = function () {
        var o = { len: g('len').value, ext: g('ext').value, int: g('int').value, slides: g('slides').value, toppers: g('toppers').value, awnings: g('awnings').value };
        var r = estimate(o);
        lines.innerHTML = r.lines.length ? r.lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>'; }).join('') : '<li class="empty">Choose a package to see your estimate.</li>';
        tot.textContent = totalText(r);
        eb.setAttribute('href', bookingHref(o));
      };
      $$('[data-e]', est).forEach(function (el) { el.addEventListener('input', upd); el.addEventListener('change', upd); });
      est.addEventListener('submit', function (e) { e.preventDefault(); });
      upd();
    }
  });

  /* 06 booking form -------------------------------------------------- */
  safe(function () {
    var form = $('#bookingForm');
    if (!form || !DD) return;
    var f = function (n) { return form.elements[n]; };
    var next = $('#formSubmitNext'); if (next) next.value = new URL('success.html', window.location.href).href;

    var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    var iso = today.toISOString().slice(0, 10);
    ['date', 'backupDate'].forEach(function (n) { if (f(n)) f(n).min = iso; });

    // prefill from estimator / package buttons / chat
    var p = new URLSearchParams(window.location.search);
    function setRadio(name, val) { $$('input[name="' + name + '"]', form).forEach(function (r) { r.checked = r.value === (val || ''); }); }
    if (p.get('ext')) setRadio('exteriorPackage', p.get('ext'));
    if (p.get('int')) setRadio('interiorPackage', p.get('int'));
    if (p.get('len')) f('rvLength').value = p.get('len');
    var sl = +p.get('slides') || 0, tp = +p.get('toppers') || 0, aw = +p.get('awnings') || 0;
    if (sl || tp) { f('slideOuts').value = sl + tp; f('slideOutToppers').value = tp; }
    if (aw) f('standaloneAwnings').value = aw;
    var tick = function (id) { var c = $('[data-addon="' + id + '"]', form); if (c) c.checked = true; };
    if (sl) tick('slide'); if (tp) tick('slidetopper'); if (aw) tick('awning');

    var sLines = $('[data-s-lines]'), sTotal = $('[data-s-total]');
    function state() {
      var slideOuts = +f('slideOuts').value || 0, toppers = +f('slideOutToppers').value || 0;
      return {
        len: f('rvLength').value, ext: $('input[name="exteriorPackage"]:checked', form).value, int: $('input[name="interiorPackage"]:checked', form).value,
        slides: $('[data-addon="slide"]', form).checked ? Math.max(0, slideOuts - toppers) : 0,
        toppers: $('[data-addon="slidetopper"]', form).checked ? toppers : 0,
        awnings: $('[data-addon="awning"]', form).checked ? (+f('standaloneAwnings').value || 0) : 0
      };
    }
    function summary() {
      var o = state(), r = estimate(o), picked = [];
      var quoteOnly = $$('[data-addon]:checked', form).filter(function (c) { var a = findPkg(DD.addons, c.getAttribute('data-addon')); return a && a.kind === 'quote'; });
      if ((o.ext || o.int) && !o.len) r.lines.push(['Enter your RV length to price your packages', '']);
      quoteOnly.forEach(function (c) { r.lines.push([c.value, 'quote']); });
      sLines.innerHTML = r.lines.length ? r.lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>'; }).join('') : '<li class="empty">Pick a package to see a starting price.</li>';
      sTotal.textContent = totalText(r);
      return { o: o, r: r, quoteOnly: quoteOnly };
    }
    form.addEventListener('input', summary); form.addEventListener('change', summary); summary();

    var btn = $('#submitBtn'), label = btn.textContent;
    window.addEventListener('pageshow', function () { btn.disabled = false; btn.textContent = label; });
    form.addEventListener('submit', function (e) {
      var s = summary(), o = s.o, parts = [];
      var addons = $$('[data-addon]:checked', form).map(function (c) { return c.value; });
      if (!o.ext && !o.int && !addons.length && !f('notes').value.trim()) {
        e.preventDefault();
        var st = $('.form-status', form) || document.createElement('p');
        st.className = 'form-status'; st.setAttribute('role', 'alert');
        st.textContent = 'Choose at least one package or add-on, or tell us what you need in the notes.';
        btn.parentNode.insertBefore(st, btn); $('#packagesField').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      var ep = o.ext && findPkg(DD.exterior, o.ext), ip = o.int && findPkg(DD.interior, o.int);
      if (ep) parts.push('Exterior: ' + ep.name + ' ($' + ep.rate + '/ft)');
      if (ip) parts.push('Interior: ' + ip.name + ' ($' + ip.rate + '/ft)');
      if (addons.length) parts.push('Add-ons: ' + addons.join(', '));
      $('#serviceSummary').value = parts.join(' | ') || 'See notes';
      $('#estimateField').value = (s.r.low || s.r.high) ? totalText(s.r) + ' (estimate, quote-only items excluded)' : 'No estimate';
      btn.disabled = true; btn.textContent = 'Sending your request...';
    });

    if (location.hash === '#addons') setTimeout(function () { var a = $('#addons'); if (a) a.scrollIntoView({ block: 'center' }); }, 200);
  });

  /* 07 gallery filter + lightbox ------------------------------------ */
  safe(function () {
    var grid = $('#gGrid'), lb = $('#lightbox');
    if (!lb) return;
    var img = $('#lbImg'), cap = $('#lbCap'), list = [], idx = 0, opener = null;

    var chips = $$('[data-filter]');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var key = c.getAttribute('data-filter');
        chips.forEach(function (x) { var on = x === c; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        $$('.g-item', grid).forEach(function (it) { it.hidden = !(key === 'all' || it.getAttribute('data-cat') === key); });
      });
    });

    function show(i) {
      idx = (i + list.length) % list.length;
      var a = list[idx];
      img.src = a.getAttribute('href'); img.alt = a.getAttribute('data-caption') || '';
      cap.textContent = (a.getAttribute('data-caption') || '') + '  (' + (idx + 1) + ' of ' + list.length + ')';
    }
    function open(a) {
      list = $$('.g-item', grid).filter(function (x) { return !x.hidden; });
      idx = list.indexOf(a); opener = a; show(idx);
      lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus();
    }
    function close() { lb.hidden = true; document.body.style.overflow = ''; img.src = ''; if (opener) opener.focus(); }
    if (grid) grid.addEventListener('click', function (e) {
      var a = e.target.closest('.g-item'); if (!a) return; e.preventDefault(); open(a);
    });
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { show(idx - 1); });
    $('#lbNext').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(idx - 1); else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Tab') { var f = [$('#lbClose'), $('#lbPrev'), $('#lbNext')], i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? 2 : 1)) % 3].focus(); }
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); x0 = null; });
  });

  /* 08 video sound controls + Facebook reels ------------------------- */
  safe(function () {
    $$('.video-sound-toggle').forEach(function (button) {
      var video = button.parentElement.querySelector('video');
      if (!video) return;
      button.addEventListener('click', function () {
        video.muted = !video.muted;
        var unmuted = !video.muted;
        button.setAttribute('aria-pressed', String(unmuted));
        button.setAttribute('aria-label', (unmuted ? 'Mute sound for ' : 'Unmute sound for ') + video.getAttribute('aria-label'));
        button.lastElementChild.textContent = unmuted ? 'Mute' : 'Unmute';
      });
    });
  });

  /* Open public Facebook reels directly; share-link embeds can fail. */
  safe(function () {
    $$('[data-reel]').forEach(function (box) {
      var poster = $('.reel__poster', box);
      if (!poster) return;
      poster.addEventListener('click', function () {
        var url = box.getAttribute('data-reel');
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    });
  });

  /* 09 reviews (data lives in reviews-data.js) ----------------------- */
  safe(function () {
    var R = (window.DD_REVIEWS || []).filter(function (r) { return r && r.text; });
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var stars = '<span class="rcard__stars" role="img" aria-label="5 out of 5 stars">' + new Array(6).join('<svg class="ic" aria-hidden="true"><use href="#i-star"/></svg>') + '</span>';
    function card(r, hidden) {
      var short = r.text.length < 34 ? ' is-short' : '';
      return '<article class="rcard"' + (hidden ? ' aria-hidden="true"' : '') + '>' + stars +
        '<blockquote class="' + short.trim() + '">' + esc(r.text) + '</blockquote>' +
        '<div class="rcard__who"><span class="rcard__avatar" aria-hidden="true">' + esc(r.name.charAt(0)) + '</span><span><b>' + esc(r.name) + '</b><small>' + esc(r.source || 'Google review') + (r.date ? ' · ' + esc(r.date) : '') + '</small></span><span class="rcard__g" aria-hidden="true">G</span></div></article>';
    }
    if (!R.length) return;

    $$('[data-reviews-marquee]').forEach(function (m, n) {
      var rev = m.hasAttribute('data-reverse');
      var order = R.slice(); if (rev) order.reverse();
      var unit = []; while (unit.length < 6) unit = unit.concat(order);
      var html = unit.map(function (r) { return card(r, false); }).join('');
      var clone = unit.map(function (r) { return card(r, true); }).join('');
      m.classList.toggle('marquee--rev', rev);
      m.innerHTML = '<div class="marquee__track">' + html + clone + '</div>';
      var track = $('.marquee__track', m);
      var setSpeed = function () { var half = track.scrollWidth / 2; track.style.setProperty('--speed', Math.round(half / 38) + 's'); };
      setSpeed(); window.addEventListener('resize', setSpeed);
      m.setAttribute('tabindex', '0'); m.setAttribute('role', 'region');
      m.addEventListener('click', function () { m.classList.toggle('is-paused'); });
      m.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); m.classList.toggle('is-paused'); } });
    });

    var grid = $('[data-reviews-grid]');
    if (grid) grid.innerHTML = R.map(function (r) { return card(r, false); }).join('');
  });


  /* 10 premium polish: nav indicator, split text, spotlight, tilt, open-now */
  safe(function () {
    // sliding highlight behind the desktop nav links
    var list = $('#navLinks'), ind = list && $('.nav-ind', list);
    if (list && ind) {
      var links = $$('li > a', list), cur = null;
      links.forEach(function (a) { if (a.getAttribute('aria-current') === 'page') cur = a; });
      var place = function (a, hover) {
        if (!a) { ind.classList.remove('is-on'); return; }
        var r = a.getBoundingClientRect(), p = list.getBoundingClientRect();
        ind.style.width = r.width + 'px'; ind.style.transform = 'translateX(' + (r.left - p.left) + 'px)';
        ind.classList.add('is-on'); ind.classList.toggle('is-hover', !!hover && a !== cur);
      };
      var mark = function (a) {
        links.forEach(function (x) { x.classList.toggle('is-hov-a', x === a); });
        list.classList.toggle('is-hov', !!a && a !== cur);
      };
      links.forEach(function (a) {
        a.addEventListener('mouseenter', function () { place(a, true); mark(a); });
        a.addEventListener('focus', function () { place(a, true); mark(a); });
      });
      list.addEventListener('mouseleave', function () { place(cur); mark(null); });
      list.addEventListener('focusout', function () { place(cur); mark(null); });
      window.addEventListener('resize', function () { place(cur); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(cur); });
      place(cur);
    }

    // split the hero headline into words for a staggered entrance
    $$('[data-split]').forEach(function (h) {
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (t) {
              if (!t) return;
              if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
              var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = t; frag.appendChild(s);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1) { walk(n); }
        });
      })(h);
    });

    // open / closed status in Pacific time (the shop is in Wapato, WA)
    function status() {
      var d = new Date(), day, hr, min;
      try {
        var f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(d), o = {};
        f.forEach(function (p) { o[p.type] = p.value; });
        day = o.weekday; hr = (+o.hour) % 24; min = +o.minute;
      } catch (e) { return null; }
      var wk = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(day) > -1, mins = hr * 60 + min;
      if (wk && mins >= 540 && mins < 1080) return { open: true, text: 'Open now · until 6:00 pm' };
      return { open: false, text: 'Closed now · opens Mon - Fri, 9:00 am' };
    }
    var st = status();
    if (st) {
      $$('[data-open-text]').forEach(function (e) { e.textContent = st.text; });
      $$('[data-open-dot]').forEach(function (e) { e.classList.toggle('is-closed', !st.open); });
    }

    if (reduceMotion) return;
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;

    // cursor spotlight on cards
    $$('.why-tile, .service-card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    // gentle 3D tilt on price tickets and the quick quote card
    $$('.ticket, .quote').forEach(function (c) {
      c.classList.add('tilt');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = 'perspective(900px) rotateX(' + (-y * 4).toFixed(2) + 'deg) rotateY(' + (x * 5).toFixed(2) + 'deg) translateY(-3px)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });

    // hero logo drifts with the cursor
    var hero = $('#hero'), depth = hero && $('[data-depth]', hero);
    if (hero && depth) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        depth.style.transform = 'translate(' + (x * 18).toFixed(1) + 'px,' + (y * 12).toFixed(1) + 'px)';
      });
      hero.addEventListener('pointerleave', function () { depth.style.transform = ''; });
    }
  });


  /* 11 preloader, heading highlights, click bubbles, magnetic buttons */
  safe(function () {
    var pl = $('#preloader');
    if (pl) {
      var seen = false; try { seen = !!sessionStorage.getItem('dd-intro'); } catch (e) { }
      if (seen || reduceMotion) pl.classList.add('is-skip');
      else {
        try { sessionStorage.setItem('dd-intro', '1'); } catch (e) { }
        var t0 = Date.now(), done = function () { pl.classList.add('is-done'); setTimeout(function () { pl.classList.add('is-skip'); }, 500); };
        window.addEventListener('load', function () { setTimeout(done, Math.max(0, 1500 - (Date.now() - t0))); });
        setTimeout(done, 2600);
      }
    }

    // marker highlight on headings draws when they scroll into view
    var heads = $$('.section-head, .faq-intro, .area .reveal, .about-copy');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: .3 });
      heads.forEach(function (h) { io.observe(h); });
    } else heads.forEach(function (h) { h.classList.add('is-in'); });

    if (reduceMotion) return;

    // tiny soap bubbles pop out wherever you click
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest('input, select, textarea, .chat, .lightbox, iframe')) return;
      for (var i = 0; i < 6; i++) {
        var b = document.createElement('span'), sz = 8 + Math.random() * 14, a = Math.random() * Math.PI * 2, d = 24 + Math.random() * 40;
        b.className = 'pop-bubble'; b.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:' + (e.clientX - sz / 2) + 'px;top:' + (e.clientY - sz / 2) + 'px;--dx:' + (Math.cos(a) * d).toFixed(0) + 'px;--dy:' + (Math.sin(a) * d - 20).toFixed(0) + 'px';
        document.body.appendChild(b); setTimeout((function (n) { return function () { n.remove(); }; })(b), 950);
      }
    }, { passive: true });

    // buttons lean toward the cursor
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('.btn-lg, .nav-cta').forEach(function (b) {
        b.classList.add('magnet');
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
          b.style.transform = 'translate(' + (x * 8).toFixed(1) + 'px,' + (y * 6).toFixed(1) + 'px)';
        });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      });
    }
  });

})();
