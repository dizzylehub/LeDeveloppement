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
      const a = ((bg.angle || 0) * Math.PI) / 180;
      const dx = Math.sin(a), dy = -Math.cos(a);
      const len = Math.abs(W * dx) + Math.abs(H * dy);
      const cx = W / 2, cy = H / 2;
      const g = ctx.createLinearGradient(cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2);
      g.addColorStop(0, bg.color);
      g.addColorStop(1, bg.color2);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = (bg && bg.color) || '#ffffff';
    }
    ctx.fillRect(0, 0, W, H);
  }

  /* Découpe le texte en lignes comme le fait le navigateur (pre-wrap + coupure des mots trop longs). */
  function wrapText(ctx, text, maxW) {
    const lines = [];
    for (const para of String(text).split('\n')) {
      const fits = (s) => ctx.measureText(s).width <= maxW;
      let line = '';
      for (const token of para.split(/(\s+)/)) {
        if (!token) continue;
        if (fits(line + token)) { line += token; continue; }
        if (!token.trim()) { lines.push(line); line = ''; continue; }
        if (line.trim()) { lines.push(line.replace(/\s+$/, '')); line = ''; }
        if (fits(token)) { line = token; continue; }
        for (const ch of token) {
          if (!fits(line + ch) && line) { lines.push(line); line = ''; }
          line += ch;
        }
      }
      lines.push(line.replace(/\s+$/, ''));
    }
    return lines;
  }

  function drawText(ctx, el) {
    ctx.font = G.fontCss(el);
    if ('letterSpacing' in ctx) ctx.letterSpacing = (el.letterSpacing || 0) + 'px';
    ctx.fillStyle = el.color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = el.align === 'justify' ? 'left' : el.align;
    const lh = el.fontSize * el.lineHeight;
    const x = el.align === 'center' ? el.w / 2 : el.align === 'right' ? el.w : 0;
    wrapText(ctx, el.text, el.w).forEach((line, i) => {
      const y = i * lh + lh / 2;
      ctx.fillText(line, x, y);
      if (el.underline && line) {
        const lw = ctx.measureText(line).width;
        const lx = el.align === 'center' ? x - lw / 2 : el.align === 'right' ? x - lw : x;
        ctx.fillRect(lx, y + el.fontSize * 0.42, lw, Math.max(1, el.fontSize / 14));
      }
    });
  }

  function drawShape(ctx, el) {
    const { w, h } = el;
    ctx.fillStyle = el.fill;
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.strokeWidth || 0;
    ctx.lineJoin = 'round';
    if (el.shape === 'line') {
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1, el.strokeWidth);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }
    if (el.shape === 'rect' || el.shape === 'roundrect') roundRectPath(ctx, 0, 0, w, h, el.radius || 0);
    else if (el.shape === 'ellipse') { ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); }
    else {
      ctx.beginPath();
      G.shapePoints(el.shape).forEach(([px, py], i) => (i ? ctx.lineTo(px * w, py * h) : ctx.moveTo(px * w, py * h)));
      ctx.closePath();
    }
    ctx.fill();
    if (el.strokeWidth > 0) ctx.stroke();
  }

  async function drawImage(ctx, el, design) {
    const asset = design.assets[el.assetId];
    const img = asset && (await loadImage(asset.src));
    if (!img) return;
    // Équivalent de object-fit: cover.
    const r = Math.max(el.w / img.naturalWidth, el.h / img.naturalHeight);
    const sw = el.w / r, sh = el.h / r;
    const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2;
    ctx.save();
    roundRectPath(ctx, 0, 0, el.w, el.h, el.radius || 0);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, el.w, el.h);
    ctx.restore();
  }

  G.renderPageToCanvas = async (design, page, scale) => {
    const W = design.width, H = design.height;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    paintBackground(ctx, page.background, W, H);
    for (const el of page.elements) {
      if (el.hidden) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
      ctx.rotate(((el.rotation || 0) * Math.PI) / 180);
      ctx.translate(-el.w / 2, -el.h / 2);
      if (el.type === 'text') drawText(ctx, el);
      else if (el.type === 'shape') drawShape(ctx, el);
      else if (el.type === 'image') await drawImage(ctx, el, design);
      ctx.restore();
    }
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
  G.exportDesign = async (design, format, scale, pages) => {
    const list = pages.map((i) => design.pages[i]);
    const canvases = [];
    for (const p of list) canvases.push(await G.renderPageToCanvas(design, p, scale));
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
