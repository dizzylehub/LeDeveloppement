/* GBAKI — export PNG / JPG / PDF par rendu canvas, sans dépendance externe. */
(function () {
  const G = window.GBAKI;

  const imageCache = new Map();
  function loadImage(src) {
    if (!imageCache.has(src)) {
      imageCache.set(src, new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      }));
    }
    return imageCache.get(src);
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function paintBackground(ctx, bg, W, H) {
    if (bg && bg.type === 'gradient') {
      const g = ctx.createLinearGradient(...G.gradientLine(W, H, bg.angle));
      g.addColorStop(0, bg.color);
      g.addColorStop(1, bg.color2);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = (bg && bg.color) || '#ffffff';
    }
    ctx.fillRect(0, 0, W, H);
  }

  // Les ombres du canvas ne suivent pas la transformation : on les multiplie par l'échelle d'export.
  let SCALE = 1;
  function setShadow(ctx, sh) {
    if (!sh) return;
    ctx.shadowColor = sh.color || 'rgba(0,0,0,.4)';
    ctx.shadowBlur = (sh.blur || 0) * SCALE;
    ctx.shadowOffsetX = (sh.x || 0) * SCALE;
    ctx.shadowOffsetY = (sh.y || 0) * SCALE;
  }
  function clearShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }

  /* Dessine un SVG autonome dans la boîte 0,0,w,h (avec une marge pour ce qui dépasse). */
  async function drawSvg(ctx, svg, w, h) {
    const p = Math.min(200, Math.max(w, h) * 0.15);
    const k = SCALE * 2;
    const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" width="${(w + 2 * p) * k}" height="${(h + 2 * p) * k}" viewBox="${-p} ${-p} ${w + 2 * p} ${h + 2 * p}">${svg.replace('<svg ', `<svg x="0" y="0" `)}</svg>`;
    const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(wrapped));
    if (img) ctx.drawImage(img, -p, -p, w + 2 * p, h + 2 * p);
  }

  /* Découpe le texte en lignes comme le navigateur (pre-wrap + coupure des mots trop longs). */
  function wrapText(ctx, text, maxW) {
    const lines = [];
    for (const para of String(text).split('\n')) {
      const fits = (s) => ctx.measureText(s).width <= maxW;
      let line = '';
      const start = lines.length;
      for (const token of para.split(/(\s+)/)) {
        if (!token) continue;
        if (fits(line + token)) { line += token; continue; }
        if (!token.trim()) { lines.push({ t: line }); line = ''; continue; }
        if (line.trim()) { lines.push({ t: line.replace(/\s+$/, '') }); line = ''; }
        if (fits(token)) { line = token; continue; }
        for (const ch of token) {
          if (!fits(line + ch) && line) { lines.push({ t: line }); line = ''; }
          line += ch;
        }
      }
      lines.push({ t: line.replace(/\s+$/, ''), last: true });
      if (lines.length === start) lines.push({ t: '', last: true });
    }
    return lines;
  }

  async function drawText(ctx, el) {
    if (el.curve) {
      const c = G.curveSvg(el);
      await drawSvg(ctx, c.svg, c.w, c.h);
      return;
    }
    if (document.fonts && document.fonts.load) { try { await document.fonts.load(G.fontCss(el)); } catch (e) { /* police système */ } }
    const pad = G.textPad(el);
    if (el.bgColor) {
      ctx.fillStyle = el.bgColor;
      roundRectPath(ctx, 0, 0, el.w, el.h, el.bgRadius || 0);
      ctx.fill();
    }
    ctx.font = G.fontCss(el);
    if ('letterSpacing' in ctx) ctx.letterSpacing = (el.letterSpacing || 0) + 'px';
    ctx.textBaseline = 'middle';
    const innerW = el.w - 2 * pad;
    const lh = el.fontSize * el.lineHeight;
    const lines = wrapText(ctx, G.displayText(el), innerW);
    const outline = el.outline && el.outline.width ? el.outline : null;
    const paint = (str, x, y) => {
      if (outline) {
        ctx.save();
        setShadow(ctx, el.shadow);
        ctx.strokeStyle = outline.color;
        ctx.lineWidth = outline.width;
        ctx.lineJoin = 'round';
        ctx.strokeText(str, x, y);
        ctx.restore();
        ctx.fillText(str, x, y);
      } else {
        ctx.save();
        setShadow(ctx, el.shadow);
        ctx.fillText(str, x, y);
        ctx.restore();
      }
    };
    ctx.fillStyle = el.color;
    lines.forEach((ln, i) => {
      const y = pad + i * lh + lh / 2;
      const str = ln.t;
      if (el.align === 'justify' && !ln.last && /\s/.test(str.trim())) {
        ctx.textAlign = 'left';
        const words = str.trim().split(/\s+/);
        const total = words.reduce((a, w) => a + ctx.measureText(w).width, 0);
        const gap = (innerW - total) / (words.length - 1);
        let x = pad;
        for (const w of words) { paint(w, x, y); x += ctx.measureText(w).width + gap; }
      } else {
        const align = el.align === 'justify' ? 'left' : el.align;
        ctx.textAlign = align;
        const x = align === 'center' ? el.w / 2 : align === 'right' ? el.w - pad : pad;
        paint(str, x, y);
        if (el.underline && str) {
          const lw = ctx.measureText(str).width;
          const lx = align === 'center' ? x - lw / 2 : align === 'right' ? x - lw : x;
          ctx.fillRect(lx, y + el.fontSize * 0.42, lw, Math.max(1, el.fontSize / 14));
        }
      }
    });
  }

  function shapeFill(ctx, el) {
    if (!el.fill2 || el.fill === 'transparent') return el.fill;
    const g = ctx.createLinearGradient(...G.gradientLine(el.w, el.h, el.fillAngle || 135));
    g.addColorStop(0, el.fill);
    g.addColorStop(1, el.fill2);
    return g;
  }

  function polyPath(ctx, pts, w, h) {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * w, py * h) : ctx.moveTo(px * w, py * h)));
    ctx.closePath();
  }

  function drawShape(ctx, el) {
    const { w, h } = el;
    setShadow(ctx, el.shadow);
    ctx.lineJoin = 'round';
    if (el.shape === 'line') {
      const g = G.lineGeom(el);
      ctx.strokeStyle = ctx.fillStyle = el.stroke;
      ctx.lineCap = 'round';
      ctx.lineWidth = g.sw;
      if (g.dash) ctx.setLineDash(g.dash);
      ctx.beginPath();
      ctx.moveTo(g.x1, g.y);
      ctx.lineTo(g.x2, g.y);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const hd of g.heads) {
        if (hd.poly) { polyPath(ctx, hd.poly, 1, 1); ctx.lineWidth = g.sw / 2; ctx.fill(); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(hd.circle[0], hd.circle[1], hd.circle[2], 0, Math.PI * 2); ctx.fill(); }
      }
      return;
    }
    ctx.fillStyle = shapeFill(ctx, el);
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.strokeWidth || 0;
    if (el.shape === 'rect' || el.shape === 'roundrect') roundRectPath(ctx, 0, 0, w, h, el.radius || 0);
    else if (el.shape === 'ellipse') { ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); }
    else polyPath(ctx, G.shapePoints(el.shape), w, h);
    ctx.fill();
    if (el.strokeWidth > 0) { clearShadow(ctx); ctx.stroke(); }
  }

  function maskPath(ctx, el) {
    const pts = G.maskPoints(el.mask);
    if (pts) polyPath(ctx, pts, el.w, el.h);
    else roundRectPath(ctx, 0, 0, el.w, el.h, el.mask === 'roundrect' ? Math.min(el.w, el.h) * 0.12 : el.radius || 0);
  }

  async function drawImage(ctx, el, design) {
    const asset = design.assets[el.assetId];
    const img = asset && (await loadImage(asset.src));
    if (!img) return;
    const r = G.coverRect(el, img.naturalWidth, img.naturalHeight);
    ctx.save();
    if (el.flipX || el.flipY) {
      ctx.translate(el.flipX ? el.w : 0, el.flipY ? el.h : 0);
      ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
    }
    if (el.shadow) {
      ctx.save();
      setShadow(ctx, el.shadow);
      maskPath(ctx, el);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
    }
    maskPath(ctx, el);
    ctx.clip();
    const f = G.filterCss(el.filters, SCALE);
    if (f && 'filter' in ctx) ctx.filter = f;
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, el.w, el.h);
    ctx.restore();
    if (el.border && el.border.width > 0) {
      ctx.save();
      if (el.flipX || el.flipY) {
        ctx.translate(el.flipX ? el.w : 0, el.flipY ? el.h : 0);
        ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
      }
      if (el.mask === 'ellipse') { ctx.beginPath(); ctx.ellipse(el.w / 2, el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); }
      else maskPath(ctx, el);
      ctx.strokeStyle = el.border.color;
      ctx.lineWidth = el.border.width;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  G.renderPageToCanvas = async (design, page, scale, opts = {}) => {
    const W = design.width, H = design.height;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d');
    SCALE = scale;
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    ctx.scale(scale, scale);
    if (!opts.transparent) paintBackground(ctx, page.background, W, H);
    for (const el of page.elements) {
      if (el.hidden) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
      ctx.rotate(((el.rotation || 0) * Math.PI) / 180);
      ctx.translate(-el.w / 2, -el.h / 2);
      if (el.type === 'text') await drawText(ctx, el);
      else if (el.type === 'shape') drawShape(ctx, el);
      else if (el.type === 'image') await drawImage(ctx, el, design);
      else if (G.TYPES[el.type]) {
        setShadow(ctx, el.shadow);
        await drawSvg(ctx, G.TYPES[el.type].svg(el, design), el.w, el.h);
      }
      ctx.restore();
    }
    SCALE = 1;
    return canvas;
  };

  const toBlob = (canvas, mime, q) => new Promise((r) => canvas.toBlob(r, mime, q));

  function download(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  G.download = download;

  const safeName = (s) => (s || 'design').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'design';

  /* PDF minimal : une image JPEG pleine page par page du design. */
  async function buildPdf(design, canvases) {
    const enc = new TextEncoder();
    const parts = [];
    let offset = 0;
    const offsets = [];
    const push = (chunk) => {
      const b = typeof chunk === 'string' ? enc.encode(chunk) : chunk;
      parts.push(b);
      offset += b.length;
    };
    const W = design.width * 0.75, H = design.height * 0.75; // px (96 dpi) → points
    const n = canvases.length;
    // Objets : 1 catalogue, 2 arbre des pages, puis 3 objets par page (page, contenu, image).
    const pageIds = canvases.map((_, i) => 3 + i * 3);
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const obj = (id, body) => { offsets[id] = offset; push(`${id} 0 obj\n`); body(); push('\nendobj\n'); };
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push(`<< /Type /Pages /Count ${n} /Kids [${pageIds.map((id) => id + ' 0 R').join(' ')}] >>`));
    for (let i = 0; i < n; i++) {
      const pid = pageIds[i];
      const jpeg = new Uint8Array(await (await toBlob(canvases[i], 'image/jpeg', 0.92)).arrayBuffer());
      const content = `q ${W.toFixed(2)} 0 0 ${H.toFixed(2)} 0 0 cm /Im0 Do Q`;
      obj(pid, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Resources << /XObject << /Im0 ${pid + 2} 0 R >> >> /Contents ${pid + 1} 0 R >>`));
      obj(pid + 1, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
      obj(pid + 2, () => {
        push(`<< /Type /XObject /Subtype /Image /Width ${canvases[i].width} /Height ${canvases[i].height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
        push(jpeg);
        push('\nendstream');
      });
    }
    const total = 3 + n * 3;
    const xref = offset;
    push(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let id = 1; id < total; id++) push(String(offsets[id]).padStart(10, '0') + ' 00000 n \n');
    push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, { type: 'application/pdf' });
  }

  /* format : 'png' | 'jpg' | 'pdf' ; pages : indices à exporter. */
  G.exportDesign = async (design, format, scale, pages, opts = {}) => {
    const list = pages.map((i) => design.pages[i]);
    const canvases = [];
    for (const p of list) canvases.push(await G.renderPageToCanvas(design, p, scale, { transparent: opts.transparent && format === 'png' }));
    const name = safeName(design.name);
    if (format === 'pdf') {
      download(await buildPdf(design, canvases), name + '.pdf');
      return;
    }
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    for (let i = 0; i < canvases.length; i++) {
      const suffix = canvases.length > 1 ? `-page-${pages[i] + 1}` : '';
      download(await toBlob(canvases[i], mime, 0.92), `${name}${suffix}.${format}`);
    }
  };

  G.makeThumb = async (design) => {
    const scale = 360 / Math.max(design.width, design.height);
    const c = await G.renderPageToCanvas(design, design.pages[0], scale);
    return c.toDataURL('image/jpeg', 0.8);
  };
})();
