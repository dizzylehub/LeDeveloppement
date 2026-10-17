/* GBAKI — rendu DOM d'une page (éditeur et aperçus) et géométrie partagée avec l'export. */
(function () {
  const G = window.GBAKI;

  /* ---------- couleurs et dégradés ---------- */
  G.backgroundCss = (bg) => {
    if (!bg) return '#ffffff';
    if (bg.type === 'gradient') return `linear-gradient(${bg.angle || 0}deg, ${bg.color}, ${bg.color2})`;
    return bg.color;
  };
  // Ligne de dégradé CSS (angle en degrés, 0 = vers le haut) dans une boîte w × h.
  G.gradientLine = (w, h, angle) => {
    const a = ((angle || 0) * Math.PI) / 180;
    const dx = Math.sin(a), dy = -Math.cos(a);
    const len = Math.abs(w * dx) + Math.abs(h * dy);
    return [w / 2 - (dx * len) / 2, h / 2 - (dy * len) / 2, w / 2 + (dx * len) / 2, h / 2 + (dy * len) / 2];
  };

  /* ---------- texte ---------- */
  G.fontCss = (el) => `${el.italic ? 'italic ' : ''}${el.bold ? '700 ' : '400 '}${el.fontSize}px "${el.fontFamily}", sans-serif`;
  G.displayText = (el) => {
    let lines = String(el.text).split('\n');
    if (el.list === 'bullet') lines = lines.map((l) => (l.trim() ? '•  ' + l : l));
    else if (el.list === 'number') { let n = 0; lines = lines.map((l) => (l.trim() ? `${++n}.  ${l}` : l)); }
    const t = lines.join('\n');
    return el.uppercase ? t.toLocaleUpperCase('fr') : t;
  };
  G.textPad = (el) => (el.bgColor ? (el.bgPad != null ? el.bgPad : Math.round(el.fontSize * 0.3)) : 0);
  const measureCtx = document.createElement('canvas').getContext('2d');
  G.measure = (el, str) => {
    measureCtx.font = G.fontCss(el);
    if ('letterSpacing' in measureCtx) measureCtx.letterSpacing = (el.letterSpacing || 0) + 'px';
    return measureCtx.measureText(str).width;
  };
  const shadowCss = (s) => `${s.x || 0}px ${s.y || 0}px ${s.blur || 0}px ${s.color || 'rgba(0,0,0,.4)'}`;

  /* Texte en arc : géométrie et SVG autonome (utilisé à l'écran et à l'export). */
  G.curveSvg = (el) => {
    const str = G.displayText(el).replace(/\n/g, ' ');
    const fs = el.fontSize;
    const L = Math.max(1, G.measure(el, str));
    const th = Math.min(Math.abs(el.curve) / 100, 1) * 2 * Math.PI * 0.95;
    const R = L / th;
    const up = el.curve > 0;
    const halfW = (th >= Math.PI ? R : R * Math.sin(th / 2)) + fs * 0.7;
    let minY, maxY;
    if (up) { minY = -R - fs * 0.95; maxY = Math.max(-R * Math.cos(th / 2), th > Math.PI ? R * 0.2 : -Infinity) + fs * 0.45; }
    else { minY = Math.min(R * Math.cos(th / 2), th > Math.PI ? -R * 0.2 : Infinity) - fs * 0.95; maxY = R + fs * 0.45; }
    const w = halfW * 2, h = maxY - minY, cx = halfW, cy = -minY;
    const a0 = up ? -Math.PI / 2 - th / 2 : Math.PI / 2 + th / 2;
    const a1 = up ? -Math.PI / 2 + th / 2 : Math.PI / 2 - th / 2;
    const p = (a) => `${(cx + R * Math.cos(a)).toFixed(2)} ${(cy + R * Math.sin(a)).toFixed(2)}`;
    const large = th > Math.PI ? 1 : 0;
    const path = `M ${p(a0)} A ${R.toFixed(2)} ${R.toFixed(2)} 0 ${large} ${up ? 1 : 0} ${p(a1)}`;
    const id = 'c' + el.id;
    const sh = el.shadow ? `<filter id="s${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${el.shadow.x || 0}" dy="${el.shadow.y || 0}" stdDeviation="${(el.shadow.blur || 0) / 2}" flood-color="${el.shadow.color}"/></filter>` : '';
    const ol = el.outline && el.outline.width ? ` stroke="${el.outline.color}" stroke-width="${el.outline.width}" paint-order="stroke" stroke-linejoin="round"` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible;display:block">` +
      `<defs><path id="${id}" d="${path}"/>${sh}</defs>` +
      `<text font-family="${G.esc(el.fontFamily)}, sans-serif" font-size="${fs}" font-weight="${el.bold ? 700 : 400}" font-style="${el.italic ? 'italic' : 'normal'}" letter-spacing="${el.letterSpacing || 0}" fill="${el.color}"${ol}${sh ? ` filter="url(#s${id})"` : ''}${el.underline ? ' text-decoration="underline"' : ''}>` +
      `<textPath href="#${id}" startOffset="50%" text-anchor="middle">${G.esc(str)}</textPath></text></svg>`;
    return { svg, w, h };
  };

  /* ---------- formes ---------- */
  const fillAttr = (el, defs) => {
    if (!el.fill2 || el.fill === 'transparent') return `fill="${el.fill}"`;
    const [x1, y1, x2, y2] = G.gradientLine(el.w, el.h, el.fillAngle || 135);
    defs.push(`<linearGradient id="g${el.id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${el.fill}"/><stop offset="1" stop-color="${el.fill2}"/></linearGradient>`);
    return `fill="url(#g${el.id})"`;
  };
  // Géométrie d'une ligne : segment raccourci aux extrémités fléchées + pointes.
  G.lineGeom = (el) => {
    const sw = Math.max(1, el.strokeWidth || 1), a = sw * 3 + 6, y = el.h / 2;
    const heads = [];
    let x1 = 0, x2 = el.w;
    const head = (kind, x, dir) => {
      if (kind === 'arrow') heads.push({ poly: [[x, y], [x - dir * a, y - a * 0.6], [x - dir * a, y + a * 0.6]] });
      if (kind === 'circle') heads.push({ circle: [x - dir * a * 0.45, y, a * 0.45] });
      if (kind === 'bar') heads.push({ poly: [[x - dir * sw / 2, y - a * 0.6], [x + dir * sw / 2, y - a * 0.6], [x + dir * sw / 2, y + a * 0.6], [x - dir * sw / 2, y + a * 0.6]] });
    };
    if (el.startCap && el.startCap !== 'none') { head(el.startCap, 0, -1); if (el.startCap === 'arrow') x1 = a * 0.8; }
    if (el.endCap && el.endCap !== 'none') { head(el.endCap, el.w, 1); if (el.endCap === 'arrow') x2 = el.w - a * 0.8; }
    const dash = el.dash === 'dashed' ? [sw * 3, sw * 2] : el.dash === 'dotted' ? [0.01, sw * 2] : null;
    return { x1, x2, y, sw, heads, dash };
  };
  G.shapeSvg = (el) => {
    const { w, h } = el;
    const sw = el.strokeWidth || 0;
    const stroke = sw > 0 ? `stroke="${el.stroke}" stroke-width="${sw}"` : '';
    const defs = [];
    let body;
    if (el.shape === 'line') {
      const g = G.lineGeom(el);
      body = `<line x1="${g.x1}" y1="${g.y}" x2="${g.x2}" y2="${g.y}" stroke="${el.stroke}" stroke-width="${g.sw}" stroke-linecap="round"${g.dash ? ` stroke-dasharray="${g.dash.join(' ')}"` : ''}/>` +
        g.heads.map((hd) => (hd.poly ? `<polygon points="${hd.poly.map((p) => p.join(',')).join(' ')}" fill="${el.stroke}" stroke="${el.stroke}" stroke-width="${g.sw / 2}" stroke-linejoin="round"/>` : `<circle cx="${hd.circle[0]}" cy="${hd.circle[1]}" r="${hd.circle[2]}" fill="${el.stroke}"/>`)).join('');
    } else if (el.shape === 'rect' || el.shape === 'roundrect') {
      const r = Math.min(el.radius || 0, w / 2, h / 2);
      body = `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" ${fillAttr(el, defs)} ${stroke}/>`;
    } else if (el.shape === 'ellipse') {
      body = `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" ${fillAttr(el, defs)} ${stroke}/>`;
    } else {
      const pts = G.shapePoints(el.shape).map(([px, py]) => `${(px * w).toFixed(2)},${(py * h).toFixed(2)}`).join(' ');
      body = `<polygon points="${pts}" ${fillAttr(el, defs)} ${stroke} stroke-linejoin="round"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible;display:block">${defs.length ? '<defs>' + defs.join('') + '</defs>' : ''}${body}</svg>`;
  };

  /* ---------- images ---------- */
  G.FILTER_DEFAULTS = { brightness: 100, contrast: 100, saturate: 100, blur: 0, grayscale: 0, sepia: 0, hue: 0 };
  G.FILTER_PRESETS = [
    ['Original', {}],
    ['Noir et blanc', { grayscale: 100, contrast: 110 }],
    ['Vintage', { sepia: 55, contrast: 95, saturate: 80, brightness: 105 }],
    ['Vif', { saturate: 160, contrast: 115 }],
    ['Chaud', { sepia: 25, saturate: 130, hue: -10 }],
    ['Froid', { saturate: 90, hue: 25, brightness: 103 }],
    ['Doux', { contrast: 85, brightness: 110, saturate: 85 }],
    ['Dramatique', { contrast: 145, brightness: 90, saturate: 70 }],
    ['Rêve', { blur: 1.5, brightness: 112, saturate: 120 }],
  ];
  G.filterCss = (f, scale = 1) => {
    if (!f) return '';
    const v = Object.assign({}, G.FILTER_DEFAULTS, f);
    const out = [];
    if (v.brightness !== 100) out.push(`brightness(${v.brightness}%)`);
    if (v.contrast !== 100) out.push(`contrast(${v.contrast}%)`);
    if (v.saturate !== 100) out.push(`saturate(${v.saturate}%)`);
    if (v.grayscale) out.push(`grayscale(${v.grayscale}%)`);
    if (v.sepia) out.push(`sepia(${v.sepia}%)`);
    if (v.hue) out.push(`hue-rotate(${v.hue}deg)`);
    if (v.blur) out.push(`blur(${v.blur * scale}px)`);
    return out.join(' ');
  };
  G.MASKS = ['none', 'ellipse', 'roundrect', 'triangle', 'diamond', 'hexagon', 'star', 'heart', 'bubble', 'burst'];
  // Contour du masque en points normalisés (null = rectangle simple).
  G.maskPoints = (mask) => {
    if (!mask || mask === 'none' || mask === 'roundrect') return null;
    if (mask === 'ellipse') return Array.from({ length: 72 }, (_, i) => { const a = (i / 72) * 2 * Math.PI; return [0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a)]; });
    return G.shapePoints(mask);
  };
  G.maskCss = (el) => {
    if (el.mask === 'ellipse') return 'ellipse(50% 50% at 50% 50%)';
    if (el.mask === 'roundrect') return `inset(0 round ${Math.min(el.w, el.h) * 0.12}px)`;
    const pts = G.maskPoints(el.mask);
    return pts ? `polygon(${pts.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(',')})` : '';
  };
  // Rectangle source (équivalent object-fit: cover + recadrage zoom/point focal).
  G.coverRect = (el, nw, nh) => {
    const c = el.crop || { zoom: 1, x: 0.5, y: 0.5 };
    const r = Math.max(el.w / nw, el.h / nh);
    let sw = el.w / r, sh = el.h / r;
    let sx = (nw - sw) * c.x, sy = (nh - sh) * c.y;
    const z = Math.max(1, c.zoom || 1);
    sx += c.x * sw * (1 - 1 / z); sy += c.y * sh * (1 - 1 / z);
    sw /= z; sh /= z;
    return { sx, sy, sw, sh };
  };
  function borderSvg(el) {
    const b = el.border;
    const sw = b.width;
    let shape;
    if (el.mask === 'ellipse') shape = `<ellipse cx="${el.w / 2}" cy="${el.h / 2}" rx="${el.w / 2}" ry="${el.h / 2}"/>`;
    else if (G.maskPoints(el.mask)) shape = `<polygon points="${G.maskPoints(el.mask).map(([x, y]) => `${x * el.w},${y * el.h}`).join(' ')}" stroke-linejoin="round"/>`;
    else { const r = el.mask === 'roundrect' ? Math.min(el.w, el.h) * 0.12 : el.radius || 0; shape = `<rect x="0" y="0" width="${el.w}" height="${el.h}" rx="${r}"/>`; }
    return `<svg class="img-border" width="${el.w}" height="${el.h}" style="overflow:visible"><g fill="none" stroke="${b.color}" stroke-width="${sw}">${shape}</g></svg>`;
  }

  /* ---------- nœud DOM d'un élément (coordonnées du design, non zoomées) ---------- */
  G.renderElement = (el, design) => {
    const n = document.createElement('div');
    n.className = 'el el-' + el.type;
    n.dataset.id = el.id;
    const s = n.style;
    s.left = el.x + 'px';
    s.top = el.y + 'px';
    s.width = el.w + 'px';
    s.height = el.type === 'text' ? 'auto' : el.h + 'px';
    s.transform = `rotate(${el.rotation || 0}deg)`;
    s.opacity = el.opacity;
    if (el.hidden) s.display = 'none';
    if (el.type !== 'text' && el.shadow) s.filter = `drop-shadow(${shadowCss(el.shadow)})`;
    if (el.type === 'text') {
      if (el.curve) {
        const c = G.curveSvg(el);
        el.w = c.w; el.h = c.h;
        s.width = c.w + 'px';
        s.height = c.h + 'px';
        n.classList.add('curved');
        n.innerHTML = c.svg;
        return n;
      }
      n.textContent = G.displayText(el);
      s.font = G.fontCss(el);
      s.color = el.color;
      s.textAlign = el.align;
      s.lineHeight = el.lineHeight;
      s.letterSpacing = (el.letterSpacing || 0) + 'px';
      s.textDecoration = el.underline ? 'underline' : 'none';
      if (el.shadow) s.textShadow = shadowCss(el.shadow);
      if (el.outline && el.outline.width) { s.webkitTextStroke = `${el.outline.width}px ${el.outline.color}`; s.paintOrder = 'stroke fill'; }
      if (el.bgColor) { s.background = el.bgColor; s.padding = G.textPad(el) + 'px'; s.borderRadius = (el.bgRadius || 0) + 'px'; }
    } else if (el.type === 'shape') {
      n.innerHTML = G.shapeSvg(el);
    } else if (el.type === 'image') {
      const asset = design.assets[el.assetId] || {};
      const img = document.createElement('img');
      img.draggable = false;
      img.src = asset.src || '';
      const is = img.style;
      const c = el.crop || { zoom: 1, x: 0.5, y: 0.5 };
      is.objectPosition = `${c.x * 100}% ${c.y * 100}%`;
      const tf = [];
      if ((c.zoom || 1) > 1) { tf.push(`scale(${c.zoom})`); is.transformOrigin = `${c.x * 100}% ${c.y * 100}%`; }
      const inner = document.createElement('div');
      inner.className = 'img-clip';
      const ms = inner.style;
      const clip = G.maskCss(el);
      if (clip) ms.clipPath = clip; else ms.borderRadius = (el.radius || 0) + 'px';
      if (el.flipX || el.flipY) ms.transform = `scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`;
      if (tf.length) is.transform = tf.join(' ');
      const f = G.filterCss(el.filters);
      if (f) is.filter = f;
      inner.appendChild(img);
      n.appendChild(inner);
      if (el.border && el.border.width > 0) n.insertAdjacentHTML('beforeend', borderSvg(el));
    } else if (G.TYPES[el.type]) {
      try { n.innerHTML = G.TYPES[el.type].svg(el, design); } catch (e) { n.textContent = '⚠'; }
      const svg = n.firstElementChild;
      if (svg) { svg.style.display = 'block'; svg.style.overflow = 'visible'; }
    }
    return n;
  };

  /* Rend une page complète (taille design, à mettre à l'échelle par l'appelant). */
  G.renderPage = (design, page) => {
    const p = document.createElement('div');
    p.className = 'page';
    p.style.width = design.width + 'px';
    p.style.height = design.height + 'px';
    p.style.background = G.backgroundCss(page.background);
    for (const el of page.elements) p.appendChild(G.renderElement(el, design));
    return p;
  };

  /* Aperçu miniature d'une page, mis à l'échelle pour tenir dans maxW × maxH. */
  G.renderPreview = (design, page, maxW, maxH) => {
    const scale = Math.min(maxW / design.width, maxH / design.height);
    const box = document.createElement('div');
    box.className = 'preview';
    box.style.width = design.width * scale + 'px';
    box.style.height = design.height * scale + 'px';
    const p = G.renderPage(design, page);
    p.style.transform = `scale(${scale})`;
    p.style.transformOrigin = '0 0';
    box.appendChild(p);
    return box;
  };

  /* Met à l'échelle une liste d'éléments (modèles, redimensionnement du design). */
  G.scaleElements = (elements, s, ox, oy) => elements.map((el) => {
    el.x = el.x * s + ox;
    el.y = el.y * s + oy;
    el.w *= s;
    el.h *= s;
    if (el.fontSize) el.fontSize = Math.max(4, Math.round(el.fontSize * s * 10) / 10);
    if (el.letterSpacing) el.letterSpacing *= s;
    if (el.strokeWidth && el.type !== 'icon') el.strokeWidth *= s;
    if (el.radius) el.radius *= s;
    if (el.bgPad) el.bgPad *= s;
    if (el.bgRadius) el.bgRadius *= s;
    if (el.shadow) el.shadow = { ...el.shadow, x: (el.shadow.x || 0) * s, y: (el.shadow.y || 0) * s, blur: (el.shadow.blur || 0) * s };
    if (el.outline) el.outline = { ...el.outline, width: el.outline.width * s };
    if (el.border) el.border = { ...el.border, width: el.border.width * s };
    return el;
  });
})();
