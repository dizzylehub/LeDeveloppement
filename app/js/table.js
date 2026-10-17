/* GBAKI — élément « tableau » : lignes et colonnes de texte, en-tête, bandes alternées. */
(function () {
  const G = window.GBAKI;

  const r2 = (n) => Math.round(n * 100) / 100;
  const CW = 0.56; // largeur moyenne d'un caractère, en fraction de la taille de police
  const fit = (s, maxW, fs) => {
    s = String(s);
    if (s.length * fs * CW <= maxW) return s;
    const n = Math.floor(maxW / (fs * CW)) - 1;
    return n > 0 ? s.slice(0, n) + '…' : '';
  };
  const ncols = (rows) => Math.max(1, ...rows.map((r) => r.length));

  // Une ligne par rangée ; cellules séparées par tabulation (copier-coller d'un tableur) ou « ; ».
  function parseRows(text) {
    const lines = String(text).split(/\r?\n/).filter((l) => l.trim());
    const sep = /\t/.test(text) ? '\t' : ';';
    const rows = lines.map((l) => l.split(sep).map((c) => c.trim()));
    const n = ncols(rows);
    return rows.map((r) => r.concat(new Array(n - r.length).fill('')));
  }
  const rowsText = (rows) => rows.map((r) => r.join('; ')).join('\n');

  function render(el) {
    const W = el.w, H = el.h;
    const rows = el.rows && el.rows.length ? el.rows : [['']];
    const nr = rows.length, nc = ncols(rows);
    const rh = H / nr;
    let fs = Math.max(4, Math.min(el.fontSize || 24, rh * 0.6));
    // Largeurs de colonnes proportionnelles au contenu le plus long.
    const lens = [];
    for (let j = 0; j < nc; j++) lens.push(Math.max(3, ...rows.map((r) => String(r[j] == null ? '' : r[j]).length)));
    const chars = lens.reduce((a, b) => a + b, 0);
    // Réduit la police (jusqu'à 60 %) si le contenu déborde ; au-delà, le texte est tronqué.
    const fitFs = W / (chars * CW + nc * 1.2);
    if (fitFs < fs) fs = Math.max(4, Math.max(fs * 0.6, fitFs));
    const padX = fs * 0.6;
    const need = lens.map((len) => len * fs * CW + 2 * padX);
    const sum = need.reduce((a, b) => a + b, 0);
    let cw = need.map((n) => (n / sum) * W);
    if (sum > W) {
      // Trop large : les colonnes courtes gardent leur largeur, les longues se partagent le reste.
      const fixed = new Array(nc).fill(false);
      for (let changed = true; changed;) {
        changed = false;
        const rest = W - need.reduce((a, n, j) => a + (fixed[j] ? n : 0), 0);
        const open = need.reduce((a, n, j) => a + (fixed[j] ? 0 : n), 0);
        const share = rest / fixed.filter((f) => !f).length;
        cw = need.map((n, j) => (fixed[j] ? n : (n / open) * rest));
        need.forEach((n, j) => { if (!fixed[j] && n <= share) { fixed[j] = changed = true; } });
        if (fixed.every(Boolean)) break;
      }
    }
    const xs = [0];
    cw.forEach((w, j) => xs.push(xs[j] + w));
    const bc = G.esc(el.borderColor || '#e5e7eb');
    const bw = Math.max(1, fs / 16);
    const head = !!el.header;
    const out = [];
    if (el.bg) out.push(`<rect width="${W}" height="${H}" fill="${G.esc(el.bg)}"/>`);
    rows.forEach((row, i) => {
      const y = i * rh;
      const isHead = head && i === 0;
      const body = head ? i - 1 : i;
      if (isHead && el.headerBg) out.push(`<rect y="${r2(y)}" width="${W}" height="${r2(rh)}" fill="${G.esc(el.headerBg)}"/>`);
      else if (!isHead && el.stripe && body % 2 === 1) out.push(`<rect y="${r2(y)}" width="${W}" height="${r2(rh)}" fill="${G.esc(el.stripeColor || '#f3f4f6')}"/>`);
      for (let j = 0; j < nc; j++) {
        const cell = row[j] == null ? '' : row[j];
        if (cell === '') continue;
        const a = el.align || 'left';
        const x = a === 'center' ? (xs[j] + xs[j + 1]) / 2 : a === 'right' ? xs[j + 1] - padX : xs[j] + padX;
        const anchor = a === 'center' ? 'middle' : a === 'right' ? 'end' : 'start';
        out.push(`<text x="${r2(x)}" y="${r2(y + rh / 2)}" dominant-baseline="central" text-anchor="${anchor}" font-size="${r2(fs)}"` +
          `${isHead ? ' font-weight="700"' : ''} fill="${G.esc(isHead ? el.headerColor || el.textColor : el.textColor || '#1f2937')}">` +
          `${G.esc(fit(cell, cw[j] - 2 * padX, fs))}</text>`);
      }
    });
    // Filets : horizontaux, verticaux et cadre.
    let d = '';
    for (let i = 1; i < nr; i++) d += `M0 ${r2(i * rh)}H${W}`;
    for (let j = 1; j < nc; j++) d += `M${r2(xs[j])} 0V${H}`;
    out.push(`<path d="${d}" stroke="${bc}" stroke-width="${r2(bw)}" fill="none"/>`);
    out.push(`<rect x="${r2(bw / 2)}" y="${r2(bw / 2)}" width="${r2(W - bw)}" height="${r2(H - bw)}" fill="none" stroke="${bc}" stroke-width="${r2(bw)}"/>`);
    const ff = G.esc(`${el.fontFamily || 'Arial'}, Helvetica, sans-serif`);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${ff}">${out.join('')}</svg>`;
  }

  /* ---------- Type d'élément ---------- */
  const PRESETS = [
    { name: 'Classique', headerBg: '#4f46e5', headerColor: '#ffffff', textColor: '#1f2937', borderColor: '#e5e7eb', stripe: true, stripeColor: '#eef2ff', bg: '#ffffff' },
    { name: 'Minimal', headerBg: '', headerColor: '#111827', textColor: '#374151', borderColor: '#d1d5db', stripe: false, stripeColor: '#f9fafb', bg: '' },
    { name: 'Sombre', headerBg: '#f59e0b', headerColor: '#111827', textColor: '#f9fafb', borderColor: '#374151', stripe: true, stripeColor: '#1f2937', bg: '#111827' },
  ];
  const DEMO = [['Produit', 'Quantité', 'Prix'], ['Café', '2', '1 500 F'], ['Jus de bissap', '1', '800 F'], ['Alloco', '3', '2 100 F']];

  G.makeTable = (o) => {
    const p = Object.assign({}, PRESETS[0]);
    delete p.name;
    return Object.assign(G.base(), {
      type: 'table', rows: DEMO.map((r) => r.slice()), header: true, fontSize: 24, fontFamily: 'Arial', align: 'left',
    }, p, o);
  };

  G.TYPES.table = {
    label: 'Tableau',
    keepRatio: false,
    svg: (el) => render(el),
    controls(el, ui) {
      const set = (fn) => { ui.live(fn); ui.commit(); };
      // Ajoute ou retire des lignes en gardant la même hauteur de ligne.
      const resizeRows = (x, rows) => { x.h = (x.h / Math.max(1, x.rows.length)) * rows.length; x.rows = rows; };
      return [
        ui.button('Contenu…', 'Modifier le contenu du tableau', () => ui.prompt(
          'Contenu du tableau — une ligne par rangée, cellules séparées par « ; » ou une tabulation',
          rowsText(el.rows), (t) => { const rows = parseRows(t); if (rows.length) set((x) => resizeRows(x, rows)); }, { multiline: true })),
        ui.button('+ ligne', 'Ajouter une ligne', () => set((x) => resizeRows(x, x.rows.concat([new Array(ncols(x.rows)).fill('')])))),
        ui.button('+ colonne', 'Ajouter une colonne', () => set((x) => {
          const n = ncols(x.rows);
          x.w = (x.w / n) * (n + 1);
          x.rows = x.rows.map((r, i) => r.concat(new Array(n - r.length).fill(''), i === 0 && x.header ? 'Colonne' : ''));
        })),
        ui.button('− ligne', 'Supprimer la dernière ligne', () => set((x) => { if (x.rows.length > 1) resizeRows(x, x.rows.slice(0, -1)); })),
        ui.button('− colonne', 'Supprimer la dernière colonne', () => set((x) => {
          const n = ncols(x.rows);
          if (n > 1) { x.w = (x.w / n) * (n - 1); x.rows = x.rows.map((r) => r.slice(0, n - 1)); }
        })),
        ui.field('Taille', ui.number(el.fontSize, 6, 200, 1, (v) => ui.live((x) => (x.fontSize = v)), 56)),
        ui.field('Police', ui.select(el.fontFamily, (G.FONTS || ['Arial']).map((f) => [f, f]), (v) => set((x) => (x.fontFamily = v)))),
        ui.field('Alignement', ui.select(el.align, [['left', 'Gauche'], ['center', 'Centre'], ['right', 'Droite']], (v) => set((x) => (x.align = v)))),
        ui.field('Texte', ui.color(el.textColor, (v) => ui.live((x) => (x.textColor = v)))),
        ui.toggle('En-tête', 'Première ligne en en-tête', el.header, () => set((x) => (x.header = !x.header))),
        ui.field('Fond en-tête', ui.color(el.headerBg || '#ffffff', (v) => ui.live((x) => (x.headerBg = v)))),
        ui.field('Texte en-tête', ui.color(el.headerColor, (v) => ui.live((x) => (x.headerColor = v)))),
        ui.toggle('Bandes', 'Lignes alternées', el.stripe, () => set((x) => (x.stripe = !x.stripe))),
        ui.field('Bandes', ui.color(el.stripeColor, (v) => ui.live((x) => (x.stripeColor = v)))),
        ui.field('Filets', ui.color(el.borderColor, (v) => ui.live((x) => (x.borderColor = v)))),
      ];
    },
  };

  G.ELEMENT_SECTIONS.push({
    title: 'Tableaux',
    build(container, api) {
      const h = api.h;
      for (const p of PRESETS) {
        const style = Object.assign({}, p);
        delete style.name;
        const demo = G.makeTable(Object.assign({}, style, { w: 240, h: 96, fontSize: 13 }));
        const prev = h('span', { style: 'display:block;pointer-events:none', html: render(demo) });
        container.append(h('button', { class: 'text-preset', title: 'Tableau ' + p.name, style: 'padding:8px', onclick: () => {
          const s = Math.min(api.W(), api.H());
          const k = s / 1080;
          api.add(G.makeTable(Object.assign({}, style, { w: s * 0.7, h: s * 0.32, fontSize: Math.round(28 * k) || 12 })));
        } }, prev, h('span', { style: 'display:block;font-size:12px;margin-top:4px' }, p.name)));
      }
    },
  });
})();
