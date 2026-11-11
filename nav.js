/* ARISE CORE - navigation. ONE definition (TREE) builds the desktop sidebar, the mobile bottom bar,
   the mobile group sheet and the mobile drawer, so every link is defined exactly once.
   Loaded AFTER features.js so it can wrap changePage. */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const q = (s, r) => (r || document).querySelector(s);
const qa = (s, r) => Array.from((r || document).querySelectorAll(s));
const svg = d => `<svg class="icon" viewBox="0 0 24 24">${d}</svg>`;

/* ---------- icons (consistent 24px stroke set, same style as the rest of the app) ---------- */
const IC = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    routine: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    habits: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    tasks: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    goals: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    skincare: '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>',
    notes: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    health: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    water: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    steps: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    fitness: '<path d="M6.5 6.5v11"/><path d="M17.5 6.5v11"/><path d="M3 9v6"/><path d="M21 9v6"/><path d="M6.5 12h11"/>',
    progress: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    stats: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    focus: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    social: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5a5 5 0 0 1 4.5 5"/>',
    friends: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/>',
    requests: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    board: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/>',
    community: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/>',
    explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    customize: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3a4.7 4.7 0 0 0 4.7-4.7C22 6 17.5 2 12 2z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>'
};

/* ---------- the one and only navigation definition ----------
   page   : id of the page section (page-<id>) to show
   scroll : element id inside that page to scroll to (for settings sections)
   run    : function name on NAV.actions for non-page entries (Share App, Log Out)
   adv    : hidden in Simple mode (same behaviour as before)                         */
const TREE = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dash', page: 'dashboard' },
    { key: 'routine', label: 'My Routine', icon: 'routine', page: 'habits' },
    { key: 'health', label: 'Health & Fitness', icon: 'health', items: [
        { key: 'water', label: 'Water Tracker', icon: 'water', page: 'water' },
        { key: 'steps', label: 'Steps Tracker', icon: 'steps', page: 'steps' },
        { key: 'fitness', label: 'Fitness Progress', icon: 'fitness', page: 'fitness' }
    ] },
    { key: 'progress', label: 'My Progress', icon: 'progress', items: [
        { key: 'stats', label: 'Statistics', icon: 'stats', page: 'reports' },
        { key: 'achievements', label: 'Achievements', icon: 'trophy', page: 'achievements' },
        { key: 'focus', label: 'Focus Mode', icon: 'focus', page: 'focus', adv: true }
    ] },
    { key: 'social', label: 'Social', icon: 'social', items: [
        { key: 'friends', label: 'Friends', icon: 'friends', page: 'friends' },
        { key: 'requests', label: 'Friend Requests', icon: 'requests', page: 'friends', scroll: 'fxFrRequests' },
        { key: 'leaderboard', label: 'Leaderboard', icon: 'board', page: 'social', adv: true, after: () => { if (window.FX && FX.sTab) FX.sTab('leaderboard'); } },
        { key: 'community', label: 'Community', icon: 'community', page: 'community' },
        { key: 'explore', label: 'Explore', icon: 'explore', page: 'explore' }
    ] },
    { key: 'account', label: 'Account & Settings', icon: 'account', drawerOnly: true, items: [
        { key: 'profile', label: 'Profile', icon: 'account', page: 'profile' },
        { key: 'customize', label: 'Customize App', icon: 'customize', page: 'settings', scroll: 'appearancePanel' },
        { key: 'notifications', label: 'Notifications', icon: 'bell', page: 'settings', scroll: 'notifySettingsPanel' },
        { key: 'privacy', label: 'Privacy & Security', icon: 'lock', page: 'settings', scroll: 'securityPanel' },
        { key: 'share', label: 'Share App', icon: 'share', run: 'shareApp' },
        { key: 'more', label: 'More', icon: 'more', page: 'more' },
        { key: 'logout', label: 'Log Out', icon: 'logout', run: 'logout', danger: true }
    ] }
];

