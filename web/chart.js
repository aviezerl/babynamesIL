// Small SVG line chart: lines labelled at their right end, one tooltip listing every
// series at the hovered year (sorted by value), no zoom. Redraws when its container resizes.
// ponytail: hand-written instead of Observable Plot + d3 (161 KB gzipped) since the
// site only needs this one chart type.

const NS = 'http://www.w3.org/2000/svg';
export const svgEl = (tag, attrs = {}, text) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text != null) e.textContent = text;
  return e;
};
export const DASH = '6 4';

function niceStep(max, target = 4) {
  const raw = max / target, p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw);
}

let ctx2d;
function textWidth(text, font) {
  ctx2d ||= document.createElement('canvas').getContext('2d');
  ctx2d.font = font;
  return ctx2d.measureText(text).width;
}

/**
 * opts: { x: [years], series: [{label, tip?, color, dash?, values, note?}],
 *         fmt: v => string (axis + tooltip), aria: string }
 * label is drawn at the line end; tip (default: label) is used in the tooltip, followed by
 * note(i) if given and non-empty (e.g. the count behind a share).
 * A null value is a gap (no data that year): the line breaks and the tooltip skips it.
 */
export function lineChart(opts) {
  const box = document.createElement('div');
  box.className = 'chart';
  const tip = document.createElement('div');
  tip.className = 'tip' + (opts.series.length > 2 ? ' col' : '');
  tip.setAttribute('aria-hidden', 'true');
  let lastW = 0;

  function draw() {
    const W = Math.round(box.clientWidth);
    if (W < 160 || W === lastW) return; // not laid out yet; the observer fires again
    lastW = W;
    build(W, true);
  }

  // live: wire hover/tap and put the chart in the box; otherwise just return the SVG (for chartPNG)
  function build(W, live) {
    const H = Math.round(Math.min(320, Math.max(200, W * 0.5)));
    const { x: xs, series, fmt } = opts;
    const vmax = Math.max(1e-9, ...series.flatMap(s => s.values).filter(v => v != null));
    const step = niceStep(vmax), ymax = Math.ceil(vmax / step - 1e-9) * step;
    const ticks = [];
    for (let t = 0; t <= ymax + step / 2; t += step) ticks.push(t);
    const font = `500 13px ${getComputedStyle(box).fontFamily}`;
    const R = Math.max(52, 17 + Math.ceil(Math.max(...series.map(s => textWidth(s.label, font)))));
    const L = 10 + 7 * Math.max(...ticks.map(t => fmt(t, step).length)), T = 12, B = 26;
    const x0 = xs[0], x1 = xs[xs.length - 1];
    const X = yr => L + (yr - x0) / (x1 - x0) * (W - L - R);
    const Y = v => T + (1 - v / ymax) * (H - T - B);

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': opts.aria || '' });
    for (const t of ticks) {
      svg.append(svgEl('line', { x1: L, x2: W - R, y1: Y(t), y2: Y(t), class: 'grid' }));
      svg.append(svgEl('text', { x: L - 6, y: Y(t) + 4, 'text-anchor': 'end', class: 'axis' }, fmt(t, step)));
    }
    const every = W < 480 ? 20 : 10;
    for (let yr = Math.ceil(x0 / every) * every; yr <= x1; yr += every)
      svg.append(svgEl('text', { x: X(yr), y: H - 6, 'text-anchor': 'middle', class: 'axis' }, yr));

    // lines, then end labels nudged apart (down, then back up from the bottom) so they don't overlap
    const ends = [];
    for (const s of series) {
      const d = s.values.map((v, i) => (v == null ? '' : `${i && s.values[i - 1] != null ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(v).toFixed(1)}`)).join('');
      const attrs = { d, fill: 'none', stroke: s.color, 'stroke-width': 2.25, 'stroke-linejoin': 'round' };
      if (s.dash) attrs['stroke-dasharray'] = DASH;
      const line = svgEl('path', attrs);
      svg.append(line);
      const y = Y(s.values.findLast(v => v != null) ?? 0);
      ends.push({ s, line, y, y0: y });
    }
    const gap = 15, top = T + 4, bottom = H - B;
    ends.sort((a, b) => a.y - b.y);
    ends.forEach((e, i) => { e.y = Math.max(e.y, i ? ends[i - 1].y + gap : top); });
    for (let i = ends.length - 1; i >= 0; i--) ends[i].y = Math.min(ends[i].y, i === ends.length - 1 ? bottom : ends[i + 1].y - gap);
    // Labels take their line's colour; a short connector joins a nudged label to its line end.
    // Hovering (or tapping) a label fades the other lines.
    const focus = on => ends.forEach(e => {
      const dim = on && e !== on;
      e.line.setAttribute('stroke-opacity', dim ? 0.15 : 1);
      e.text.setAttribute('opacity', dim ? 0.35 : 1);
      e.conn?.setAttribute('opacity', dim ? 0.15 : 1);
    });
    let focused = null;
    for (const e of ends) {
      if (Math.abs(e.y - e.y0) > 2) {
        e.conn = svgEl('polyline', { points: `${W - R},${e.y0} ${W - R + 4},${e.y0} ${W - R + 9},${e.y}`, fill: 'none', stroke: e.s.color, 'stroke-width': 1.25 });
        svg.append(e.conn);
      }
      e.text = svgEl('text', { x: W - R + 11, y: e.y + 4, class: 'endlabel', fill: e.s.color }, e.s.label);
      if (live && series.length > 1) {
        e.text.addEventListener('pointerenter', ev => { if (ev.pointerType === 'mouse') focus(e); });
        e.text.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') { focused = null; focus(null); } });
        e.text.addEventListener('click', () => { focused = focused === e ? null : e; focus(focused); });
      }
      svg.append(e.text);
    }
    if (!live) return svg;

    const cross = svgEl('line', { y1: T, y2: H - B, class: 'cross', visibility: 'hidden' });
    const dots = series.map(s => svgEl('circle', { r: 4.5, fill: s.color, class: 'dot', visibility: 'hidden' }));
    const hit = svgEl('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'transparent' });
    svg.append(cross, ...dots, hit);

    const show = ev => {
      const r = svg.getBoundingClientRect();
      const px = (ev.clientX - r.left) * W / r.width;
      const i = Math.max(0, Math.min(xs.length - 1, Math.round((px - L) / (W - L - R) * (x1 - x0))));
      const cx = X(xs[i]);
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
      dots.forEach((d, j) => { const v = series[j].values[i]; d.setAttribute('cx', cx); d.setAttribute('cy', Y(v ?? 0)); d.setAttribute('visibility', v == null ? 'hidden' : 'visible'); });
      tip.replaceChildren(Object.assign(document.createElement('b'), { textContent: xs[i] }));
      for (const s of series.filter(s => s.values[i] != null).sort((a, b) => b.values[i] - a.values[i])) {
        const row = document.createElement('span');
        const dot = document.createElement('i');
        dot.style.background = s.color;
        const note = s.note?.(i);
        row.append(dot, `${s.tip || s.label} ${fmt(s.values[i])}${note ? ` · ${note}` : ''}`);
        tip.append(row);
      }
      tip.style.opacity = 1;
      const tx = cx * r.width / W;
      tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, tx - tip.offsetWidth / 2)) + 'px';
    };
    const hide = () => { tip.style.opacity = 0; cross.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); };
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') hide(); }); // touch: keep the last tooltip
    box.replaceChildren(svg, tip);
  }

  new ResizeObserver(draw).observe(box);
  box.snapshot = W => build(W, false);
  return box;
}

