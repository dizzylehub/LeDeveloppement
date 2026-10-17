/* GBAKI — rendu DOM d'une page (éditeur et aperçus). */
(function () {
  const G = window.GBAKI;

  G.backgroundCss = (bg) => {
    if (!bg) return '#ffffff';
    if (bg.type === 'gradient') return `linear-gradient(${bg.angle || 0}deg, ${bg.color}, ${bg.color2})`;
    return bg.color;
  };

  G.fontCss = (el) => `${el.italic ? 'italic ' : ''}${el.bold ? '700 ' : '400 '}${el.fontSize}px "${el.fontFamily}", sans-serif`;

  function shapeSvg(el) {
    const { w, h } = el;
    const sw = el.strokeWidth || 0;
    const stroke = sw > 0 ? `stroke="${el.stroke}" stroke-width="${sw}"` : '';
    let body;
    if (el.shape === 'line') {
      body = `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${el.stroke}" stroke-width="${Math.max(1, sw)}" stroke-linecap="round"/>`;
    } else if (el.shape === 'rect' || el.shape === 'roundrect') {
      const r = Math.min(el.radius || 0, w / 2, h / 2);
      body = `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${el.fill}" ${stroke}/>`;
    } else if (el.shape === 'ellipse') {
      body = `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${el.fill}" ${stroke}/>`;
    } else {
      const pts = G.shapePoints(el.shape).map(([px, py]) => `${px * w},${py * h}`).join(' ');
      body = `<polygon points="${pts}" fill="${el.fill}" ${stroke} stroke-linejoin="round"/>`;
    }
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible;display:block">${body}</svg>`;
  }

  /* Crée le nœud DOM d'un élément, en coordonnées du design (non zoomées). */
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
    if (el.type === 'text') {
      n.textContent = el.text;
      s.font = G.fontCss(el);
      s.color = el.color;
      s.textAlign = el.align;
      s.lineHeight = el.lineHeight;
      s.letterSpacing = (el.letterSpacing || 0) + 'px';
      s.textDecoration = el.underline ? 'underline' : 'none';
    } else if (el.type === 'shape') {
      n.innerHTML = shapeSvg(el);
    } else if (el.type === 'image') {
      const img = document.createElement('img');
      img.draggable = false;
      img.src = (design.assets[el.assetId] || {}).src || '';
      img.style.borderRadius = (el.radius || 0) + 'px';
      n.appendChild(img);
    }
    return n;
  };

  /* Rend une page complète dans un conteneur (taille design, à mettre à l'échelle par l'appelant). */
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
})();