/* page -> default highlighted entry (used when a page is opened from somewhere else in the app) */
const PAGE_KEY = {
    dashboard: 'dashboard', habits: 'routine', goals: 'routine', skincare: 'routine', journal: 'routine',
    water: 'water', steps: 'steps', fitness: 'fitness', reports: 'stats', achievements: 'achievements', focus: 'focus',
    friends: 'friends', social: 'leaderboard', community: 'community', explore: 'explore',
    profile: 'profile', settings: 'customize', more: 'more', smart: 'more',
    pet: 'explore', logs: 'explore', coach: 'explore', garden: 'explore', calendar: 'explore', year: 'explore',
    ramadan: 'explore', life: 'explore', certs: 'explore'
};

const FLAT = {}, GROUP_OF = {};
TREE.forEach(g => {
    FLAT[g.key] = g;
    (g.items || []).forEach(i => { FLAT[i.key] = i; GROUP_OF[i.key] = g.key; });
});
const BOTTOM = TREE.filter(g => !g.drawerOnly); // Dashboard, My Routine, Health & Fitness, My Progress, Social

/* ---------- actions that are not pages ---------- */
const actions = {
    shareApp: async function () {
        const url = location.origin + location.pathname, text = 'I am building better habits with ARISE CORE. Join me!';
        try { if (navigator.share) { await navigator.share({ title: 'ARISE CORE', text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(text + ' ' + url); notify({ type: 'success', title: 'Link copied', message: 'Send it to your friends.' }); }
        catch (e) { notify({ type: 'info', title: 'Copy this link', message: url, duration: 12000 }); }
    },
    logout: function () { if (typeof appMandatoryLogout === 'function') appMandatoryLogout(); }
};

/* ---------- open / close state (remembered between visits) ---------- */
const OPEN_KEY = 'ariseNavOpen';
let openSet = (() => { try { const v = JSON.parse(localStorage.getItem(OPEN_KEY)); if (Array.isArray(v)) return new Set(v); } catch (e) {} return new Set(['routine']); })();
const saveOpen = () => { try { localStorage.setItem(OPEN_KEY, JSON.stringify(Array.from(openSet))); } catch (e) {} };

function setOpen(key, open, persist) {
    const g = q(`.nv-group[data-group="${key}"]`); if (!g) return;
    g.classList.toggle('open', open);
    const head = q('.nv-head', g); if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    const body = q('.nv-sub', g); if (body) body.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) openSet.add(key); else openSet.delete(key);
    if (persist !== false) saveOpen();
}
function toggleGroup(key) { setOpen(key, !openSet.has(key)); }

/* ---------- build the sidebar ---------- */
function subLink(it) {
    return `<a href="#" class="nav-item nv-link${it.adv ? ' fx-adv-nav' : ''}${it.danger ? ' danger' : ''}" data-nav="${it.key}" onclick="NAV.go('${it.key}'); return false;">${svg(IC[it.icon])}<span>${it.label}</span></a>`;
}
function buildSidebar() {
    const host = $('navTree'); if (!host) return;
    host.innerHTML = TREE.map(g => {
        if (!g.items) return `<a href="#" class="nav-item nv-link nv-top${g.drawerOnly ? '' : ' nv-in-bottom'}" data-nav="${g.key}" onclick="NAV.go('${g.key}'); return false;">${svg(IC[g.icon])}<span>${g.label}</span></a>`;
        return `<div class="nv-group${g.drawerOnly ? '' : ' nv-in-bottom'}" data-group="${g.key}">
            <button type="button" class="nav-item nv-head" aria-expanded="false" aria-controls="nvsub-${g.key}" onclick="NAV.toggle('${g.key}')">${svg(IC[g.icon])}<span>${g.label}</span><span class="nv-chev">${svg(IC.chevron)}</span></button>
            <div class="nv-sub" id="nvsub-${g.key}" aria-hidden="true"><div class="nv-sub-in">${g.items.map(subLink).join('')}</div></div>
        </div>`;
    }).join('');
    TREE.forEach(g => { if (g.items) setOpen(g.key, openSet.has(g.key), false); });
}

/* ---------- build the bottom bar (exactly 5 options) ---------- */
function buildBottom() {
    const nav = $('mobileNav'); if (!nav) return;
    nav.innerHTML = BOTTOM.map(g => {
        const click = g.items ? `NAV.sheet('${g.key}')` : `NAV.go('${g.key}')`;
        return `<button type="button" class="mobile-nav-item" data-group="${g.key}" onclick="${click}" aria-label="${g.label}"><span class="mobile-nav-icon">${svg(IC[g.icon])}</span><span class="mn-label">${g.label}</span></button>`;
    }).join('') + `<button type="button" class="mobile-nav-item mn-menu" onclick="NAV.openDrawer()" aria-label="More"><span class="mobile-nav-icon">${svg(IC.menu)}</span><span class="mn-label">More</span></button>`;
}

/* ---------- mobile group sheet (sub-options of the tapped bottom-bar category) ---------- */
function sheetHtml(g) {
    return `<div class="sheet-grab"></div><div class="sheet-title">${svg(IC[g.icon])}<span>${g.label}</span></div>
        <div class="sheet-grid">${g.items.map(it => `<button type="button" class="sheet-card${it.adv ? ' fx-adv' : ''}${it.danger ? ' danger' : ''}" data-nav="${it.key}" onclick="NAV.go('${it.key}')">${svg(IC[it.icon])}<span>${it.label}</span></button>`).join('')}</div>`;
}
function openSheet(key) {
    const g = FLAT[key], sh = $('moreSheet'), bd = $('moreBackdrop'); if (!g || !g.items || !sh) return;
    closeDrawer();
    if (sh.classList.contains('show') && sh.dataset.group === key) return closeSheet();
    sh.innerHTML = sheetHtml(g); sh.dataset.group = key;
    sh.classList.add('show'); if (bd) bd.classList.add('show');
    syncActive();
}
function closeSheet() {
    const sh = $('moreSheet'), bd = $('moreBackdrop');
    if (sh) { sh.classList.remove('show'); delete sh.dataset.group; }
    if (bd) bd.classList.remove('show');
}

/* ---------- mobile drawer (the full sidebar slides in) ---------- */
function openDrawer() { closeSheet(); document.body.classList.add('nav-open'); const b = $('navBackdrop'); if (b) b.classList.add('show'); }
function closeDrawer() { document.body.classList.remove('nav-open'); const b = $('navBackdrop'); if (b) b.classList.remove('show'); }

/* ---------- navigation ---------- */
let pendingKey = null;
const ALIAS = { habits: 'habitsSection', tasks: 'tasksSection', goals: 'goalsSection', skincare: 'skincareSection', journal: 'notesSection' }; // old links now scroll inside My Routine
function go(key) {
    if (ALIAS[key] && !FLAT[key]) { const sec = ALIAS[key]; go('routine'); setTimeout(() => { const el = $(sec); if (el && el.offsetParent !== null) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120); return; }
    const it = FLAT[key]; if (!it) return;
    closeSheet(); closeDrawer();
    if (it.run) { const fn = actions[it.run]; if (fn) fn(); return; }
    if (!it.page) return;
    pendingKey = key;
    try { changePage(it.page, null); } finally { pendingKey = null; }
    if (typeof isUserAuthenticated === 'function' && !isUserAuthenticated()) return;
    syncActive(key);
    if (it.after) { try { it.after(); } catch (e) {} }
    if (it.scroll) {
        const run = n => {
            const el = $(it.scroll);
            if (el && el.offsetParent !== null) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else if (n > 0) setTimeout(() => run(n - 1), 120);
        };
        setTimeout(() => run(5), 60);
    }
}

/* ---------- active highlighting (reads the real page from the DOM, so it is always right) ---------- */
let currentKey = 'dashboard';
function syncActive(forceKey) {
    const act = q('.page-section.active'); const pageId = act ? act.id.replace(/^page-/, '') : 'dashboard';
    let key = forceKey || null;
    if (!key && pendingKey && FLAT[pendingKey] && FLAT[pendingKey].page === pageId) key = pendingKey;
    if (!key && FLAT[currentKey] && FLAT[currentKey].page === pageId) key = currentKey; // keep e.g. "Friend Requests" highlighted
    if (!key) key = PAGE_KEY[pageId] || 'dashboard';
    currentKey = key;
    const gk = GROUP_OF[key] || key;
    document.body.dataset.page = pageId;

    qa('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
    qa('.nv-link').forEach(n => { n.classList.toggle('active', n.dataset.nav === key); if (n.dataset.nav === key) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current'); });
    qa('.nv-head').forEach(h => h.classList.toggle('has-active', h.parentNode.dataset.group === gk));
    if (GROUP_OF[key] && !openSet.has(gk)) setOpen(gk, true);
    qa('.mobile-nav-item').forEach(n => n.classList.toggle('active', n.dataset.group === gk));
    qa('.sheet-card').forEach(n => n.classList.toggle('active', n.dataset.nav === key));
}

/* ---------- search (lives at the very top of the Dashboard) ---------- */
function pageMatches(text) {
    const t = String(text || '').trim().toLowerCase(); if (t.length < 2) return [];
    const out = [];
    TREE.forEach(g => {
        const list = g.items ? g.items.map(i => [i, g.label]) : [[g, 'Home']];
        list.forEach(([it, parent]) => {
            if (it.run || it.danger) return;
            if (it.label.toLowerCase().includes(t)) out.push({ type: 'Page', text: it.label + (g.items ? ' · ' + parent : ''), nav: it.key });
        });
    });
    return out.slice(0, 4);
}
function dashSearch(v) {
    const box = $('dashSearchResults'); if (!box) return;
    const t = String(v || '').trim();
    if (t.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    let items = [];
    try { items = (typeof searchItems === 'function' ? searchItems(t) : []); } catch (e) {}
    box.innerHTML = renderSearchHtml(items) || '';
    box.hidden = false;
}
function clearDashSearch() { const i = $('dashSearchInput'), b = $('dashSearchResults'); if (i) i.value = ''; if (b) { b.hidden = true; b.innerHTML = ''; } }
function focusSearch() {
    if (typeof isUserAuthenticated === 'function' && !isUserAuthenticated()) return;
    closeSheet(); closeDrawer();
    const onDash = q('#page-dashboard.active');
    if (!onDash) { pendingKey = 'dashboard'; try { changePage('dashboard', null); } finally { pendingKey = null; } syncActive('dashboard'); }
    const i = $('dashSearchInput');
    setTimeout(() => { if (i) { try { i.scrollIntoView({ block: 'center' }); } catch (e) {} i.focus(); i.select(); } }, 80);
}

/* ---------- wiring ---------- */
function wire() {
    const orig = window.changePage;
    if (typeof orig === 'function' && !orig.__navWrapped) {
        const wrapped = function () { const r = orig.apply(this, arguments); try { syncActive(); clearDashSearch(); } catch (e) {} return r; };
        wrapped.__navWrapped = true; window.changePage = wrapped;
    }
    document.addEventListener('click', e => { const s = $('dashSearch'); if (s && !s.contains(e.target)) { const b = $('dashSearchResults'); if (b) b.hidden = true; } });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeSheet(); closeDrawer(); const i = $('dashSearchInput'); if (i && document.activeElement === i) { clearDashSearch(); i.blur(); } }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) { closeDrawer(); closeSheet(); } });
    // old helpers that other code may still call
    window.toggleMore = () => openSheet('social');
    window.closeMore = closeSheet;
}

window.NAV = { go, toggle: toggleGroup, sheet: openSheet, closeSheet, openDrawer, closeDrawer, focusSearch, search: dashSearch, searchPages: pageMatches, actions, tree: TREE, sync: syncActive, icon: IC };

buildSidebar(); buildBottom(); wire(); syncActive();
// the "Fitness" and "More" pages are created by features.js on boot; re-sync once everything is ready
window.addEventListener('load', () => setTimeout(syncActive, 50));
})();
