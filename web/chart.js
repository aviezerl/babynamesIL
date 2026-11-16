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
 * opts: { x: [years], series: [{label, tip?, color, dash?, values}],
 *         fmt: v => string (axis + tooltip), aria: string }
 * label is drawn at the line end; tip (default: label) is used in the tooltip.
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
    const H = Math.round(Math.min(320, Math.max(200, W * 0.5)));
    const { x: xs, series, fmt } = opts;
    const vmax = Math.max(1e-9, ...series.flatMap(s => s.values));
    const step = niceStep(vmax), ymax = Math.ceil(vmax / step - 1e-9) * step;
    const ticks = [];
    for (let t = 0; t <= ymax + step / 2; t += step) ticks.push(t);
    const font = `500 13px ${getComputedStyle(box).fontFamily}`;
    const R = Math.max(52, 12 + Math.ceil(Math.max(...series.map(s => textWidth(s.label, font)))));
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
      const pts = s.values.map((v, i) => `${X(xs[i]).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
      const attrs = { points: pts, fill: 'none', stroke: s.color, 'stroke-width': 2.25, 'stroke-linejoin': 'round' };
      if (s.dash) attrs['stroke-dasharray'] = DASH;
      svg.append(svgEl('polyline', attrs));
      ends.push({ s, y: Y(s.values[s.values.length - 1]) });
    }
    const gap = 15, top = T + 4, bottom = H - B;
    ends.sort((a, b) => a.y - b.y);
    ends.forEach((e, i) => { e.y = Math.max(e.y, i ? ends[i - 1].y + gap : top); });
    for (let i = ends.length - 1; i >= 0; i--) ends[i].y = Math.min(ends[i].y, i === ends.length - 1 ? bottom : ends[i + 1].y - gap);
    for (const e of ends) svg.append(svgEl('text', { x: W - R + 6, y: e.y + 4, class: 'endlabel' }, e.s.label));

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
      dots.forEach((d, j) => { d.setAttribute('cx', cx); d.setAttribute('cy', Y(series[j].values[i])); d.setAttribute('visibility', 'visible'); });
      tip.replaceChildren(Object.assign(document.createElement('b'), { textContent: xs[i] }));
      for (const s of [...series].sort((a, b) => b.values[i] - a.values[i])) {
        const row = document.createElement('span');
        const dot = document.createElement('i');
        dot.style.background = s.color;
        row.append(dot, `${s.tip || s.label} ${fmt(s.values[i])}`);
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
  return box;
}
