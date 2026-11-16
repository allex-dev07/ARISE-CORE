/* ARISE CORE: Steps and Water 7-day charts on the Dashboard.
   Reads appState.fx.steps (days, goal) and appState.water (days, goal). Loaded after the main scripts. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', sig = '';
  var st = document.createElement('style');
  st.textContent =
    '.dc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}' +
    '.dc-big{font-size:26px;font-weight:800;line-height:1.1;margin-top:10px}.dc-big small{font-size:13px;font-weight:600;color:var(--text-muted)}' +
    '.dc-link{background:transparent;border:1px solid var(--border-color);color:var(--text-muted);border-radius:10px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}' +
    '.dc-svg{width:100%;height:auto;display:block;margin-top:10px}' +
    '.dc-bar{transform-box:fill-box;transform-origin:50% 100%;animation:dcGrow .6s ease both}' +
    '@keyframes dcGrow{from{transform:scaleY(.02)}to{transform:scaleY(1)}}' +
    '.dc-sum{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:12px;color:var(--text-muted)}.dc-sum b{color:var(--text-main);font-weight:700}' +
    '.dc-empty{font-size:12px;color:var(--text-muted);margin-top:6px}' +
    '@media (prefers-reduced-motion:reduce){.dc-bar{animation:none}}';
  document.head.appendChild(st);

  function num(v) { v = Number(v); return isFinite(v) && v > 0 ? v : 0; }
  function days7() { var o = []; for (var i = 6; i >= 0; i--) o.push(getPastDateStr(i)); return o; }
  function dayLabel(ds) { var p = ds.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-US', { weekday: 'short' }); }
  function stepsData() {
    var f = (typeof appState !== 'undefined' && appState.fx && appState.fx.steps) || {}, d = f.days || {}, goal = Math.max(500, Math.round(Number(f.goal)) || 8000);
    return { goal: goal, vals: days7().map(function (k) { return Math.floor(num(d[k])); }) };
  }
  function waterData() {
    var w = (typeof appState !== 'undefined' && appState.water) || {}, d = w.days || {}, goal = Math.max(500, Math.round(Number(w.goal)) || 2000);
    return { goal: goal, vals: days7().map(function (k) { var x = d[k]; return x && x.entries ? x.entries.reduce(function (n, e) { return n + num(e.ml); }, 0) : 0; }) };
  }
  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e); return e;
  }
  function short(n, unit) {
    if (unit === 'ml') return n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'L' : String(n);
    return n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'k' : String(n);
  }
  function chart(host, data, color, unit) {
    var W = 340, H = 190, pl = 40, pr = 8, pt = 14, pb = 28, cw = W - pl - pr, ch = H - pt - pb;
    var max = Math.max(data.goal, Math.max.apply(null, data.vals)) * 1.12;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'dc-svg', role: 'img', 'aria-label': unit === 'ml' ? 'Water in the last 7 days' : 'Steps in the last 7 days' });
    [0, .5, 1].forEach(function (g) {
      var y = pt + ch - g * ch;
      el('line', { x1: pl, y1: y, x2: W - pr, y2: y, 'class': 'chart-grid-line' }, svg);
      el('text', { x: pl - 6, y: y + 4, 'text-anchor': 'end', 'class': 'chart-axis-text' }, svg, short(Math.round(g * max), unit));
    });
    var slot = cw / 7, bw = Math.min(26, slot * .62), labels = days7();
    data.vals.forEach(function (v, i) {
      var h = Math.max(v ? 3 : 0, v / max * ch), x = pl + i * slot + (slot - bw) / 2, y = pt + ch - h, met = v >= data.goal, today = i === 6;
      if (h > 0) el('rect', { x: x, y: y, width: bw, height: h, rx: 6, fill: color, opacity: met || today ? 1 : .5, 'class': 'dc-bar', style: 'animation-delay:' + (i * 50) + 'ms' }, svg);
      else el('rect', { x: x, y: pt + ch - 3, width: bw, height: 3, rx: 1.5, fill: color, opacity: .18 }, svg);
      el('text', { x: x + bw / 2, y: H - 8, 'text-anchor': 'middle', 'class': 'chart-axis-text', 'font-weight': today ? '700' : '400' }, svg, today ? 'Today' : dayLabel(labels[i]));
    });
    var gy = pt + ch - data.goal / max * ch;
    el('line', { x1: pl, y1: gy, x2: W - pr, y2: gy, stroke: color, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', opacity: .85 }, svg);
    host.appendChild(svg);
  }
  function panel(id, title, unit, data, color, fmt) {
    var sec = document.getElementById(id), vals = data.vals, today = vals[6], avg = Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / 7), hit = vals.filter(function (v) { return v >= data.goal; }).length;
    sec.innerHTML = '';
    var head = document.createElement('div'); head.className = 'dc-head';
    head.innerHTML = '<div><h2 class="panel-title" style="margin-bottom:5px;"></h2><p style="color:var(--text-muted);font-size:13px;">Last 7 days</p></div>';
    head.querySelector('h2').textContent = title;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'dc-link'; b.textContent = 'Details';
    b.onclick = function () { if (typeof changePage === 'function') changePage('water', null); };
    head.appendChild(b); sec.appendChild(head);
    var big = document.createElement('div'); big.className = 'dc-big'; big.innerHTML = '<span></span> <small></small>';
    big.querySelector('span').textContent = fmt(today); big.querySelector('small').textContent = 'today / goal ' + fmt(data.goal);
    sec.appendChild(big);
    chart(sec, data, color, unit);
    var sum = document.createElement('div'); sum.className = 'dc-sum';
    sum.innerHTML = '<span>Average <b></b></span><span>Goal reached <b></b></span>';
    var bs = sum.querySelectorAll('b'); bs[0].textContent = fmt(avg); bs[1].textContent = hit + ' of 7 days';
    sec.appendChild(sum);
    if (!vals.some(function (v) { return v > 0; })) {
      var e = document.createElement('div'); e.className = 'dc-empty';
      e.textContent = unit === 'ml' ? 'No water logged yet. Add a drink in the Water Tracker.' : 'No steps yet. Add steps in Health > Steps Tracker.';
      sec.appendChild(e);
    }
  }
  function ensure() {
    var dash = document.getElementById('page-dashboard'); if (!dash) return false;
    var anchor = dash.querySelector('[data-sec="statistics"]'); if (!anchor) return false;
    var prev = anchor;
    [['dcSteps', 'steps-chart'], ['dcWater', 'water-chart']].forEach(function (p) {
      var s = document.getElementById(p[0]);
      if (!s) { s = document.createElement('section'); s.className = 'panel'; s.id = p[0]; s.setAttribute('data-sec', p[1]); }
      if (s.previousElementSibling !== prev) prev.insertAdjacentElement('afterend', s);
      prev = s;
    });
    return true;
  }
  function sync(force) {
    try {
      if (!ensure()) return;
      var a = stepsData(), w = waterData(), s = JSON.stringify([a, w]) + (document.getElementById('page-dashboard').classList.contains('active') ? 1 : 0);
      if (!force && s === sig) return;
      sig = s;
      panel('dcSteps', 'Steps', 'steps', a, 'var(--neon-cyan)', function (n) { return Number(n).toLocaleString('en-US'); });
      panel('dcWater', 'Water', 'ml', w, '#4aa3ff', function (n) { return Number(n).toLocaleString('en-US') + ' ml'; });
    } catch (e) {}
  }
  sync(true);
  setInterval(sync, 2000);
  window.addEventListener('resize', function () { sync(true); });
})();
