/* GBAKI — élément « graphique » : barres, colonnes, courbe, aires, secteurs, anneau (rendu SVG autonome). */
(function () {
  const G = window.GBAKI;

  const KINDS = [['column', 'Colonnes'], ['bar', 'Barres'], ['line', 'Courbe'], ['area', 'Aires'], ['pie', 'Secteurs'], ['donut', 'Anneau']];
  const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#84cc16', '#f97316', '#14b8a6'];
  const DEMO = [
    { label: 'Jan', value: 12 }, { label: 'Fév', value: 19 }, { label: 'Mar', value: 15 },
    { label: 'Avr', value: 24 }, { label: 'Mai', value: 21 }, { label: 'Juin', value: 30 },
  ];

  /* ---------- Outils ---------- */
  const r2 = (n) => Math.round(n * 100) / 100;
  // Nombre au format français : espace insécable pour les milliers, virgule décimale.
  function fmt(v) {
    const neg = v < 0;
    const [int, dec] = String(Math.abs(r2(v))).split('.');
    const s = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? ',' + dec : '');
    return (neg ? '−' : '') + s;
  }
  const textW = (s, fs) => String(s).length * fs * 0.56; // estimation de largeur
  function fit(s, maxW, fs) {
    s = String(s);
    if (textW(s, fs) <= maxW) return s;
    const n = Math.max(1, Math.floor(maxW / (fs * 0.56)) - 1);
    return s.slice(0, n) + '…';
  }
  // Graduations « rondes » (1, 2, 2,5, 5 × 10^n) couvrant [lo, hi].
  function niceTicks(lo, hi, count) {
    if (lo === hi) hi = lo + 1;
    const raw = (hi - lo) / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step;
    const ticks = [];
    for (let i = 0; a + i * step <= b + step / 2; i++) {
      const v = +(a + i * step).toPrecision(12);
      ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    }
    return ticks;
  }

  // Lecture robuste des lignes « Libellé; valeur ».
  function parseNumber(s) {
    s = String(s).replace(/[\s  ]/g, '').replace(/[^\d,.\-−]/g, '').replace('−', '-');
    const c = (s.match(/,/g) || []).length, d = (s.match(/\./g) || []).length;
    if (c && d) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (c > 1) s = s.replace(/,/g, '');
    else if (c === 1) s = s.replace(',', '.');
    else if (d > 1) s = s.replace(/\./g, '');
    const v = parseFloat(s);
    return isFinite(v) ? v : null;
  }
  function parseData(text) {
    const out = [];
    for (let line of String(text).split(/\r?\n/)) {
      line = line.trim();
      if (!line) continue;
      let m = line.match(/^(.*)[;\t|=:](.*)$/) || line.match(/^(.*?)\s+(-?[\d\s., ]+\S*)$/);
      const label = m ? m[1].replace(/[\s,;:]+$/, '').trim() : line;
      const value = m ? parseNumber(m[2]) : null;
      if (value != null) out.push({ label, value });
    }
    return out;
  }
  const dataText = (data) => data.map((d) => `${d.label}; ${String(d.value).replace('.', ',')}`).join('\n');

  /* ---------- Rendu ---------- */
  function render(el) {
    const W = el.w, H = el.h;
    const data = (el.data || []).filter((d) => d && isFinite(d.value));
    const col = el.textColor || '#1f2937';
    const ff = G.esc(`${el.fontFamily || 'Arial'}, Helvetica, sans-serif`);
    const colors = el.colors && el.colors.length ? el.colors : COLORS;
    const fs = Math.max(9, Math.min(W, H) / 22);
    const pad = Math.min(W, H) * 0.05;
    const out = [];
    const txt = (x, y, s, o = {}) => out.push(`<text x="${r2(x)}" y="${r2(y)}" font-size="${r2(o.fs || fs)}"` +
      `${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.weight ? ` font-weight="${o.weight}"` : ''}` +
      ` fill="${G.esc(o.fill || col)}"${o.op ? ` fill-opacity="${o.op}"` : ''} dominant-baseline="${o.base || 'alphabetic'}">${G.esc(s)}</text>`);

    let top = pad;
    if (el.title) {
      const tfs = fs * 1.35;
      txt(W / 2, top + tfs * 0.85, fit(el.title, W - 2 * pad, tfs), { fs: tfs, weight: 700, anchor: 'middle' });
      top += tfs * 1.6;
    }
    if (!data.length) {
      txt(W / 2, (top + H) / 2, 'Aucune donnée', { anchor: 'middle', op: 0.6, base: 'middle' });
    } else if (el.kind === 'pie' || el.kind === 'donut') {
      pie(el, data, { W, H, top, pad, fs, col, colors, txt, out });
    } else {
      axes(el, data, { W, H, top, pad, fs, col, colors, txt, out });
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${ff}">${out.join('')}</svg>`;
  }

  // Colonnes, barres, courbe et aires : axe des valeurs gradué, grille légère.
  function axes(el, data, c) {
    const { W, H, pad, fs, col, txt, out } = c;
    let top = c.top + (el.showValues ? fs * 0.9 : fs * 0.4);
    const color = G.esc(c.colors[0]);
    const vals = data.map((d) => d.value);
    const horiz = el.kind === 'bar';
    const lo0 = Math.min(0, ...vals), hi0 = Math.max(0, ...vals);
    const plotLen = horiz ? W * 0.6 : H - top - pad;
    const ticks = niceTicks(lo0, hi0, Math.max(2, Math.min(8, Math.floor(plotLen / (fs * (horiz ? 5 : 2.6))))));
    const lo = ticks[0], hi = ticks[ticks.length - 1];
    const tfs = fs * 0.85;
    const grid = (x1, y1, x2, y2, zero) => out.push(`<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${G.esc(col)}" stroke-opacity="${zero ? 0.45 : 0.12}" stroke-width="${zero ? Math.max(1, fs / 14) : Math.max(1, fs / 22)}"/>`);
    const n = data.length;

    if (horiz) {
      const labW = Math.min(W * 0.32, Math.max(...data.map((d) => textW(d.label, fs))) + fs * 0.6);
      const x0 = pad + labW, x1 = W - pad - (el.showValues ? Math.max(...vals.map((v) => textW(fmt(v), tfs))) + fs * 0.4 : fs * 0.5);
      const y0 = top, y1 = H - pad - fs * 1.4;
      const X = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
      for (const t of ticks) {
        grid(X(t), y0, X(t), y1, t === 0);
        txt(X(t), y1 + fs * 1.1, fmt(t), { fs: tfs, anchor: 'middle', op: 0.65 });
      }
      const band = (y1 - y0) / n, bh = band * 0.64, rad = Math.min(bh * 0.2, fs * 0.4);
      data.forEach((d, i) => {
        const yc = y0 + band * (i + 0.5);
        txt(x0 - fs * 0.5, yc, fit(d.label, labW - fs * 0.5, fs), { anchor: 'end', base: 'middle' });
        const a = X(0), b = X(d.value);
        out.push(barPath(Math.min(a, b), yc - bh / 2, Math.abs(b - a), bh, rad, d.value >= 0 ? 'right' : 'left', color));
        if (el.showValues) txt(b + (d.value >= 0 ? fs * 0.35 : -fs * 0.35), yc, fmt(d.value), { fs: tfs, weight: 600, anchor: d.value >= 0 ? 'start' : 'end', base: 'middle' });
      });
      return;
    }

    const labW = Math.max(...ticks.map((t) => textW(fmt(t), tfs))) + fs * 0.6;
    const x0 = pad + labW, x1 = W - pad, y0 = top, y1 = H - pad - fs * 1.5;
    const Y = (v) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);
    for (const t of ticks) {
      grid(x0, Y(t), x1, Y(t), t === 0);
      txt(x0 - fs * 0.4, Y(t), fmt(t), { fs: tfs, anchor: 'end', base: 'middle', op: 0.65 });
    }
    const band = (x1 - x0) / n;
    const step = Math.max(1, Math.ceil((fs * 2.2) / band)); // saute des libellés si trop serrés
    data.forEach((d, i) => {
      if (i % step === 0) txt(x0 + band * (i + 0.5), y1 + fs * 1.2, fit(d.label, band * step - fs * 0.3, fs), { anchor: 'middle' });
    });
    if (el.kind === 'column') {
      const bw = band * 0.62, rad = Math.min(bw * 0.18, fs * 0.45);
      data.forEach((d, i) => {
        const xc = x0 + band * (i + 0.5), a = Y(0), b = Y(d.value);
        out.push(barPath(xc - bw / 2, Math.min(a, b), bw, Math.abs(a - b), rad, d.value >= 0 ? 'top' : 'bottom', color));
        if (el.showValues) txt(xc, d.value >= 0 ? b - fs * 0.35 : b + fs * 1.05, fmt(d.value), { fs: tfs, weight: 600, anchor: 'middle' });
      });
    } else {
      const pts = data.map((d, i) => [x0 + band * (i + 0.5), Y(d.value)]);
      const line = pts.map((p, i) => (i ? 'L' : 'M') + r2(p[0]) + ' ' + r2(p[1])).join('');
      const sw = Math.max(1.5, fs * 0.16);
      if (el.kind === 'area') {
        const z = Y(Math.max(lo, Math.min(0, hi)));
        out.push(`<path d="${line}L${r2(pts[n - 1][0])} ${r2(z)}L${r2(pts[0][0])} ${r2(z)}Z" fill="${color}" fill-opacity="0.2"/>`);
      }
      out.push(`<path d="${line}" fill="none" stroke="${color}" stroke-width="${r2(sw)}" stroke-linejoin="round" stroke-linecap="round"/>`);
      pts.forEach(([x, y], i) => {
        out.push(`<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(sw * 1.7)}" fill="#ffffff" stroke="${color}" stroke-width="${r2(sw)}"/>`);
        if (el.showValues) txt(x, y - sw * 1.7 - fs * 0.35, fmt(data[i].value), { fs: tfs, weight: 600, anchor: 'middle' });
      });
    }
  }

  // Rectangle dont seule l'extrémité (côté « side ») est arrondie.
  function barPath(x, y, w, h, r, side, fill) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    let d;
    if (side === 'top') d = `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
    else if (side === 'bottom') d = `M${x} ${y}V${y + h - r}Q${x} ${y + h} ${x + r} ${y + h}H${x + w - r}Q${x + w} ${y + h} ${x + w} ${y + h - r}V${y}Z`;
    else if (side === 'right') d = `M${x} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x}Z`;
    else d = `M${x + w} ${y}H${x + r}Q${x} ${y} ${x} ${y + r}V${y + h - r}Q${x} ${y + h} ${x + r} ${y + h}H${x + w}Z`;
    return `<path d="${d.replace(/\d+\.\d{3,}/g, (m) => r2(+m))}" fill="${fill}"/>`;
  }

  // Secteurs et anneau, avec légende à droite ou en dessous.
  function pie(el, data, c) {
    const { W, H, pad, fs, col, colors, txt, out } = c;
    const vals = data.map((d) => Math.max(0, d.value));
    const total = vals.reduce((a, b) => a + b, 0);
    const colorOf = (i) => G.esc(colors[i % colors.length]);
    let area = { x: pad, y: c.top, w: W - 2 * pad, h: H - c.top - pad };
    if (el.showLegend) {
      const lfs = fs * 0.9, sq = lfs * 0.9;
      const items = data.map((d, i) => ({ label: d.label, sub: el.showValues ? fmt(d.value) : '', i }));
      const itemW = (it) => sq + lfs * 0.5 + textW(it.label, lfs) + (it.sub ? lfs * 0.5 + textW(it.sub, lfs) : 0);
      if (W >= H * 1.15) {
        const lw = Math.min(W * 0.42, Math.max(...items.map(itemW)) + fs);
        const lh = lfs * 1.7;
        const y = area.y + Math.max(0, (area.h - lh * items.length) / 2) + lh / 2;
        items.forEach((it, k) => legendItem(it, W - pad - lw + fs * 0.5, y + k * lh, lw - fs, lfs, sq));
        area.w -= lw;
      } else {
        // Légende en lignes sous le graphique.
        const rows = [[]];
        let rw = 0;
        for (const it of items) {
          const iw = itemW(it) + lfs * 1.2;
          if (rw + iw > area.w && rows[rows.length - 1].length) { rows.push([]); rw = 0; }
          rows[rows.length - 1].push(it);
          rw += iw;
        }
        const lh = lfs * 1.6;
        const y0 = H - pad - lh * rows.length + lh / 2;
        rows.forEach((row, ri) => {
          const tw = row.reduce((a, it) => a + itemW(it) + lfs * 1.2, -lfs * 1.2);
          let x = (W - Math.min(tw, area.w)) / 2;
          for (const it of row) { legendItem(it, x, y0 + ri * lh, area.w, lfs, sq); x += itemW(it) + lfs * 1.2; }
        });
        area.h -= lh * rows.length + fs * 0.4;
      }
    }
    function legendItem(it, x, y, maxW, lfs, sq) {
      out.push(`<rect x="${r2(x)}" y="${r2(y - sq / 2)}" width="${r2(sq)}" height="${r2(sq)}" rx="${r2(sq * 0.25)}" fill="${colorOf(it.i)}"/>`);
      const lx = x + sq + lfs * 0.5;
      const subW = it.sub ? textW(it.sub, lfs) + lfs * 0.5 : 0;
      const label = fit(it.label, maxW - sq - lfs * 0.5 - subW, lfs);
      txt(lx, y, label, { fs: lfs, base: 'middle' });
      if (it.sub) txt(lx + textW(label, lfs) + lfs * 0.5, y, it.sub, { fs: lfs, base: 'middle', op: 0.6 });
    }

    const R = Math.max(4, Math.min(area.w, area.h) / 2);
    const cx = area.x + area.w / 2, cy = area.y + area.h / 2;
    const ri = el.kind === 'donut' ? R * 0.6 : 0;
    if (total <= 0) {
      out.push(`<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(R)}" fill="${G.esc(col)}" fill-opacity="0.1"/>`);
      return;
    }
    const P = (r, a) => `${r2(cx + r * Math.sin(a))} ${r2(cy - r * Math.cos(a))}`;
    const gap = Math.max(1, R / 90);
    let a = 0;
    vals.forEach((v, i) => {
      if (!v) return;
      const da = (v / total) * Math.PI * 2;
      if (da >= Math.PI * 2 - 1e-9) {
        out.push(`<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(R)}" fill="${colorOf(i)}"/>`);
      } else {
        const big = da > Math.PI ? 1 : 0;
        const d = ri
          ? `M${P(R, a)}A${r2(R)} ${r2(R)} 0 ${big} 1 ${P(R, a + da)}L${P(ri, a + da)}A${r2(ri)} ${r2(ri)} 0 ${big} 0 ${P(ri, a)}Z`
          : `M${r2(cx)} ${r2(cy)}L${P(R, a)}A${r2(R)} ${r2(R)} 0 ${big} 1 ${P(R, a + da)}Z`;
        out.push(`<path d="${d}" fill="${colorOf(i)}" stroke="#ffffff" stroke-width="${r2(gap)}" stroke-linejoin="round"/>`);
      }
      if (el.showValues && da > 0.32) {
        const lr = ri ? (R + ri) / 2 : R * 0.64;
        const [x, y] = P(lr, a + da / 2).split(' ').map(Number);
        const pfs = Math.max(8, Math.min(fs * 0.95, (R - ri) * 0.3));
        txt(x, y, Math.round((v / total) * 100) + ' %', { fs: pfs, weight: 700, anchor: 'middle', base: 'central', fill: '#ffffff' });
      }
      a += da;
    });
    if (ri) {
      const big = Math.min(ri * 0.42, fs * 1.6);
      txt(cx, cy - big * 0.1, fmt(total), { fs: big, weight: 700, anchor: 'middle', base: 'alphabetic' });
      txt(cx, cy + big * 0.75, 'Total', { fs: big * 0.5, anchor: 'middle', op: 0.6 });
    }
  }

  /* ---------- Type d'élément ---------- */
  G.makeChart = (kind, o) => Object.assign(G.base(), {
    type: 'chart', kind: kind || 'column', title: '', data: G.clone ? G.clone(DEMO) : DEMO.map((d) => Object.assign({}, d)),
    colors: COLORS.slice(), textColor: '#1f2937', showValues: true, showLegend: true, fontFamily: 'Arial',
  }, o);
  G.chartParse = parseData;

  G.TYPES.chart = {
    label: 'Graphique',
    keepRatio: false,
    svg: (el) => render(el),
    controls(el, ui) {
      const set = (fn) => { ui.live(fn); ui.commit(); };
      const nodes = [
        ui.field('Type', ui.select(el.kind, KINDS, (v) => set((x) => (x.kind = v)))),
        ui.button('Données…', 'Modifier les libellés et valeurs', () => ui.prompt(
          'Données du graphique — une ligne par élément : « Libellé; valeur »', dataText(el.data || []),
          (t) => { const data = parseData(t); if (data.length) set((x) => (x.data = data)); }, { multiline: true })),
        ui.field('Titre', ui.text(el.title || '', (v) => ui.live((x) => (x.title = v)), 140)),
        ui.field('Texte', ui.color(el.textColor, (v) => ui.live((x) => (x.textColor = v)))),
        ui.field('Couleur', ui.color((el.colors || COLORS)[0], (v) => ui.live((x) => {
          x.colors = (x.colors && x.colors.length ? x.colors : COLORS).slice();
          x.colors[0] = v;
        }))),
        ui.field('Police', ui.select(el.fontFamily, (G.FONTS || ['Arial']).map((f) => [f, f]), (v) => set((x) => (x.fontFamily = v)))),
        ui.toggle('123', 'Afficher les valeurs', el.showValues, () => set((x) => (x.showValues = !x.showValues))),
      ];
      if (el.kind === 'pie' || el.kind === 'donut') {
        nodes.push(ui.toggle('Légende', 'Afficher la légende', el.showLegend, () => set((x) => (x.showLegend = !x.showLegend))));
      }
      return nodes;
    },
  };

  G.ELEMENT_SECTIONS.push({
    title: 'Graphiques',
    build(container, api) {
      const h = api.h;
      const grid = h('div', { class: 'shape-grid' });
      for (const [kind, name] of KINDS) {
        const demo = G.makeChart(kind, { w: 220, h: 170, showValues: false, showLegend: false, data: DEMO.slice(0, kind === 'pie' || kind === 'donut' ? 4 : 6) });
        const prev = h('span', { style: 'display:block;width:66px;height:51px;pointer-events:none', html: render(demo).replace(/width="220" height="170"/, 'width="66" height="51"') });
        grid.append(h('button', { class: 'shape-btn', title: name, style: 'flex-direction:column;gap:2px;font-size:11px', onclick: () => {
          const s = Math.min(api.W(), api.H());
          const round = kind === 'pie' || kind === 'donut';
          api.add(G.makeChart(kind, { w: s * (round ? 0.62 : 0.7), h: s * (round ? 0.46 : 0.5), title: 'Titre du graphique' }));
        } }, prev, name));
      }
      container.append(grid);
    },
  });
})();