/**
 * Bubble chart (the one-year jumps): x = year, y on a log scale, circle area ~ size, a label beside,
 * above or below each circle where it fits (biggest first; skipped if it would cover a label or a circle).
 * opts: { points: [{x, y, size, color, label, aria, open?}], x0, x1, fmtY, onPick: i => void, aria }
 * open: drawn hollow. Clicking a circle or its label (or Enter/Space on a focused circle) picks it.
 */
export function bubbleChart(opts) {
  const box = document.createElement('div');
  box.className = 'chart';
  let lastW = 0, sel = -1, circles = [];
  const pick = i => { sel = i; circles.forEach((c, j) => c.classList.toggle('on', j === i)); opts.onPick(i); };

  function draw() {
    const W = Math.round(box.clientWidth);
    if (W < 160 || W === lastW) return;
    lastW = W;
    const { points, x0, x1, fmtY } = opts;
    const H = Math.round(Math.min(360, Math.max(240, W * 0.55)));
    const ymax = Math.max(...points.map(p => p.y));
    const all = [3, 5, 10, 20, 50, 100], ticks = all.slice(0, all.findIndex(t => t >= ymax) + 1 || all.length);
    const L = 14 + 7 * Math.max(...ticks.map(t => fmtY(t).length)), R = 14, T = 16, B = 26;
    const lo = Math.log(ticks[0] * 0.9), hi = Math.log(ticks[ticks.length - 1]);
    const X = v => L + (v - x0) / (x1 - x0) * (W - L - R);
    const Y = v => T + (1 - (Math.log(v) - lo) / (hi - lo)) * (H - T - B);
    const smax = Math.max(...points.map(p => p.size)), rad = s => 3.5 + (W < 480 ? 7 : 10) * Math.sqrt(s / smax);

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'group', 'aria-label': opts.aria || '' });
    for (const t of ticks) {
      svg.append(svgEl('line', { x1: L, x2: W - R, y1: Y(t), y2: Y(t), class: 'grid' }));
      svg.append(svgEl('text', { x: L - 6, y: Y(t) + 4, 'text-anchor': 'end', class: 'axis' }, fmtY(t)));
    }
    const every = W < 480 ? 20 : 10;
    for (let yr = Math.ceil(x0 / every) * every; yr <= x1; yr += every)
      svg.append(svgEl('text', { x: X(yr), y: H - 6, 'text-anchor': 'middle', class: 'axis' }, yr));

    // biggest first, so small circles are drawn on top and get their labels placed first after the big ones
    const order = points.map((_, i) => i).sort((a, b) => points[b].size - points[a].size);
    circles = [];
    const labels = svgEl('g'), placed = [], font = `12px ${getComputedStyle(box).fontFamily}`;
    const geo = points.map(p => ({ cx: X(p.x), cy: Y(p.y), r: rad(p.size) }));
    const over = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const free = (b, own) => b.x >= L && b.x + b.w <= W - R && b.y >= 0 && b.y + b.h <= H - B
      && !placed.some(o => over(o, b)) && !geo.some((g, j) => j !== own && over(b, { x: g.cx - g.r, y: g.cy - g.r, w: 2 * g.r, h: 2 * g.r }));
    for (const i of order) {
      const p = points[i], { cx, cy, r } = geo[i];
      const c = svgEl('circle', { cx, cy, r, fill: p.open ? 'transparent' : p.color, stroke: p.color, class: 'bub' + (i === sel ? ' on' : ''),
        tabindex: 0, role: 'button', 'aria-label': p.aria });
      c.append(svgEl('title', {}, p.aria));
      c.addEventListener('click', () => pick(i));
      c.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(i); } });
      circles[i] = c;
      svg.append(c);
      const w = textWidth(p.label, font) + 2, hgt = 14;
      const spots = [{ x: cx + r + 3, y: cy - hgt / 2 }, { x: cx - r - 3 - w, y: cy - hgt / 2 },
        { x: cx - w / 2, y: cy - r - 1 - hgt }, { x: cx - w / 2, y: cy + r + 1 }];
      for (const { x, y } of spots) {
        const b = { x, y, w, h: hgt };
        if (!free(b, i)) continue;
        placed.push(b);
        const tx = svgEl('text', { x, y: y + 10.5, class: 'blabel' }, p.label);
        tx.addEventListener('click', () => pick(i));
        labels.append(tx);
        break;
      }
    }
    svg.append(labels);
    box.replaceChildren(svg);
  }

  new ResizeObserver(draw).observe(box);
  return box;
}

