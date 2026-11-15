/* ARISE CORE ads: shows the ad codes you paste in the admin panel (Ads tab). Needs 5_ads_setup.sql in Supabase.
   Ads are mounted ONLY in the page the user is looking at (hidden pages never load ads, so impressions stay real). */
(function () {
  'use strict';
  var KEY = 'ariseAdSlots', slots = {}, navSig = '', pageSig = '', navCount = 0, doneCount = 0, lastPop = 0, giving = false, ran = {};

  var st = document.createElement('style');
  st.textContent =
    '.ad-slot{position:relative;border-radius:14px;overflow:hidden;background:rgba(128,128,128,.08);border:1px solid var(--border-color,rgba(128,128,128,.2))}' +
    '.ad-tag{position:absolute;top:3px;right:8px;font-size:9px;letter-spacing:.08em;color:var(--text-muted,#999);pointer-events:none;z-index:1}' +
    '.ad-fixed{position:fixed;left:0;right:0;z-index:40;background:var(--bg-base,#000);border-top:1px solid var(--border-color,rgba(128,128,128,.2));text-align:center}' +
    'body.auth-locked .ad-fixed{display:none!important}' +
    'body.has-ad-nav .main-content{margin-bottom:var(--ad-nav-h,0px)}' +
    '.ad-reward{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-radius:16px;border:1px solid var(--neon-cyan,#00f0ff);background:rgba(0,240,255,.06)}' +
    '.ad-reward b{display:block;font-size:15px;margin-bottom:2px}.ad-reward span{font-size:12px;color:var(--text-muted,#999)}' +
    '.ad-btn{display:inline-block;padding:10px 16px;border-radius:12px;border:1px solid var(--neon-cyan,#00f0ff);background:transparent;color:var(--neon-cyan,#00f0ff);font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;text-decoration:none;font-family:inherit}' +
    '.ad-btn:disabled{opacity:.45;cursor:default}' +
    '.ad-ov{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:20px}' +
    '.ad-box{width:100%;max-width:420px;background:var(--bg-base,#000);color:var(--text-main,#fff);border:1px solid var(--border-color,rgba(128,128,128,.3));border-radius:20px;padding:18px;display:flex;flex-direction:column;gap:12px}' +
    '.ad-box h3{margin:0;font-size:17px}.ad-sub{font-size:13px;color:var(--text-muted,#999)}.ad-row{display:flex;gap:10px;justify-content:flex-end}';
  document.head.appendChild(st);

  function num(v, d, mn, mx) { v = parseInt(v, 10); if (!(v >= mn)) v = d; return Math.min(mx, Math.max(mn, v)); }
  function on(s) { return !!(s && s.on && String(s.code || '').trim()); }
  function onLink(s) { return !!(s && s.on && /^https:\/\//i.test(String(s.url || ''))); }
  function premium() { try { return typeof isPremium === 'function' && isPremium(); } catch (e) { return false; } }
  function masterOff() { return typeof cloud !== 'undefined' && cloud.settings && cloud.settings.ads_enabled === false; }
  function allowed() { return !masterOff() && !premium(); }
  function locked() { return document.body.classList.contains('auth-locked') || !!document.getElementById('bootLoader'); }

  function makeFrame(s, h) {
    var f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation' + (s.trusted ? ' allow-same-origin' : ''));
    f.setAttribute('referrerpolicy', 'no-referrer');
    f.title = 'Advertisement';
    f.style.cssText = 'border:0;width:100%;height:' + h + 'px;display:block;background:transparent';
    f.srcdoc = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:transparent;display:flex;justify-content:center;align-items:center;min-height:100%}</style></head><body>' + String(s.code) + '</body></html>';
    return f;
  }
  function box(s, h) {
    var d = document.createElement('div'); d.className = 'ad-slot ad-inj';
    var t = document.createElement('span'); t.className = 'ad-tag'; t.textContent = 'AD';
    d.appendChild(t); d.appendChild(makeFrame(s, h)); return d;
  }
  function rm(sel) { var n = document.querySelectorAll(sel); for (var i = 0; i < n.length; i++) n[i].remove(); }

  /* ---- navigation banner (fixed, kept between page changes) ---- */
  function placeNav() {
    var d = document.getElementById('adNav'); if (!d) return;
    var n = document.getElementById('mobileNav'), sb = document.querySelector('.sidebar'), bottom = 0, left = 0;
    if (n && getComputedStyle(n).display !== 'none') bottom = Math.max(0, Math.round(window.innerHeight - n.getBoundingClientRect().top));
    else if (sb && getComputedStyle(sb).display !== 'none') left = Math.round(sb.getBoundingClientRect().right);
    d.style.bottom = bottom + 'px'; d.style.left = left + 'px';
    document.documentElement.style.setProperty('--ad-nav-h', Math.round(d.getBoundingClientRect().height) + 'px');
    document.body.classList.add('has-ad-nav');
  }
  function syncNav() {
    var s = slots.nav_banner, want = allowed() && on(s), sg = want ? JSON.stringify(s) : '';
    if (sg === navSig) { placeNav(); return; }
    navSig = sg; rm('#adNav'); document.body.classList.remove('has-ad-nav');
    if (!want) return;
    var d = document.createElement('div'); d.className = 'ad-fixed'; d.id = 'adNav';
    d.appendChild(makeFrame(s, num(s.height, 60, 30, 300)));
    document.body.appendChild(d); placeNav();
  }

  /* ---- overlays (rewards, app-open, between pages, after completing) ---- */
  function popAllowed() { return allowed() && !locked() && !document.getElementById('adOverlay') && Date.now() - lastPop > 45000; }
  function overlay(o) {
    if (document.getElementById('adOverlay')) return;
    lastPop = Date.now();
    var ov = document.createElement('div'); ov.className = 'ad-ov'; ov.id = 'adOverlay';
    var b = document.createElement('div'); b.className = 'ad-box';
    var h = document.createElement('h3'); h.textContent = o.title;
    var sub = document.createElement('div'); sub.className = 'ad-sub';
    var row = document.createElement('div'); row.className = 'ad-row';
    var close = document.createElement('button'); close.className = 'ad-btn'; close.type = 'button';
    var main = document.createElement('button'); main.className = 'ad-btn'; main.type = 'button'; main.disabled = true;
    var left = o.seconds, timer = null;
    function end() { clearInterval(timer); ov.remove(); lastPop = Date.now(); }
    function label() {
      sub.textContent = left > 0 ? (o.reward ? 'Your reward unlocks in ' + left + 's' : 'You can close this in ' + left + 's') : (o.reward ? 'Thanks for watching!' : 'Thanks for your support!');
      if (!o.reward) main.textContent = left > 0 ? 'Close (' + left + 's)' : 'Close';
    }
    if (o.reward) {
      close.textContent = 'Skip (no reward)'; close.onclick = end;
      main.textContent = 'Claim +' + o.xp + ' XP';
      main.onclick = function () { if (left > 0) return; end(); o.onClaim(); };
      row.appendChild(close); row.appendChild(main);
    } else {
      main.onclick = function () { if (left <= 0) end(); };
      row.appendChild(main);
    }
    label();
    b.appendChild(h); b.appendChild(sub); b.appendChild(makeFrame(o.slot, o.height)); b.appendChild(row);
    ov.appendChild(b); document.body.appendChild(ov);
    timer = setInterval(function () {
      if (document.hidden) return;
      left--; label();
      if (left <= 0) { clearInterval(timer); main.disabled = false; }
    }, 1000);
  }
  function popup(key, title) {
    var s = slots[key]; if (!on(s) || !popAllowed()) return false;
    overlay({ title: title || 'Sponsored', reward: false, slot: s, height: num(s.height, 250, 30, 600), seconds: num(s.seconds, 5, 3, 60) });
    return true;
  }

  /* ---- rewards ---- */
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function rState(k) { try { var r = JSON.parse(localStorage.getItem('ariseAdReward_' + k) || 'null'); if (r && r.d === today()) return r; } catch (e) {} return { d: today(), n: 0 }; }
  function rLeft(k) { return Math.max(0, num(slots[k].daily, 5, 1, 100) - rState(k).n); }
  function giveXp(k, n) {
    try {
      if (rLeft(k) <= 0) return;
      var r = rState(k); r.n++; localStorage.setItem('ariseAdReward_' + k, JSON.stringify(r));
      appState.totalXp = (appState.totalXp || 0) + n;
      if (typeof checkLevelUp === 'function') checkLevelUp();
      if (typeof saveData === 'function') saveData();
      if (typeof updateUI === 'function') updateUI();
      giving = true; if (typeof showToast === 'function') showToast('+' + n + ' XP Earned!'); giving = false;
    } catch (e) { giving = false; }
    renderPages();
  }
  function rewardCard(k) {
    var s = slots[k], xp = num(s.xp, k === 'rewards_bonus' ? 100 : 50, 1, 1000), left = rLeft(k);
    var c = document.createElement('div'); c.className = 'ad-reward ad-inj';
    var t = document.createElement('div'); t.innerHTML = '<b>Free XP</b><span></span>';
    t.querySelector('span').textContent = left > 0 ? 'Watch a short ad and get +' + xp + ' XP (' + left + ' left today)' : 'Come back tomorrow for more free XP';
    var btn = document.createElement('button'); btn.className = 'ad-btn'; btn.type = 'button'; btn.textContent = 'Watch'; btn.disabled = left <= 0;
    btn.onclick = function () {
      if (rLeft(k) <= 0 || document.getElementById('adOverlay')) return;
      overlay({ title: 'Watch to earn +' + xp + ' XP', reward: true, xp: xp, slot: s, height: num(s.height, 250, 30, 600), seconds: num(s.seconds, 15, 3, 60), onClaim: function () { giveXp(k, xp); } });
    };
    c.appendChild(t); c.appendChild(btn); return c;
  }
  function linkCard(s) {
    var c = document.createElement('div'); c.className = 'ad-reward ad-inj';
    var t = document.createElement('div'); t.innerHTML = '<b></b><span></span>';
    t.querySelector('b').textContent = s.label || 'Support ARISE CORE';
    t.querySelector('span').textContent = s.text || 'Tap to see today\u2019s offer';
    var a = document.createElement('a'); a.className = 'ad-btn'; a.textContent = 'Open'; a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer sponsored';
    c.appendChild(t); c.appendChild(a); return c;
  }

  /* ---- inline ads in the page(s) the user is looking at ---- */
  function renderPages() {
    rm('.ad-inj');
    var ok = allowed(), rewardsOk = !masterOff(), act = document.querySelectorAll('.page-section.active');
    for (var i = 0; i < act.length; i++) {
      var sec = act[i], id = sec.id, dash = id === 'page-dashboard';
      var hdr = sec.querySelector(':scope > .top-header'), anchor = hdr;
      var after = function (el) { if (anchor) anchor.insertAdjacentElement('afterend', el); else sec.insertBefore(el, sec.firstChild); anchor = el; };
      if (ok && !dash && i === 0 && on(slots.page_top)) after(box(slots.page_top, num(slots.page_top.height, 60, 30, 400)));
      if (ok && dash && on(slots.home_banner)) after(box(slots.home_banner, num(slots.home_banner.height, 100, 30, 400)));
      if (rewardsOk && dash && on(slots.rewards)) after(rewardCard('rewards'));
      if (rewardsOk && id === 'page-achievements' && on(slots.rewards_bonus)) after(rewardCard('rewards_bonus'));
      if (ok && !dash && i === 0 && on(slots.feed)) {
        var kids = [].filter.call(sec.children, function (c) { return !c.classList.contains('ad-inj') && c.offsetHeight > 0; });
        var ref = kids[Math.min(1, kids.length - 1)], f = box(slots.feed, num(slots.feed.height, 250, 30, 600));
        if (ref) ref.insertAdjacentElement('afterend', f); else sec.appendChild(f);
      }
      if (ok && onLink(slots.support_link) && (dash || id === 'page-more' || id === 'page-settings')) sec.appendChild(linkCard(slots.support_link));
      if (ok && i === act.length - 1 && on(slots.page_bottom)) sec.appendChild(box(slots.page_bottom, num(slots.page_bottom.height, 100, 30, 400)));
    }
    var sb = document.querySelector('.sidebar');
    if (ok && on(slots.sidebar) && sb && getComputedStyle(sb).display !== 'none') sb.appendChild(box(slots.sidebar, num(slots.sidebar.height, 250, 30, 600)));
    pageSig = pageSignature();
  }
  function pageSignature() {
    var ids = [], act = document.querySelectorAll('.page-section.active');
    for (var i = 0; i < act.length; i++) ids.push(act[i].id);
    return (allowed() ? '1' : '0') + (masterOff() ? 'm' : '') + '|' + ids.join(',') + '|' + JSON.stringify(slots);
  }

  /* ---- page script (Social Bar / Popunder / Push): runs once per app open ---- */
  function runScript() {
    var s = slots.page_script;
    if (!allowed() || locked() || !on(s) || ran[s.code]) return;
    ran[s.code] = 1;
    try { document.body.appendChild(document.createRange().createContextualFragment(String(s.code))); } catch (e) {}
  }

  /* ---- triggers ---- */
  function onNav() {
    if (!allowed() || !on(slots.interstitial)) return;
    navCount++;
    if (navCount >= num(slots.interstitial.every, 8, 2, 100) && popAllowed()) { navCount = 0; setTimeout(function () { popup('interstitial'); }, 500); }
  }
  function onDone() {
    if (!allowed() || !on(slots.complete_ad)) return;
    doneCount++;
    if (doneCount >= num(slots.complete_ad.every, 5, 2, 100) && popAllowed()) { doneCount = 0; setTimeout(function () { popup('complete_ad'); }, 900); }
  }
  function tryAppOpen() {
    var done = false; try { done = sessionStorage.getItem('ariseAdOpen') === '1'; } catch (e) {}
    if (done || !on(slots.app_open) || !popAllowed()) return;
    try { sessionStorage.setItem('ariseAdOpen', '1'); } catch (e) {}
    popup('app_open');
  }
  function sync() {
    syncNav(); runScript();
    if (pageSignature() !== pageSig) renderPages();
    tryAppOpen();
  }

  function fetchSlots() {
    if (typeof cloud === 'undefined' || !cloud.session || typeof cloudFetch !== 'function') return Promise.resolve(false);
    return cloudFetch('/rest/v1/rpc/get_ad_slots', { method: 'POST', body: {} }).then(function (r) {
      slots = (r && typeof r === 'object') ? r : {};
      try { localStorage.setItem(KEY, JSON.stringify(slots)); } catch (e) {}
      return true;
    }).catch(function () { return false; });
  }

  if (typeof window.changePage === 'function') {
    var origNav = window.changePage;
    window.changePage = function () { var r = origNav.apply(this, arguments); try { setTimeout(function () { renderPages(); }, 200); onNav(); } catch (e) {} return r; };
  }
  if (typeof window.showToast === 'function') {
    var origToast = window.showToast;
    window.showToast = function (m) { var r = origToast.apply(this, arguments); try { if (!giving && typeof m === 'string' && /XP Earned/i.test(m)) onDone(); } catch (e) {} return r; };
  }
  try { slots = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { slots = {}; }
  sync();
  var tries = 0;
  (function load() { fetchSlots().then(function (ok) { if (ok) { pageSig = ''; sync(); } else if (++tries < 30) setTimeout(load, 2000); }); })();
  setInterval(function () { fetchSlots().then(function (ok) { if (ok) sync(); }); }, 600000);
  setInterval(sync, 3000);
  window.addEventListener('resize', placeNav);
})();
