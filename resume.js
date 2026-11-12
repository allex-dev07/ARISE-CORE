/* ARISE CORE - resume where you were.
   Remembers the open page (and the exact scroll position) and puts you back there after a refresh,
   a reload, or when the installed app is opened again. Loaded after nav.js. */
(function () {
'use strict';
const KEY = 'ariseResume', MAX_AGE = 24 * 3600 * 1000;
const $ = id => document.getElementById(id);
let restoring = true, lastSave = 0;

try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}

function authed() { try { return typeof isUserAuthenticated === 'function' && isUserAuthenticated(); } catch (e) { return false; } }
function curKey() {
    const a = document.querySelector('.sidebar .nv-link.active'); if (a && a.dataset.nav) return a.dataset.nav;
    return document.body.dataset.page || 'dashboard';
}
function save(force) {
    if (restoring || !authed()) return;
    const now = Date.now(); if (!force && now - lastSave < 250) return; lastSave = now;
    try { localStorage.setItem(KEY, JSON.stringify({ key: curKey(), page: document.body.dataset.page || 'dashboard', y: Math.round(window.scrollY), t: now })); } catch (e) {}
}
function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && Date.now() - v.t < MAX_AGE) return v; } catch (e) {}
    return null;
}
function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }

function restoreScroll(y, tries) {
    if (!y) { restoring = false; return; }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max >= y - 2 || tries >= 15) { window.scrollTo(0, Math.min(y, Math.max(0, max))); setTimeout(() => { restoring = false; }, 150); }
    else setTimeout(() => restoreScroll(y, tries + 1), 120);
}
function restore(tries) {
    if (!authed()) { if (tries < 25) return setTimeout(() => restore(tries + 1), 160); restoring = false; return; }
    if (!(window.NAV && window.changePage)) { if (tries < 25) return setTimeout(() => restore(tries + 1), 160); restoring = false; return; }
    const s = load();
    if (!s || (s.page === 'dashboard' && !s.y)) { restoring = false; return; }
    try {
        if (s.key && NAV.tree && /^[a-z]+$/.test(s.key) && s.key !== 'logout' && s.key !== 'share') NAV.go(s.key);
        else changePage(s.page, null);
    } catch (e) { try { changePage(s.page, null); } catch (x) {} }
    // NAV.go may schedule its own smooth scroll for sections; our saved position wins once the page has rendered
    setTimeout(() => restoreScroll(s.y, 0), 420);
}

window.addEventListener('scroll', () => save(false), { passive: true });
window.addEventListener('pagehide', () => { restoring = false; save(true); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { restoring = false; save(true); } });
// save the page itself whenever navigation happens
(function hook() {
    const w = window.changePage; if (typeof w !== 'function' || w.__resumeWrapped) return;
    const f = function () { const r = w.apply(this, arguments); setTimeout(() => save(true), 120); return r; };
    f.__resumeWrapped = true; window.changePage = f;
})();
// logging out must not carry the old position to the next person
(function () {
    const o = window.appMandatoryLogout; if (typeof o !== 'function') return;
    window.appMandatoryLogout = function () { clear(); return o.apply(this, arguments); };
})();

function start() { setTimeout(() => restore(0), 350); }
if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