const RLE = String.fromCharCode(0x202b), PDF = String.fromCharCode(0x202c);

/**
 * The chart as a PNG Blob for sharing: title, subtitle, totals (items joined with " · ", wrapped
 * to the width), chart heading, the chart redrawn at a fixed width, an optional line key
 * [{label, dash}], and a footer. rtl right-aligns the text.
 */
export async function chartPNG(box, { title, sub, totals = [], heading, key = [], foot, rtl }) {
  const W = 600, P = 24, scale = 2;
  const ff = getComputedStyle(box).fontFamily;
  const lines = [];
  for (const it of totals) {
    const cand = lines.length ? `${lines[lines.length - 1]} · ${it}` : it;
    if (lines.length && textWidth(cand, `15px ${ff}`) <= W - 2 * P) lines[lines.length - 1] = cand;
    else lines.push(it);
  }
  const head = [[title, 26, 700, 'var(--ink)'], [sub, 15, 400, 'var(--muted)'],
    ...lines.map(s => [s, 15, 400, 'var(--ink)']), [heading, 13, 600, 'var(--ink)']];
  let y = P;
  const headY = head.map(([, size], i) => (y += i ? size + 9 : size));
  const top = y + 8;
  const chart = box.snapshot(W - 2 * P);
  const cH = +chart.getAttribute('height');
  const keyY = top + cH + 22, H = top + cH + (key.length ? 36 : 8) + 34;
  const svg = svgEl('svg', { width: W * scale, height: H * scale, viewBox: `0 0 ${W} ${H}`, 'font-family': ff });
  // copies of the .chart rules in style.css; an SVG drawn as an image can't see the page's CSS
  svg.append(svgEl('style', {}, '.grid{stroke:var(--grid)}.axis{font-size:12px;fill:var(--faint)}.endlabel{font-size:13px;font-weight:700}'));
  svg.append(svgEl('rect', { width: W, height: H, fill: '#fff' }));
  // RLE ... PDF embeds the text right-to-left, so mixed Hebrew/numbers read correctly
  const x = rtl ? W - P : P, anchor = rtl ? 'end' : 'start', bidi = s => (rtl ? RLE + s + PDF : s);
  const text = (y, s, attrs) => svgEl('text', { x, y, 'text-anchor': anchor, ...attrs }, bidi(s));
  head.forEach(([s, size, weight, fill], i) => svg.append(text(headY[i], s, { 'font-size': size, 'font-weight': weight, fill })));
  chart.setAttribute('x', P); chart.setAttribute('y', top);
  svg.append(chart);
  let kx = x;
  for (const k of key) {
    const lx = rtl ? kx - 26 : kx, tx = rtl ? lx - 7 : lx + 33;
    svg.append(svgEl('line', { x1: lx, x2: lx + 26, y1: keyY - 4, y2: keyY - 4, stroke: 'var(--muted)', 'stroke-width': 2.25, ...(k.dash ? { 'stroke-dasharray': DASH } : {}) }),
      svgEl('text', { x: tx, y: keyY, 'text-anchor': anchor, 'font-size': 13, fill: 'var(--muted)' }, bidi(k.label)));
    const w = textWidth(k.label, `13px ${ff}`) + 20;
    kx = rtl ? tx - w : tx + w;
  }
  svg.append(text(H - 16, foot, { 'font-size': 13, fill: 'var(--faint)' }));

  const root = getComputedStyle(document.documentElement);
  const src = new XMLSerializer().serializeToString(svg).replace(/var\((--[\w-]+)\)/g, (_, v) => root.getPropertyValue(v).trim());
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = W * scale; c.height = H * scale;
  c.getContext('2d').drawImage(img, 0, 0);
  return new Promise(res => c.toBlob(res, 'image/png'));
}
