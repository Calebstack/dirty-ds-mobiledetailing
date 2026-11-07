/* =========================================================================
   Dirty D's chat assistant
   A basic FAQ + booking helper that runs entirely in the browser:
     1. answers questions about services, packages, add-ons and prices
     2. works out a starting price from an RV length and package
     3. sends customers to the booking form with their choices filled in

   It reads package names and prices from data.js, so it always matches the site.

   OPTIONAL: connect a real AI model later.
   Set an endpoint BEFORE this file loads (for example in a <script> tag in the page):
       window.DD_CHAT_CONFIG = { endpoint: "https://your-server.example.com/chat" };
   The widget then POSTs { message, history } as JSON and expects { reply: "text" }.
   If the endpoint is missing or fails, the built-in answers below are used.
   (Never put an AI provider's secret key in this file: it must live on your server.)
   ========================================================================= */
(function () {
  'use strict';
  var DD = window.DD;
  if (!DD) return;
  var CFG = window.DD_CHAT_CONFIG || {};
  var KEY = 'dd-chat-v1';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var B = DD.business;

  /* ---------- link helpers ---------- */
  function bookHref(o) { return (window.DDPricing ? window.DDPricing.bookingHref(o || {}) : 'booking.html#book'); }
  function btn(label, href, kind) { return '<a class="btn ' + (kind || 'btn-primary') + '" href="' + href + '">' + label + '</a>'; }
  function actions(list) { return '<div class="msg-actions">' + list.join('') + '</div>'; }
  var BOOK = function (o, label) { return btn(label || 'Book this detail', bookHref(o)); };

  /* ---------- knowledge ---------- */
  function extList() { return DD.exterior.map(function (p) { return '<li><b>' + esc(p.short) + '</b>: $' + p.rate + ' per linear foot (' + esc(p.tag.toLowerCase()) + ')</li>'; }).join(''); }
  function intList() { return DD.interior.map(function (p) { return '<li><b>' + esc(p.short) + '</b>: $' + p.rate + ' per linear foot</li>'; }).join(''); }

  function pkgDetail(p, kind) {
    var items = p.includes.slice(0, 7).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('');
    var more = p.includes.length > 7 ? '<p>...and more. The Services page lists everything.</p>' : '';
    var o = {}; o[kind === 'ext' ? 'ext' : 'int'] = p.id;
    return { html: '<p><b>' + esc(p.name) + '</b> is <b>$' + p.rate + ' per linear foot</b>.</p><p>' + esc(p.best) + '</p><ul>' + items + '</ul>' + more +
      '<p>Tell me your RV length and I\'ll work out a starting price.</p>',
      acts: actions([BOOK(o, 'Book ' + esc(p.short)), btn('See all details', 'services.html#' + (kind === 'ext' ? 'exterior' : 'interior'), 'btn-outline')]) };
  }

  var ADDON_ANSWERS = [
    { re: /awning/, html: '<p>Awning cleaning is <b>$50 to $100</b> per awning, depending on size and condition.</p>', o: {} },
    { re: /slide|topper/, html: '<p>Slide-out cleaning is <b>$25 each</b>, or <b>$50 each</b> for a slide-out with a fabric topper.</p>', o: {} }
  ];

  var INTENTS = [
    { id: 'thanks', re: /\b(thanks|thank you|thx|appreciate)\b/, run: function () { return { html: '<p>You\'re welcome! If you want to lock in a time, the booking form takes about two minutes.</p>', acts: actions([BOOK({}, 'Open booking form')]) }; } },
    { id: 'greet', re: /^(hi|hello|hey|howdy|good (morning|afternoon|evening)|yo)\b/, run: function () { return { html: '<p>Hi, I\'m the Dirty D\'s assistant. Ask me about our packages, prices, service area or hours, or tell me your RV length and I\'ll estimate a price.</p>' }; } },
    { id: 'human', re: /\b(human|real person|owner|speak to|talk to|someone|call you|phone|call|number|contact|email|text)\b/, run: function () {
      return { html: '<p>You can reach a real person at <b>' + B.phone + '</b> (Mon - Fri, 9:00 am - 6:00 pm) or <a href="mailto:' + B.email + '">' + B.email + '</a>.</p>', acts: actions([btn('Call ' + B.phone, 'tel:' + B.tel)]) }; } },
    { id: 'hours', re: /\b(hours?|open|opening|close|closing|weekend|saturday|sunday|monday|friday|what time)\b/, run: function () {
      return { html: '<p>We\'re open <b>Monday to Friday, 9:00 am to 6:00 pm</b>, and closed on Saturday and Sunday.</p>', acts: actions([BOOK({}, 'Request a time')]) }; } },
    { id: 'area', re: /\b(area|areas|county|counties|where|serve|serving|travel|come to|drive to|mobile|location|address|wapato|yakima|benton|kittitas|lewis|near)\b/, run: function () {
      return { html: '<p>We\'re fully mobile. We come to your driveway, storage lot or campsite in <b>Benton, Kittitas, Lewis and Yakima Counties</b>, Washington.</p><p>You can also bring your RV to us at ' + esc(B.address1) + ', ' + esc(B.address2) + '.</p>', acts: actions([btn('See the map', 'booking.html#map', 'btn-outline'), BOOK({}, 'Book a visit')]) }; } },
    { id: 'tanks', re: /\b(tank|tanks|black tank|gray tank|grey tank|holding|sewer|sensor|flush)\b/, run: function () {
      return { html: '<p>Our holding tank service uses a rotary black tank rinse wand and a back-flow flush system, plus premium tank treatments and sensor cleaners so your readings stay accurate.</p><p>Low-pressure and high-pressure deep cleaning are available as add-ons. Pricing is quoted after a quick look at your RV.</p>', acts: actions([btn('Request tank cleaning', 'booking.html#addons'), btn('Call for a quote', 'tel:' + B.tel, 'btn-outline')]) }; } },
    { id: 'eco', re: /\b(eco|environment|green|chemical|chemicals|safe|made in america|products|biodegradable)\b/, run: function () {
      return { html: '<p>We use <b>100% eco-friendly, made-in-America</b> cleaning agents, waxes, protectants and sealants. They are tough on dirt but gentle on the planet.</p>' }; } },
    { id: 'reviews', re: /\b(review|reviews|rating|testimonial|feedback|reputation|trust)\b/, run: function () {
      return { html: '<p>Customers have left more than 21 reviews on Google. You can read them on our Reviews page.</p>', acts: actions([btn('Read reviews', 'reviews.html'), btn('See Google reviews', B.google, 'btn-outline')]) }; } },
    { id: 'gallery', re: /\b(photo|photos|picture|pictures|video|videos|gallery|before and after|results|examples|work)\b/, run: function () {
      return { html: '<p>The gallery has photos of motorhomes, fifth wheels and travel trailers, plus videos and before-and-after reels of awning and roof cleaning.</p>', acts: actions([btn('Open the gallery', 'gallery.html')]) }; } },
    { id: 'pay', re: /\b(pay|payment|deposit|cash|card|credit|venmo|invoice|accept)\b/, run: function () {
      return { html: '<p>We confirm payment details when we schedule your appointment, so there\'s nothing to pay on the website. Call <b>' + B.phone + '</b> if you have a specific question.</p>' }; } },
    { id: 'time', re: /\b(how long|duration|take long|hours does|time does it take|how many hours)\b/, run: function () {
      return { html: '<p>It depends on your RV\'s size, condition and the package you choose. We confirm the timing with you when we schedule.</p>', acts: actions([BOOK({}, 'Request a time')]) }; } },
    { id: 'book', re: /\b(book|booking|schedule|appointment|reserve|sign up|get started|request|quote form)\b/, run: function () {
      return { html: '<p>Booking takes about two minutes:</p><ul><li>Tell us about your RV</li><li>Pick your packages and add-ons</li><li>Choose a date and time</li></ul><p>We confirm by phone or email.</p>', acts: actions([BOOK({}, 'Open booking form'), btn('Call ' + B.phone, 'tel:' + B.tel, 'btn-outline')]) }; } },
    { id: 'addons', re: /\b(add on|add ons|add-on|add-ons|addon|addons|extra|extras|headlight|decal|oxidation|gel coat|water spot|undercarriage|air conditioner|a\/c|awning|awnings|slide|slides|slideout|slide-out|topper)\b/, run: function (m) {
      for (var i = 0; i < ADDON_ANSWERS.length; i++) if (ADDON_ANSWERS[i].re.test(m)) return { html: ADDON_ANSWERS[i].html + '<p>Tell me how many and I\'ll add it to an estimate.</p>', acts: actions([btn('See all add-ons', 'services.html#addons', 'btn-outline'), BOOK({}, 'Add to my booking')]) };
      return { html: '<p>Optional add-ons:</p><ul><li>Slide-out cleaning: $25 each ($50 with topper)</li><li>Awning cleaning: $50 to $100</li><li>Headlight restoration, decal removal, heavy water spot removal, heavy oxidation and gel coat restoration, undercarriage cleaning, roof-top A/C cleaning and fin straightening: quoted after a quick look</li><li>Low-pressure and high-pressure holding tank cleaning: quoted</li></ul>', acts: actions([btn('See all add-ons', 'services.html#addons', 'btn-outline'), BOOK({}, 'Add to my booking')]) }; } },
    { id: 'interior', re: /\b(interior|inside|cabin|carpet|carpets|upholstery|vacuum|odor|odors|smell|mold|mildew|leather|vinyl|bathroom|appliance)\b/, run: function () {
      return { html: '<p>We offer three interior levels, priced per linear foot:</p><ul>' + intList() + '</ul><p>Ask about one by name, like "tell me about Level 3 interior", or give me your RV length for a price.</p>', acts: actions([btn('Interior packages', 'services.html#interior', 'btn-outline'), BOOK({}, 'Book interior')]) }; } },
    { id: 'exterior', re: /\b(exterior|outside|wash|wax|ceramic|roof|oxidation|shine|protect|protection|coating|sealant)\b/, run: function () {
      return { html: '<p>We offer three exterior packages, priced per linear foot:</p><ul>' + extList() + '</ul><p>Ask about one by name, like "what\'s in the Ultimate package", or give me your RV length for a price.</p>', acts: actions([btn('Exterior packages', 'services.html#exterior', 'btn-outline'), BOOK({}, 'Book exterior')]) }; } },
    { id: 'prices', re: /\b(price|prices|pricing|cost|costs|how much|rate|rates|cheap|cheapest|package|packages|menu|offer|services|do you do|what do you)\b/, run: function () {
      return { html: '<p>Everything is priced <b>per linear foot</b> of your RV.</p><p><b>Exterior</b></p><ul>' + extList() + '</ul><p><b>Interior</b></p><ul>' + intList() + '</ul><p>Add-ons are priced separately. Give me your RV length and a package and I\'ll estimate your price.</p>', acts: actions([btn('Price estimator', 'services.html#estimate'), btn('Full menu', 'services.html', 'btn-outline')]) }; } }
  ];

  /* ---------- quote engine ---------- */
  function num(m) { var x = m.match(/\b(\d{2,3})\s*(?:-|\s)?\s*(?:ft|feet|foot|')/); if (x) return +x[1]; return null; }
  function lonelyNum(m) { var x = m.trim().match(/^(\d{2,3})(?:\s*(?:ft|feet|foot|'))?$/); return x ? +x[1] : null; }
  function countNear(m, re) { var x = m.match(new RegExp('(\\d+)\\s*(?:x\\s*)?(?:' + re + ')')); return x ? +x[1] : 0; }

  // work out { ext, int } from the words used
  function detectPackages(m) {
    var wantExt = /\b(exterior|outside|wash|wax|roof)\b/.test(m), wantInt = /\b(interior|inside|cabin|carpet)\b/.test(m);
    var ext = null, inn = null, lvl = 0;
    if (/\bultimate\b/.test(m)) ext = 'ultimate';
    if (/\b(deep|comprehensive)\b/.test(m)) inn = 'deep';
    if (/\b(express)\b/.test(m)) inn = inn || 'express';
    if (/\b(deluxe|intermediate)\b/.test(m)) inn = inn || 'deluxe';
    if (/level (3|three)|\blevel3\b/.test(m)) lvl = 3; else if (/level (2|two)|\blevel2\b/.test(m)) lvl = 2; else if (/level (1|one)|\blevel1\b|\bbasic\b/.test(m)) lvl = 1;
    if (lvl) {
      var eId = ['basic', 'level2', 'ultimate'][lvl - 1], iId = ['express', 'deluxe', 'deep'][lvl - 1];
      if (wantExt && !wantInt) ext = ext || eId; else if (wantInt && !wantExt) inn = inn || iId;
      else if (wantExt && wantInt) { ext = ext || eId; inn = inn || iId; }
      else if (/\bbasic\b/.test(m)) ext = ext || eId; // "basic" alone usually means the exterior menu's first tier
      else return { ext: ext, int: inn, ambiguousLevel: lvl };
    }
    return { ext: ext, int: inn };
  }

  function quote(st) {
    var o = { len: st.len, ext: st.ext, int: st.int, slides: st.slides, toppers: 0, awnings: st.awnings };
    var r = window.DDPricing.estimate(o);
    var rows = r.lines.map(function (l) { return '<li>' + esc(l[0]) + ': <b>' + esc(l[1]) + '</b></li>'; }).join('');
    return { html: '<p>Here\'s a starting estimate:</p><ul>' + rows + '</ul><p><b>Estimated total: ' + window.DDPricing.totalText(r) + '</b></p><p>This is an estimate. We confirm your final price before any work starts.</p>',
      acts: actions([btn('Book this detail', window.DDPricing.bookingHref(o)), btn('Change packages', 'services.html#estimate', 'btn-outline')]) };
  }

  var pending = {}; // remembers what we already know: len, ext, int, slides, awnings

  function tryQuote(m) {
    var len = num(m), only = lonelyNum(m), pk = detectPackages(m);
    var sl = countNear(m, 'slide-?outs?|slides?|slideouts?'), aw = countNear(m, 'awnings?');
    var hasPkg = pk.ext || pk.int, wantsPrice = /\b(price|cost|how much|quote|estimate|total)\b/.test(m);
    if (only && (pending.ext || pending.int)) len = only; else if (only && pending.askLen) len = only;
    if (len) pending.len = len;
    if (pk.ext) pending.ext = pk.ext; if (pk.int) pending.int = pk.int;
    if (sl) pending.slides = sl; if (aw) pending.awnings = aw;
    if (pk.ambiguousLevel) { pending.lvl = pk.ambiguousLevel; return { html: '<p>Is that the <b>exterior</b> or the <b>interior</b> package? Level ' + pk.ambiguousLevel + ' comes in both.</p>', chips: ['Level ' + pk.ambiguousLevel + ' exterior', 'Level ' + pk.ambiguousLevel + ' interior'] }; }
    var touched = len || hasPkg;
    if (!touched) return null;
    if (!hasPkg && !pending.ext && !pending.int) {
      if (len) { pending.askLen = false; return { html: '<p>Got it, a ' + len + ' ft RV. Which package would you like priced?</p>', chips: ['Basic exterior', 'Level 2 exterior', 'Ultimate exterior', 'Level 1 interior', 'Level 2 interior', 'Level 3 interior'] }; }
      return null;
    }
    if (!pending.len) {
      // package named without a length: if the user is only browsing, describe it; if they want a price, ask the length
      if (wantsPrice) { pending.askLen = true; return { html: '<p>How long is your RV (in feet)? I\'ll use that to work out the price.</p>' }; }
      return null;
    }
    return quote(pending);
  }

  function packageByName(m) {
    var pk = detectPackages(m);
    if (pk.ext && !pk.int && !/\b(interior|inside)\b/.test(m)) return pkgDetail(DD.exterior.filter(function (p) { return p.id === pk.ext; })[0], 'ext');
    if (pk.int && !pk.ext) return pkgDetail(DD.interior.filter(function (p) { return p.id === pk.int; })[0], 'int');
    return null;
  }

  function normalise(t) { return ' ' + t.toLowerCase().replace(/[“”"]/g, '').replace(/[’]/g, "'").replace(/[!?,.;:]+/g, ' ').replace(/\s+/g, ' ').trim() + ' '; }

  function answer(raw) {
    var m = normalise(raw).trim();
    // "tell me about X" style details beat generic lists, unless the user also gave a length
    var q = tryQuote(m);
    var asksDetail = /\b(what'?s in|whats in|what is in|what does|include|includes|included|tell me about|details?|about the|explain)\b/.test(m);
    if (asksDetail && !num(m)) { var d = packageByName(m); if (d) return d; }
    if (q) return q;
    if (/\b(start over|reset|clear)\b/.test(m)) { pending = {}; return { html: '<p>Cleared. What would you like to know?</p>' }; }
    for (var i = 0; i < INTENTS.length; i++) if (INTENTS[i].re.test(m)) return INTENTS[i].run(m);
    var d2 = packageByName(m); if (d2) return d2;
    // FAQ fallback: best overlap with the written FAQ
    var best = null, bs = 0, words = m.split(' ').filter(function (w) { return w.length > 3; });
    DD.faq.forEach(function (f) { var s = 0, t = (f.q + ' ' + f.a).toLowerCase(); words.forEach(function (w) { if (t.indexOf(w) > -1) s++; }); if (s > bs) { bs = s; best = f; } });
    if (best && bs >= 2) return { html: '<p><b>' + esc(best.q) + '</b></p><p>' + esc(best.a) + '</p>', acts: actions([BOOK({}, 'Open booking form')]) };
    return { html: '<p>I\'m not sure I have that one. I can help with <b>packages and prices</b>, <b>add-ons</b>, <b>service area</b>, <b>hours</b> and <b>booking</b>. For anything else, call <b>' + B.phone + '</b>.</p>', acts: actions([btn('Call ' + B.phone, 'tel:' + B.tel), BOOK({}, 'Open booking form')]) };
  }

  /* ---------- UI ---------- */
  var QUICK = ['Packages and prices', 'Exterior packages', 'Interior packages', 'Add-ons', 'Service area', 'Hours', 'Book a detail'];
  var root, panel, body, input, chipsBox, launch, tip, history = [], open = false;

  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-30))); } catch (e) { } }
  function scroll() { body.scrollTop = body.scrollHeight; }

  function add(role, html, acts, chips) {
    var d = document.createElement('div');
    d.className = 'msg msg--' + (role === 'user' ? 'user' : 'bot');
    d.innerHTML = html + (acts || '');
    body.appendChild(d); scroll();
    if (chips && chips.length) setChips(chips);
    return d;
  }
  function setChips(list) {
    chipsBox.innerHTML = '';
    list.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = c;
      b.addEventListener('click', function () { send(c); });
      chipsBox.appendChild(b);
    });
  }

  function reply(res) {
    var typing = document.createElement('div'); typing.className = 'msg msg--bot typing'; typing.setAttribute('aria-label', 'Assistant is typing'); typing.innerHTML = '<i></i><i></i><i></i>';
    body.appendChild(typing); scroll();
    var wait = reduce ? 0 : 450 + Math.random() * 350;
    setTimeout(function () {
      typing.remove();
      add('bot', res.html, res.acts, res.chips || QUICK);
      history.push({ r: 'bot', h: res.html + (res.acts || '') }); save();
    }, wait);
  }

  function send(text) {
    text = (text || '').trim(); if (!text) return;
    add('user', esc(text)); history.push({ r: 'user', h: esc(text) }); save();
    input.value = '';
    if (CFG.endpoint) {
      var h = history.slice(-10).map(function (x) { return { role: x.r === 'user' ? 'user' : 'assistant', content: x.h.replace(/<[^>]+>/g, ' ') }; });
      fetch(CFG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: h }) })
        .then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); })
        .then(function (j) { if (!j || !j.reply) throw new Error('empty'); reply({ html: '<p>' + esc(j.reply).replace(/\n+/g, '</p><p>') + '</p>', acts: actions([BOOK({}, 'Open booking form')]) }); })
        .catch(function () { reply(answer(text)); });
      return;
    }
    reply(answer(text));
  }

  function toggle(force) {
    open = typeof force === 'boolean' ? force : !open;
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    launch.setAttribute('aria-expanded', open ? 'true' : 'false');
    launch.setAttribute('aria-label', open ? 'Close chat assistant' : 'Open chat assistant');
    document.body.classList.toggle('chat-open-mobile', open && window.innerWidth <= 640);
    if (open) { tip.classList.remove('is-on'); var bd = launch.querySelector('.badge'); if (bd) bd.remove(); setTimeout(function () { input.focus(); scroll(); }, 280); try { sessionStorage.setItem(KEY + '-seen', '1'); } catch (e) { } }
    else document.body.classList.remove('chat-open-mobile');
  }

  function build() {
    root = document.createElement('div'); root.id = 'ddChat';
    root.innerHTML =
      '<button class="chat-launch" type="button" aria-label="Open chat assistant" aria-expanded="false" aria-controls="ddChatPanel"><img src="assets/images/logo-small.png" alt="" width="48" height="46"><span class="badge" aria-hidden="true">1</span></button>' +
      '<p class="chat-tip" role="status">Questions about prices or packages? Ask me.</p>' +
      '<section class="chat" id="ddChatPanel" role="dialog" aria-label="Dirty D\'s chat assistant" aria-hidden="true">' +
      '<header class="chat__head"><img src="assets/images/logo-small.png" alt=""><div><b>Dirty D\'s assistant</b><small>Prices, packages and booking</small></div>' +
      '<button class="chat__close" type="button" aria-label="Close chat"><svg class="ic" aria-hidden="true"><use href="#i-close"/></svg></button></header>' +
      '<div class="chat__body" role="log" aria-live="polite"></div>' +
      '<div class="chat__chips" aria-label="Suggested questions"></div>' +
      '<form class="chat__form" autocomplete="off"><input type="text" name="q" placeholder="Ask about prices, packages..." aria-label="Type your question" maxlength="300"><button type="submit" aria-label="Send"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg></button></form>' +
      '<p class="chat__note">Automated assistant. Estimates only; we confirm every price before work starts.</p></section>';
    document.body.appendChild(root);
    panel = $('#ddChatPanel'); body = $('.chat__body', root); input = $('input', root); chipsBox = $('.chat__chips', root); launch = $('.chat-launch', root); tip = $('.chat-tip', root);
    launch.addEventListener('click', function () { toggle(); });
    $('.chat__close', root).addEventListener('click', function () { toggle(false); launch.focus(); });
    $('.chat__form', root).addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { toggle(false); launch.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 640) document.body.classList.remove('chat-open-mobile'); });

    var saved = null; try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { }
    if (saved && saved.length) { saved.forEach(function (m) { var d = document.createElement('div'); d.className = 'msg msg--' + (m.r === 'user' ? 'user' : 'bot'); d.innerHTML = m.h; body.appendChild(d); }); history = saved; setChips(QUICK); }
    else {
      var hi = '<p>Hi! I\'m the Dirty D\'s assistant. I can answer questions about our <b>services, packages and prices</b>, estimate a price from your RV length, and take you to the <b>booking form</b>.</p><p>What would you like to know?</p>';
      add('bot', hi); history.push({ r: 'bot', h: hi }); setChips(QUICK);
    }
    var seen = false; try { seen = !!sessionStorage.getItem(KEY + '-seen'); } catch (e) { }
    if (seen) { var bd = launch.querySelector('.badge'); if (bd) bd.remove(); }
    else setTimeout(function () { if (!open) tip.classList.add('is-on'); setTimeout(function () { tip.classList.remove('is-on'); }, 7000); }, 6500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
