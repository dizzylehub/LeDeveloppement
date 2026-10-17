/* GBAKI — éditeur : sélection, déplacement, redimensionnement, rotation, texte, pages, panneaux. */
(function () {
  const G = window.GBAKI;
  const $ = (sel, root = document) => root.querySelector(sel);

  /* Petit utilitaire de création DOM : h('div', {class, onclick, ...}, enfants...) */
  const h = (G.h = (tag, attrs, ...children) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k === 'class') n.className = v;
      else if (k === 'style') n.style.cssText = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k in n && typeof v !== 'string') n[k] = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : String(c));
    return n;
  });

  const ICON = {
    templates: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    text: '<path d="M4 6V4h16v2M9 20h6M12 4v16"/>',
    elements: '<circle cx="7.5" cy="7.5" r="4"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M17 3l4 7h-8z"/>',
    uploads: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    background: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;

  const TABS = [
    ['templates', 'Modèles'], ['text', 'Texte'], ['elements', 'Éléments'],
    ['uploads', 'Importer'], ['background', 'Fond'], ['layers', 'Calques'],
  ];
  const SHAPE_NAMES = {
    rect: 'Rectangle', roundrect: 'Rectangle arrondi', ellipse: 'Cercle', triangle: 'Triangle', diamond: 'Losange',
    pentagon: 'Pentagone', hexagon: 'Hexagone', star: 'Étoile', arrow: 'Flèche', line: 'Ligne',
  };
  const GRADIENTS = [
    ['#6d28d9', '#f97316'], ['#0ea5e9', '#22c55e'], ['#f43f5e', '#f59e0b'], ['#0f172a', '#1e3a8a'],
    ['#be185d', '#312e81'], ['#fde68a', '#fb7185'], ['#a7f3d0', '#3b82f6'], ['#111827', '#6b7280'],
  ];

  const S = (G.editor = {
    active: false, design: null, pageIdx: 0, sel: [], zoom: 1, fit: true, history: new G.History(),
    clipboard: null, editing: null, tab: 'templates', frames: [], guides: [], marquee: null, saveTimer: null,
  });

  /* ---------- accès au modèle ---------- */
  const page = () => S.design.pages[S.pageIdx];
  const findEl = (id) => {
    for (let i = 0; i < S.design.pages.length; i++) {
      const el = S.design.pages[i].elements.find((e) => e.id === id);
      if (el) return { el, pi: i };
    }
    return {};
  };
  const selected = () => S.sel.map((id) => page().elements.find((e) => e.id === id)).filter(Boolean);
  const snapshot = () => ({ name: S.design.name, pages: S.design.pages });
  const W = () => S.design.width;
  const H = () => S.design.height;
  const k = () => Math.min(W(), H()) / 1080; // facteur d'échelle pour les tailles par défaut

  /* ---------- sauvegarde ---------- */
  function markDirty() {
    $('#save-state').textContent = 'Modifications…';
    clearTimeout(S.saveTimer);
    S.saveTimer = setTimeout(save, 700);
  }
  async function save() {
    clearTimeout(S.saveTimer);
    S.saveTimer = null;
    const d = S.design;
    if (!d) return;
    d.updatedAt = Date.now();
    try {
      d.thumb = await G.makeThumb(d);
    } catch (e) { /* aperçu facultatif */ }
    try {
      await G.store.put(d);
      const el = $('#save-state');
      if (el) el.textContent = 'Enregistré';
    } catch (e) {
      const el = $('#save-state');
      if (el) el.textContent = 'Échec de l’enregistrement — utilisez « Enregistrer .gbaki »';
    }
  }
  G.flushEditor = async () => { if (S.active && S.saveTimer) await save(); };

  function commit() {
    S.history.push(snapshot());
    markDirty();
    renderAll();
  }
  function restore(snap) {
    if (!snap) return;
    S.editing = null;
    S.design.name = snap.name;
    S.design.pages = snap.pages;
    S.pageIdx = Math.min(S.pageIdx, S.design.pages.length - 1);
    S.sel = S.sel.filter((id) => page().elements.some((e) => e.id === id));
    $('#design-name').value = S.design.name;
    markDirty();
    renderAll();
  }
  const undo = () => restore(S.history.undo());
  const redo = () => restore(S.history.redo());

  /* ---------- rendu ---------- */
  function renderAll() {
    const pagesEl = $('#pages');
    const scrollTop = $('#scroller').scrollTop;
    pagesEl.innerHTML = '';
    S.frames = [];
    const z = S.zoom;
    S.design.pages.forEach((p, i) => {
      const many = S.design.pages.length > 1;
      const bar = h('div', { class: 'page-bar' },
        h('span', { class: 'page-title' }, `Page ${i + 1}`),
        h('div', { class: 'spacer' }),
        many && i > 0 && h('button', { class: 'mini', title: 'Monter la page', onclick: () => movePage(i, -1) }, '↑'),
        many && i < S.design.pages.length - 1 && h('button', { class: 'mini', title: 'Descendre la page', onclick: () => movePage(i, 1) }, '↓'),
        h('button', { class: 'mini', title: 'Dupliquer la page', onclick: () => duplicatePage(i) }, '⧉'),
        h('button', { class: 'mini', title: many ? 'Supprimer la page' : 'Vider la page', onclick: () => deletePage(i) }, '✕'),
        h('button', { class: 'mini', title: 'Ajouter une page après', onclick: () => addPage(i) }, '+'));
      const frame = h('div', { class: 'page-frame', style: `width:${W() * z}px;height:${H() * z}px` });
      const pg = G.renderPage(S.design, p);
      pg.style.transform = `scale(${z})`;
      pg.style.transformOrigin = '0 0';
      const ov = h('div', { class: 'overlay' });
      frame.append(pg, ov);
      frame.addEventListener('pointerdown', (e) => onPointerDown(e, i));
      frame.addEventListener('dblclick', (e) => onDblClick(e, i));
      pagesEl.append(h('div', { class: 'page-wrap' + (i === S.pageIdx ? ' active' : ''), 'data-page': i }, bar, frame));
      S.frames.push({ frame, pg, ov });
    });
    $('#scroller').scrollTop = scrollTop;
    measureTexts();
    if (S.editing) {
      const n = nodeOf(S.editing);
      if (n) makeEditable(n, findEl(S.editing).el, false);
      else S.editing = null;
    }
    drawOverlay();
    buildCtx();
    if (S.tab === 'layers' || S.tab === 'uploads') buildPanel();
    $('[data-act=undo]').disabled = S.history.i <= 0;
    $('[data-act=redo]').disabled = S.history.i >= S.history.stack.length - 1;
  }

  function nodeOf(id, pi = S.pageIdx) {
    const f = S.frames[pi];
    return f && f.pg.querySelector(`[data-id="${id}"]`);
  }
  function measureTexts() {
    S.design.pages.forEach((p, i) => p.elements.forEach((el) => {
      if (el.type !== 'text' || el.hidden) return;
      const n = nodeOf(el.id, i);
      if (n) el.h = n.offsetHeight;
    }));
  }
  function updateNode(el) {
    const { pi } = findEl(el.id);
    const old = nodeOf(el.id, pi);
    if (!old) return;
    const n = G.renderElement(el, S.design);
    if (S.editing === el.id) {
      // En cours d'édition : on garde le contenu saisi, on n'applique que le style.
      old.style.cssText = n.style.cssText;
      el.h = old.offsetHeight;
      return;
    }
    old.replaceWith(n);
    if (el.type === 'text') el.h = n.offsetHeight;
  }

  function drawOverlay() {
    const z = S.zoom;
    S.frames.forEach(({ ov }, i) => {
      ov.innerHTML = '';
      if (i !== S.pageIdx) return;
      const sel = selected();
      for (const el of sel) {
        const box = h('div', {
          class: 'sel-box' + (el.locked ? ' locked' : '') + (S.editing === el.id ? ' editing' : ''),
          style: `left:${el.x * z}px;top:${el.y * z}px;width:${el.w * z}px;height:${el.h * z}px;transform:rotate(${el.rotation || 0}deg)`,
        });
        if (sel.length === 1 && !el.locked && S.editing !== el.id) {
          const dirs = el.type === 'text' ? ['nw', 'ne', 'sw', 'se', 'w', 'e'] : el.shape === 'line' ? ['w', 'e'] : ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
          for (const d of dirs) box.append(h('div', { class: 'handle h-' + d, 'data-handle': d }));
          box.append(h('div', { class: 'handle rot', 'data-handle': 'rot', title: 'Faire pivoter', html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>' }));
        }
        if (el.locked) box.append(h('div', { class: 'lock-badge' }, '🔒'));
        ov.append(box);
      }
      for (const g of S.guides) {
        ov.append(h('div', { class: 'guide ' + g.axis, style: g.axis === 'v' ? `left:${g.pos * z}px` : `top:${g.pos * z}px` }));
      }
      if (S.marquee) {
        const m = S.marquee;
        ov.append(h('div', { class: 'marquee', style: `left:${m.x * z}px;top:${m.y * z}px;width:${m.w * z}px;height:${m.h * z}px` }));
      }
      if (S.hint) ov.append(h('div', { class: 'hint', style: `left:${S.hint.x * z}px;top:${S.hint.y * z}px` }, S.hint.text));
    });
  }

  function setActivePage(i) {
    if (i === S.pageIdx) return;
    S.pageIdx = i;
    S.sel = [];
    document.querySelectorAll('.page-wrap').forEach((w, j) => w.classList.toggle('active', j === i));
  }

  /* ---------- interactions souris / tactile ---------- */
  function toDesign(e, pi) {
    const r = S.frames[pi].frame.getBoundingClientRect();
    return { x: (e.clientX - r.left) / S.zoom, y: (e.clientY - r.top) / S.zoom };
  }
  function drag(move, up) {
    const mm = (ev) => move(ev);
    const uu = (ev) => {
      window.removeEventListener('pointermove', mm);
      window.removeEventListener('pointerup', uu);
      window.removeEventListener('pointercancel', uu);
      if (up) up(ev);
    };
    window.addEventListener('pointermove', mm);
    window.addEventListener('pointerup', uu);
    window.addEventListener('pointercancel', uu);
  }

  function onPointerDown(e, pi) {
    if (e.button !== 0) return;
    const handle = e.target.closest('[data-handle]');
    const node = e.target.closest('.el');
    if (S.editing) {
      if (node && node.dataset.id === S.editing) return;
      finishEditing();
    }
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    setActivePage(pi);
    e.preventDefault();
    if (handle) {
      const el = selected()[0];
      if (!el) return;
      if (handle.dataset.handle === 'rot') startRotate(e, pi, el);
      else startResize(e, pi, el, handle.dataset.handle);
      return;
    }
    if (node) {
      const id = node.dataset.id;
      if (e.shiftKey) S.sel = S.sel.includes(id) ? S.sel.filter((x) => x !== id) : [...S.sel, id];
      else if (!S.sel.includes(id)) S.sel = [id];
      drawOverlay();
      buildCtx();
      if (S.tab === 'layers') buildPanel();
      const movable = selected().filter((x) => !x.locked);
      if (movable.length && S.sel.includes(id)) startMove(e, pi, movable);
      return;
    }
    S.sel = [];
    drawOverlay();
    buildCtx();
    if (S.tab === 'layers') buildPanel();
    startMarquee(e, pi);
  }

  function bbox(list) {
    const x = Math.min(...list.map((b) => b.x)), y = Math.min(...list.map((b) => b.y));
    const x2 = Math.max(...list.map((b) => b.x + b.w)), y2 = Math.max(...list.map((b) => b.y + b.h));
    return { x, y, w: x2 - x, h: y2 - y };
  }

  /* Magnétisme : bords et centres de la page et des autres éléments. */
  function computeSnap(box, exclude) {
    const t = 6 / S.zoom;
    const others = page().elements.filter((e) => !exclude.includes(e.id) && !e.hidden);
    const tx = [0, W() / 2, W()], ty = [0, H() / 2, H()];
    for (const o of others) { tx.push(o.x, o.x + o.w / 2, o.x + o.w); ty.push(o.y, o.y + o.h / 2, o.y + o.h); }
    const best = (cands, targets) => {
      let r = null;
      for (const c of cands) for (const tg of targets) {
        const d = tg - c;
        if (Math.abs(d) <= t && (!r || Math.abs(d) < Math.abs(r.d))) r = { d, pos: tg };
      }
      return r;
    };
    const bx = best([box.x, box.x + box.w / 2, box.x + box.w], tx);
    const by = best([box.y, box.y + box.h / 2, box.y + box.h], ty);
    const guides = [];
    if (bx) guides.push({ axis: 'v', pos: bx.pos });
    if (by) guides.push({ axis: 'h', pos: by.pos });
    return { dx: bx ? bx.d : 0, dy: by ? by.d : 0, guides };
  }

  function startMove(e, pi, els) {
    const start = toDesign(e, pi);
    const orig = els.map((el) => ({ el, x: el.x, y: el.y }));
    const bb = bbox(els);
    let moved = false;
    drag((ev) => {
      const p = toDesign(ev, pi);
      let dx = p.x - start.x, dy = p.y - start.y;
      if (!moved && Math.hypot(dx, dy) * S.zoom < 3) return;
      moved = true;
      const snap = ev.altKey ? { dx: 0, dy: 0, guides: [] } : computeSnap({ x: bb.x + dx, y: bb.y + dy, w: bb.w, h: bb.h }, els.map((x) => x.id));
      dx += snap.dx;
      dy += snap.dy;
      S.guides = snap.guides;
      for (const o of orig) { o.el.x = o.x + dx; o.el.y = o.y + dy; updateNode(o.el); }
      drawOverlay();
    }, () => {
      S.guides = [];
      if (moved) commit(); else drawOverlay();
    });
  }

  function startResize(e, pi, el, dir) {
    const hx = dir.includes('e') ? 1 : dir.includes('w') ? -1 : 0;
    const hy = dir.includes('s') ? 1 : dir.includes('n') ? -1 : 0;
    const o = { x: el.x, y: el.y, w: el.w, h: el.h, fs: el.fontSize };
    const th = ((el.rotation || 0) * Math.PI) / 180, cos = Math.cos(th), sin = Math.sin(th);
    const start = toDesign(e, pi);
    const ratioLocked = hx && hy && (el.type === 'image' || el.type === 'text');
    drag((ev) => {
      const p = toDesign(ev, pi);
      const dx = p.x - start.x, dy = p.y - start.y;
      const lx = dx * cos + dy * sin, ly = -dx * sin + dy * cos;
      let nw = hx ? o.w + hx * lx : o.w;
      let nh = hy ? o.h + hy * ly : o.h;
      if (ratioLocked || (ev.shiftKey && hx && hy)) {
        const r = Math.max(nw / o.w, nh / o.h);
        nw = o.w * r;
        nh = o.h * r;
      }
      nw = Math.max(8, nw);
      nh = Math.max(el.shape === 'line' ? o.h : 8, nh);
      if (el.type === 'text' && hx && hy) el.fontSize = Math.max(4, Math.round(((o.fs * nw) / o.w) * 10) / 10);
      const sx = (hx * (nw - o.w)) / 2, sy = (hy * (nh - o.h)) / 2;
      const cx = o.x + o.w / 2 + sx * cos - sy * sin;
      const cy = o.y + o.h / 2 + sx * sin + sy * cos;
      el.w = nw; el.h = nh; el.x = cx - nw / 2; el.y = cy - nh / 2;
      updateNode(el);
      S.hint = { x: el.x, y: el.y + el.h + 30 / S.zoom, text: el.type === 'text' ? `${el.fontSize} px` : `${Math.round(el.w)} × ${Math.round(el.h)}` };
      drawOverlay();
    }, () => { S.hint = null; commit(); });
  }

  function startRotate(e, pi, el) {
    const c = { x: el.x + el.w / 2, y: el.y + el.h / 2 };
    drag((ev) => {
      const p = toDesign(ev, pi);
      let a = (Math.atan2(p.y - c.y, p.x - c.x) * 180) / Math.PI - 90;
      a = ((a % 360) + 360) % 360;
      if (ev.shiftKey) a = Math.round(a / 15) * 15;
      else for (const s of [0, 90, 180, 270, 360]) if (Math.abs(a - s) < 4) a = s;
      el.rotation = Math.round(a) % 360;
      updateNode(el);
      S.hint = { x: c.x, y: el.y + el.h + 40 / S.zoom, text: `${el.rotation}°` };
      drawOverlay();
    }, () => { S.hint = null; commit(); });
  }

  function startMarquee(e, pi) {
    const start = toDesign(e, pi);
    drag((ev) => {
      const p = toDesign(ev, pi);
      const m = { x: Math.min(p.x, start.x), y: Math.min(p.y, start.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) };
      if (m.w * S.zoom < 4 && m.h * S.zoom < 4) return;
      S.marquee = m;
      S.sel = page().elements
        .filter((el) => !el.hidden && el.x < m.x + m.w && el.x + el.w > m.x && el.y < m.y + m.h && el.y + el.h > m.y)
        .map((el) => el.id);
      drawOverlay();
    }, () => {
      S.marquee = null;
      drawOverlay();
      buildCtx();
      if (S.tab === 'layers') buildPanel();
    });
  }

  /* ---------- édition de texte en place ---------- */
  function onDblClick(e, pi) {
    const node = e.target.closest('.el-text');
    if (node && pi === S.pageIdx) startEditing(node.dataset.id);
  }
  function startEditing(id) {
    const { el } = findEl(id);
    if (!el || el.type !== 'text' || el.locked) return;
    S.editing = id;
    S.sel = [id];
    makeEditable(nodeOf(id), el, true);
    drawOverlay();
    buildCtx();
  }
  function makeEditable(node, el, selectAll) {
    node.contentEditable = 'true';
    node.spellcheck = false;
    node.classList.add('editing');
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    if (!selectAll) range.collapse(false);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(range);
    node.addEventListener('input', () => {
      el.text = node.innerText.replace(/\n$/, '');
      el.h = node.offsetHeight;
      drawOverlay();
    });
    node.addEventListener('paste', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      document.execCommand('insertText', false, ev.clipboardData.getData('text/plain'));
    });
    node.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Escape') { ev.preventDefault(); finishEditing(); }
    });
    node.addEventListener('blur', (ev) => {
      // Rester en édition quand on utilise la barre d'outils du texte.
      if (ev.relatedTarget && ev.relatedTarget.closest('#ctxbar')) return;
      if (S.editing === el.id) finishEditing();
    });
  }
  function finishEditing() {
    if (!S.editing) return;
    const id = S.editing;
    S.editing = null;
    const { el } = findEl(id);
    const node = nodeOf(id);
    window.getSelection().removeAllRanges();
    if (!el || !node) return commit();
    el.text = node.innerText.replace(/\n$/, '');
    // Pas de rendu complet ici : un clic sur la barre d'outils ne doit pas détruire le contrôle visé.
    S.history.push(snapshot());
    markDirty();
    updateNode(el);
    drawOverlay();
    if (S.tab === 'layers') buildPanel();
  }

  /* ---------- opérations ---------- */
  function addElement(el, at) {
    if (at) { el.x = at.x - el.w / 2; el.y = at.y - el.h / 2; }
    else { el.x = (W() - el.w) / 2; el.y = (H() - el.h) / 2; }
    page().elements.push(el);
    S.sel = [el.id];
    commit();
    const wrap = document.querySelectorAll('.page-wrap')[S.pageIdx];
    if (wrap) wrap.scrollIntoView({ block: 'nearest' });
    return el;
  }
  G.editorAddElement = addElement;

  function deleteSel() {
    if (!S.sel.length) return;
    page().elements = page().elements.filter((e) => !S.sel.includes(e.id));
    S.sel = [];
    commit();
  }
  function cloneEls(els, offset) {
    return els.map((el) => Object.assign(G.clone(el), { id: G.uid(), x: el.x + offset, y: el.y + offset, locked: false }));
  }
  function duplicateSel() {
    const els = selected();
    if (!els.length) return;
    const copies = cloneEls(els, 20 * k() + 10);
    page().elements.push(...copies);
    S.sel = copies.map((c) => c.id);
    commit();
  }
  function copySel() { const els = selected(); if (els.length) S.clipboard = G.clone(els); }
  function paste() {
    if (!S.clipboard) return;
    const copies = cloneEls(S.clipboard, 20 * k() + 10);
    S.clipboard = G.clone(copies);
    page().elements.push(...copies);
    S.sel = copies.map((c) => c.id);
    commit();
  }
  function arrange(action) {
    const list = page().elements;
    const ids = S.sel;
    if (!ids.length) return;
    const inSel = (e) => ids.includes(e.id);
    if (action === 'front') page().elements = [...list.filter((e) => !inSel(e)), ...list.filter(inSel)];
    else if (action === 'back') page().elements = [...list.filter(inSel), ...list.filter((e) => !inSel(e))];
    else if (action === 'forward') {
      for (let i = list.length - 2; i >= 0; i--) if (inSel(list[i]) && !inSel(list[i + 1])) [list[i], list[i + 1]] = [list[i + 1], list[i]];
    } else if (action === 'backward') {
      for (let i = 1; i < list.length; i++) if (inSel(list[i]) && !inSel(list[i - 1])) [list[i], list[i - 1]] = [list[i - 1], list[i]];
    }
    commit();
  }
  function align(mode) {
    const els = selected().filter((e) => !e.locked);
    if (!els.length) return;
    const ref = els.length === 1 ? { x: 0, y: 0, w: W(), h: H() } : bbox(els);
    for (const el of els) {
      if (mode === 'left') el.x = ref.x;
      if (mode === 'hcenter') el.x = ref.x + (ref.w - el.w) / 2;
      if (mode === 'right') el.x = ref.x + ref.w - el.w;
      if (mode === 'top') el.y = ref.y;
      if (mode === 'vcenter') el.y = ref.y + (ref.h - el.h) / 2;
      if (mode === 'bottom') el.y = ref.y + ref.h - el.h;
    }
    commit();
  }
  function toggleLock() {
    const els = selected();
    const lock = !els.every((e) => e.locked);
    els.forEach((e) => (e.locked = lock));
    commit();
  }
  function nudge(dx, dy) {
    const els = selected().filter((e) => !e.locked);
    if (!els.length) return;
    els.forEach((el) => { el.x += dx; el.y += dy; });
    commit();
  }

  function addPage(after = S.pageIdx) {
    S.design.pages.splice(after + 1, 0, G.newPage());
    S.pageIdx = after + 1;
    S.sel = [];
    commit();
    const wrap = document.querySelectorAll('.page-wrap')[S.pageIdx];
    if (wrap) wrap.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function duplicatePage(i) {
    const copy = G.clone(S.design.pages[i]);
    copy.id = G.uid();
    copy.elements.forEach((e) => (e.id = G.uid()));
    S.design.pages.splice(i + 1, 0, copy);
    S.pageIdx = i + 1;
    S.sel = [];
    commit();
  }
  function deletePage(i) {
    if (S.design.pages.length === 1) {
      S.design.pages[0].elements = [];
    } else {
      S.design.pages.splice(i, 1);
      S.pageIdx = Math.max(0, Math.min(S.pageIdx, S.design.pages.length - 1));
    }
    S.sel = [];
    commit();
  }
  function movePage(i, d) {
    const p = S.design.pages;
    const j = i + d;
    if (j < 0 || j >= p.length) return;
    [p[i], p[j]] = [p[j], p[i]];
    S.pageIdx = j;
    commit();
  }

  /* ---------- zoom ---------- */
  function setZoom(z, fit = false) {
    S.zoom = Math.max(0.05, Math.min(4, z));
    S.fit = fit;
    $('#zoom').value = Math.round(S.zoom * 100);
    $('#zoom-label').textContent = Math.round(S.zoom * 100) + ' %';
    renderAll();
  }
  function zoomFit() {
    const sc = $('#scroller');
    const z = Math.min((sc.clientWidth - 80) / W(), (sc.clientHeight - 90) / H());
    setZoom(z, true);
  }

  /* ---------- images ---------- */
  function readAsDataUrl(file) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  }
  function loadImg(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }
  async function importImage(file) {
    let src = await readAsDataUrl(file);
    let img = await loadImg(src);
    const MAX = 2400;
    if (Math.max(img.naturalWidth, img.naturalHeight) > MAX && file.type !== 'image/svg+xml') {
      const r = MAX / Math.max(img.naturalWidth, img.naturalHeight);
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * r);
      c.height = Math.round(img.naturalHeight * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      src = file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.9);
      img = await loadImg(src);
    }
    const id = G.uid();
    S.design.assets[id] = { src, name: file.name, w: img.naturalWidth, h: img.naturalHeight };
    return id;
  }
  function addImageAsset(assetId, at) {
    const a = S.design.assets[assetId];
    const r = Math.min((W() * 0.6) / a.w, (H() * 0.6) / a.h, 1);
    addElement(G.makeImage(assetId, { w: a.w * r, h: a.h * r }), at);
  }
  async function addImageFiles(files, at) {
    const imgs = [...files].filter((f) => f.type.startsWith('image/'));
    for (const f of imgs) {
      try { addImageAsset(await importImage(f), at); } catch (e) { alert('Image illisible : ' + f.name); }
    }
  }

  /* ---------- barre contextuelle ---------- */
  function refreshBg() {
    const f = S.frames[S.pageIdx];
    if (f) f.pg.style.background = G.backgroundCss(page().background);
  }
  function applyLive(fn) {
    const els = selected();
    els.forEach(fn);
    els.forEach(updateNode);
    drawOverlay();
  }
  function colorInput(value, onLive) {
    const i = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff' });
    i.addEventListener('input', () => onLive(i.value));
    i.addEventListener('change', commit);
    return i;
  }
  function numInput(value, min, max, step, onLive, width = 56) {
    const i = h('input', { type: 'number', value: Math.round(value * 100) / 100, min, max, step, style: `width:${width}px` });
    i.addEventListener('input', () => { const v = parseFloat(i.value); if (!isNaN(v)) onLive(Math.max(min, Math.min(max, v))); });
    i.addEventListener('change', commit);
    return i;
  }
  const field = (label, ...ctl) => h('label', { class: 'field' }, h('span', {}, label), ...ctl);
  const toggle = (label, title, on, fn) => h('button', { class: 'tool' + (on ? ' on' : ''), title, onclick: fn }, label);
  const sep = () => h('div', { class: 'sep' });

  function buildCtx() {
    const bar = $('#ctxbar');
    if (!bar) return;
    bar.innerHTML = '';
    const sel = selected();
    if (!sel.length) {
      const bg = page().background;
      bar.append(h('strong', { class: 'ctx-title' }, `Page ${S.pageIdx + 1}`),
        field('Fond', colorInput(bg.color, (v) => { bg.color = v; refreshBg(); })));
      bar.append(toggle('Dégradé', 'Fond en dégradé', bg.type === 'gradient', () => {
        if (bg.type === 'gradient') bg.type = 'solid';
        else Object.assign(bg, { type: 'gradient', color2: bg.color2 || '#f97316', angle: bg.angle || 135 });
        commit();
      }));
      if (bg.type === 'gradient') {
        bar.append(field('2ᵉ couleur', colorInput(bg.color2, (v) => { bg.color2 = v; refreshBg(); })),
          field('Angle', numInput(bg.angle || 0, 0, 360, 5, (v) => { bg.angle = v; refreshBg(); })));
      }
      bar.append(h('div', { class: 'spacer' }), h('span', { class: 'muted' }, `${W()} × ${H()} px`));
      return;
    }
    const el = sel[0];
    if (sel.length === 1 && el.type === 'text') {
      const font = h('select', { class: 'font-select', onchange: (e) => { applyLive((x) => (x.fontFamily = e.target.value)); commit(); } },
        G.FONTS.map((f) => h('option', { value: f, style: `font-family:"${f}"`, selected: f === el.fontFamily }, f)));
      const size = numInput(el.fontSize, 4, 800, 1, (v) => applyLive((x) => (x.fontSize = v)));
      const step = (d) => () => { applyLive((x) => (x.fontSize = Math.max(4, Math.round(x.fontSize + d)))); commit(); };
      bar.append(font,
        h('div', { class: 'stepper' }, h('button', { class: 'tool', title: 'Réduire', onclick: step(-2) }, '−'), size, h('button', { class: 'tool', title: 'Agrandir', onclick: step(2) }, '+')),
        h('label', { class: 'swatch', title: 'Couleur du texte' }, h('span', { class: 'swatch-a', style: `border-bottom-color:${el.color}` }, 'A'), colorInput(el.color, (v) => applyLive((x) => (x.color = v)))),
        toggle(h('b', {}, 'G'), 'Gras', el.bold, () => { applyLive((x) => (x.bold = !x.bold)); commit(); }),
        toggle(h('i', {}, 'I'), 'Italique', el.italic, () => { applyLive((x) => (x.italic = !x.italic)); commit(); }),
        toggle(h('u', {}, 'S'), 'Souligné', el.underline, () => { applyLive((x) => (x.underline = !x.underline)); commit(); }),
        h('select', { title: 'Alignement', onchange: (e) => { applyLive((x) => (x.align = e.target.value)); commit(); } },
          [['left', 'Gauche'], ['center', 'Centre'], ['right', 'Droite']].map(([v, l]) => h('option', { value: v, selected: el.align === v }, l))),
        field('Interligne', numInput(el.lineHeight, 0.5, 3, 0.05, (v) => applyLive((x) => (x.lineHeight = v)), 52)),
        field('Espacement', numInput(el.letterSpacing || 0, -20, 100, 0.5, (v) => applyLive((x) => (x.letterSpacing = v)), 52)),
        sep());
    } else if (sel.length === 1 && el.type === 'shape') {
      if (el.shape !== 'line') {
        const none = el.fill === 'transparent';
        bar.append(field('Remplissage', colorInput(el.fill, (v) => applyLive((x) => (x.fill = v)))),
          toggle('∅', 'Sans remplissage', none, () => { applyLive((x) => (x.fill = none ? '#8b5cf6' : 'transparent')); commit(); }));
      }
      bar.append(field(el.shape === 'line' ? 'Couleur' : 'Contour', colorInput(el.stroke, (v) => applyLive((x) => (x.stroke = v)))),
        field('Épaisseur', numInput(el.strokeWidth, 0, 200, 1, (v) => applyLive((x) => (x.strokeWidth = v)))));
      if (el.shape === 'rect' || el.shape === 'roundrect') bar.append(field('Arrondi', numInput(el.radius || 0, 0, 2000, 1, (v) => applyLive((x) => (x.radius = v)))));
      bar.append(sep());
    } else if (sel.length === 1 && el.type === 'image') {
      bar.append(field('Arrondi', numInput(el.radius || 0, 0, 5000, 1, (v) => applyLive((x) => (x.radius = v)))), sep());
    } else {
      bar.append(h('strong', { class: 'ctx-title' }, `${sel.length} éléments`), sep());
    }
    const op = h('input', { type: 'range', min: 0, max: 100, value: Math.round(el.opacity * 100), style: 'width:80px' });
    op.addEventListener('input', () => applyLive((x) => (x.opacity = op.value / 100)));
    op.addEventListener('change', commit);
    bar.append(field('Opacité', op));
    if (sel.length === 1) {
      bar.append(field('Rotation', numInput(el.rotation || 0, -360, 360, 1, (v) => applyLive((x) => (x.rotation = v)), 52)));
    }
    const menu = (title, opts, fn) => {
      const s = h('select', { class: 'menu', title, onchange: () => { if (s.value) fn(s.value); s.value = ''; } },
        h('option', { value: '' }, title), opts.map(([v, l]) => h('option', { value: v }, l)));
      return s;
    };
    bar.append(sep(),
      menu('Disposition', [['front', 'Premier plan'], ['forward', 'Avancer'], ['backward', 'Reculer'], ['back', 'Arrière-plan']], arrange),
      menu('Aligner', [['left', 'À gauche'], ['hcenter', 'Centrer horizontalement'], ['right', 'À droite'], ['top', 'En haut'], ['vcenter', 'Centrer verticalement'], ['bottom', 'En bas']], align),
      h('div', { class: 'spacer' }),
      h('button', { class: 'tool', title: 'Dupliquer (Ctrl+D)', onclick: duplicateSel }, '⧉'),
      toggle(sel.every((e) => e.locked) ? '🔒' : '🔓', 'Verrouiller', sel.every((e) => e.locked), toggleLock),
      h('button', { class: 'tool danger', title: 'Supprimer (Suppr)', onclick: deleteSel }, '🗑'));
  }

  /* ---------- panneau latéral ---------- */
  function buildPanel() {
    const panel = $('#panel');
    if (!panel) return;
    const scroll = panel.scrollTop;
    panel.innerHTML = '';
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
    const title = (t, sub) => [h('h3', {}, t), sub && h('p', { class: 'muted small' }, sub)];

    if (S.tab === 'templates') {
      panel.append(...title('Modèles', 'Cliquez pour appliquer un modèle à la page sélectionnée.'));
      const grid = h('div', { class: 'tpl-grid' });
      for (const t of G.TEMPLATES) {
        const tmp = { width: t.w, height: t.h, assets: {} };
        const card = h('button', { class: 'tpl-card', title: t.name, onclick: () => {
          const p = G.pageFromTemplate(t, W(), H());
          page().background = p.background;
          page().elements = p.elements;
          S.sel = [];
          commit();
        } }, G.renderPreview(tmp, G.pageFromTemplate(t, t.w, t.h), 130, 130), h('span', {}, t.name));
        grid.append(card);
      }
      panel.append(grid);
    }

    if (S.tab === 'text') {
      panel.append(...title('Texte', 'Double-cliquez sur un texte pour le modifier.'));
      const add = (o) => addElement(G.makeText(Object.assign({ w: W() * 0.7 }, o)));
      panel.append(
        h('button', { class: 'text-preset t1', onclick: () => add({ text: 'Ajouter un titre', fontSize: Math.round(84 * k()), bold: true, align: 'center' }) }, 'Ajouter un titre'),
        h('button', { class: 'text-preset t2', onclick: () => add({ text: 'Ajouter un sous-titre', fontSize: Math.round(52 * k()), bold: true, align: 'center' }) }, 'Ajouter un sous-titre'),
        h('button', { class: 'text-preset t3', onclick: () => add({ text: 'Ajouter un peu de texte', fontSize: Math.round(32 * k()), align: 'center' }) }, 'Ajouter un peu de texte'),
        h('h4', {}, 'Styles de police'));
      const styles = [
        { label: 'IMPACT', text: 'GRAND TITRE', fontFamily: 'Impact', fontSize: 110, color: '#111827', letterSpacing: 2 },
        { label: 'Élégant', text: 'Élégance', fontFamily: 'Georgia', fontSize: 90, italic: true, color: '#7c2d12' },
        { label: 'Manuscrit', text: 'Avec amour', fontFamily: 'Brush Script MT', fontSize: 110, color: '#be185d' },
        { label: 'Néon', text: 'NÉON', fontFamily: 'Arial Black', fontSize: 110, color: '#d946ef', bold: true },
        { label: 'Machine', text: 'Note importante', fontFamily: 'Courier New', fontSize: 56, color: '#1f2937', bold: true },
      ];
      for (const st of styles) {
        panel.append(h('button', { class: 'font-style', style: `font-family:"${st.fontFamily}";color:${st.color};font-style:${st.italic ? 'italic' : 'normal'};font-weight:${st.bold ? 700 : 400}`, onclick: () => {
          const o = Object.assign({}, st);
          delete o.label;
          o.fontSize = Math.round(o.fontSize * k());
          o.letterSpacing = (o.letterSpacing || 0) * k();
          add(Object.assign(o, { align: 'center' }));
        } }, st.label));
      }
    }

    if (S.tab === 'elements') {
      panel.append(...title('Formes', 'Cliquez pour ajouter, puis personnalisez couleurs et contours.'));
      const grid = h('div', { class: 'shape-grid' });
      for (const shape of G.SHAPES) {
        const demo = G.makeShape(shape, { w: 64, h: shape === 'line' ? 20 : 64, fill: '#8b5cf6', stroke: '#374151', strokeWidth: shape === 'line' ? 4 : 0, radius: shape === 'roundrect' ? 14 : 0 });
        if (shape === 'arrow') demo.h = 44;
        const prev = G.renderElement(Object.assign(demo, { x: 0, y: 0 }), S.design);
        prev.style.position = 'relative';
        grid.append(h('button', { class: 'shape-btn', title: SHAPE_NAMES[shape], onclick: () => {
          const size = Math.min(W(), H()) * 0.3;
          const o = { w: size, h: size, radius: shape === 'roundrect' ? size * 0.15 : 0 };
          if (shape === 'line') Object.assign(o, { w: W() * 0.4, h: 20 * k() + 10, strokeWidth: Math.max(2, 8 * k()) });
          if (shape === 'arrow') o.h = size * 0.7;
          addElement(G.makeShape(shape, o));
        } }, prev));
      }
      panel.append(grid);
    }

    if (S.tab === 'uploads') {
      panel.append(...title('Importer', 'Images PNG, JPG, SVG, WebP… Vous pouvez aussi les glisser sur la page ou les coller (Ctrl+V).'));
      panel.append(h('button', { class: 'btn primary block', onclick: () => $('#file-image').click() }, 'Importer des images'));
      const ids = Object.keys(S.design.assets);
      if (ids.length) {
        panel.append(h('h4', {}, 'Images de ce design'));
        const grid = h('div', { class: 'asset-grid' });
        for (const id of ids) {
          grid.append(h('button', { class: 'asset', title: S.design.assets[id].name, onclick: () => addImageAsset(id) },
            h('img', { src: S.design.assets[id].src, draggable: false })));
        }
        panel.append(grid);
      }
    }

    if (S.tab === 'background') {
      panel.append(...title('Fond', 'S’applique à la page sélectionnée.'));
      const bg = page().background;
      const grid = h('div', { class: 'swatches' });
      for (const c of G.PALETTE) {
        grid.append(h('button', { class: 'sw', style: `background:${c}`, title: c, onclick: () => { page().background = { type: 'solid', color: c }; commit(); } }));
      }
      const custom = colorInput(bg.color, (v) => { page().background = { type: 'solid', color: v }; refreshBg(); });
      panel.append(grid, field('Couleur personnalisée', custom), h('h4', {}, 'Dégradés'));
      const g2 = h('div', { class: 'swatches big' });
      for (const [a, b] of GRADIENTS) {
        g2.append(h('button', { class: 'sw', style: `background:linear-gradient(135deg, ${a}, ${b})`, onclick: () => { page().background = { type: 'gradient', color: a, color2: b, angle: 135 }; commit(); } }));
      }
      panel.append(g2, h('button', { class: 'btn block', onclick: () => {
        S.design.pages.forEach((p) => (p.background = G.clone(page().background)));
        commit();
      } }, 'Appliquer à toutes les pages'));
    }

    if (S.tab === 'layers') {
      panel.append(...title('Calques', 'Du premier plan à l’arrière-plan.'));
      const list = h('div', { class: 'layers' });
      const els = [...page().elements].reverse();
      if (!els.length) list.append(h('p', { class: 'muted small' }, 'Cette page est vide.'));
      for (const el of els) {
        const label = el.type === 'text' ? el.text.split('\n')[0].slice(0, 28) || '(texte vide)' : el.type === 'image' ? 'Image' : SHAPE_NAMES[el.shape];
        const kind = el.type === 'text' ? 'T' : el.type === 'image' ? '▣' : '◆';
        list.append(h('div', { class: 'layer' + (S.sel.includes(el.id) ? ' on' : ''), onclick: (e) => {
          S.sel = e.shiftKey ? [...new Set([...S.sel, el.id])] : [el.id];
          drawOverlay(); buildCtx(); buildPanel();
        } },
        h('span', { class: 'kind' }, kind), h('span', { class: 'lname' }, label),
        h('button', { class: 'mini', title: el.hidden ? 'Afficher' : 'Masquer', onclick: (e) => { e.stopPropagation(); el.hidden = !el.hidden; commit(); } }, el.hidden ? '◌' : '👁'),
        h('button', { class: 'mini', title: el.locked ? 'Déverrouiller' : 'Verrouiller', onclick: (e) => { e.stopPropagation(); el.locked = !el.locked; commit(); } }, el.locked ? '🔒' : '🔓')));
      }
      panel.append(list);
    }
    panel.scrollTop = scroll;
  }

  /* ---------- export ---------- */
  function openExport() {
    const m = $('#export-modal');
    m.classList.remove('hidden');
    $('#exp-pages').innerHTML = '';
    $('#exp-pages').append(h('option', { value: 'all' }, `Toutes les pages (${S.design.pages.length})`),
      h('option', { value: 'current' }, `Page actuelle (${S.pageIdx + 1})`));
  }
  async function doExport() {
    const fmt = $('#exp-format').value;
    const scale = parseFloat($('#exp-scale').value);
    const pages = $('#exp-pages').value === 'all' ? S.design.pages.map((_, i) => i) : [S.pageIdx];
    const btn = $('#exp-go');
    btn.disabled = true;
    btn.textContent = 'Préparation…';
    try {
      if (fmt === 'gbaki') saveFile();
      else await G.exportDesign(S.design, fmt, scale, pages);
      $('#export-modal').classList.add('hidden');
    } catch (e) {
      alert('Export impossible : ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Télécharger';
    }
  }
  function saveFile() {
    const blob = new Blob([JSON.stringify(Object.assign({ gbaki: 1 }, S.design, { thumb: null }))], { type: 'application/json' });
    G.download(blob, (S.design.name || 'design').replace(/[\\/:*?"<>|]+/g, '-') + '.gbaki');
  }

  /* ---------- montage ---------- */
  G.openEditor = (design) => {
    S.active = true;
    S.design = design;
    S.design.assets = S.design.assets || {};
    S.pageIdx = 0;
    S.sel = [];
    S.editing = null;
    S.history = new G.History();
    S.history.reset(snapshot());
    const app = $('#app');
    app.innerHTML = '';
    app.append(h('div', { class: 'editor' },
      h('header', { class: 'topbar' },
        h('a', { class: 'brand', href: '#/' }, 'GBAKI'),
        h('a', { class: 'tb-btn', href: '#/' }, '← Accueil'),
        h('input', { id: 'design-name', class: 'name-input', value: design.name, title: 'Renommer le design',
          oninput: (e) => { S.design.name = e.target.value; markDirty(); } }),
        h('div', { class: 'spacer' }),
        h('button', { class: 'icon-btn', 'data-act': 'undo', title: 'Annuler (Ctrl+Z)', onclick: undo }, '↶'),
        h('button', { class: 'icon-btn', 'data-act': 'redo', title: 'Rétablir (Ctrl+Y)', onclick: redo }, '↷'),
        h('span', { id: 'save-state', class: 'save-state' }, 'Enregistré'),
        h('button', { class: 'tb-btn', onclick: saveFile, title: 'Télécharger le fichier projet (réouvrable sur un autre ordinateur)' }, 'Enregistrer .gbaki'),
        h('button', { class: 'tb-btn primary', onclick: openExport }, 'Télécharger')),
      h('div', { class: 'body' },
        h('nav', { class: 'tabs' }, TABS.map(([id, label]) => h('button', { 'data-tab': id, onclick: () => {
          S.tab = id;
          buildPanel();
        } }, h('span', { html: icon(id) }), h('span', {}, label)))),
        h('aside', { class: 'panel', id: 'panel' }),
        h('section', { class: 'workspace' },
          h('div', { class: 'ctxbar', id: 'ctxbar' }),
          h('div', { class: 'scroller', id: 'scroller' }, h('div', { class: 'pages', id: 'pages' })),
          h('footer', { class: 'statusbar' },
            h('button', { class: 'tb-btn', onclick: () => addPage() }, '+ Ajouter une page'),
            h('div', { class: 'spacer' }),
            h('button', { class: 'icon-btn', title: 'Zoom arrière', onclick: () => setZoom(S.zoom / 1.2) }, '−'),
            h('input', { id: 'zoom', type: 'range', min: 5, max: 300, oninput: (e) => setZoom(e.target.value / 100) }),
            h('button', { class: 'icon-btn', title: 'Zoom avant', onclick: () => setZoom(S.zoom * 1.2) }, '+'),
            h('span', { id: 'zoom-label', class: 'zoom-label' }),
            h('button', { class: 'tb-btn', onclick: zoomFit }, 'Ajuster')))),
      h('div', { class: 'modal hidden', id: 'export-modal', onclick: (e) => { if (e.target.id === 'export-modal') e.target.classList.add('hidden'); } },
        h('div', { class: 'modal-card' },
          h('h3', {}, 'Télécharger'),
          field('Type de fichier', h('select', { id: 'exp-format' },
            h('option', { value: 'png' }, 'PNG — qualité maximale'),
            h('option', { value: 'jpg' }, 'JPG — fichier léger'),
            h('option', { value: 'pdf' }, 'PDF — impression / partage'),
            h('option', { value: 'gbaki' }, 'Projet GBAKI (.gbaki) — modifiable'))),
          field('Taille', h('select', { id: 'exp-scale' },
            h('option', { value: '1' }, '× 1 (taille du design)'),
            h('option', { value: '2', selected: true }, '× 2 (haute définition)'),
            h('option', { value: '3' }, '× 3 (impression)'))),
          field('Pages', h('select', { id: 'exp-pages' })),
          h('div', { class: 'modal-actions' },
            h('button', { class: 'btn', onclick: () => $('#export-modal').classList.add('hidden') }, 'Annuler'),
            h('button', { class: 'btn primary', id: 'exp-go', onclick: doExport }, 'Télécharger')))),
      h('input', { type: 'file', id: 'file-image', accept: 'image/*', multiple: true, hidden: true,
        onchange: (e) => { addImageFiles(e.target.files); e.target.value = ''; } })));

    const scroller = $('#scroller');
    scroller.addEventListener('pointerdown', (e) => {
      if (e.target === scroller || e.target.id === 'pages') {
        if (S.editing) finishEditing();
        S.sel = []; drawOverlay(); buildCtx();
      }
    });
    scroller.addEventListener('wheel', (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(S.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    }, { passive: false });
    scroller.addEventListener('dragover', (e) => e.preventDefault());
    scroller.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!e.dataTransfer.files.length) return;
      const wrap = e.target.closest('.page-wrap');
      let at = null;
      if (wrap) {
        const pi = +wrap.dataset.page;
        setActivePage(pi);
        at = toDesign(e, pi);
      }
      addImageFiles(e.dataTransfer.files, at);
    });
    buildPanel();
    requestAnimationFrame(() => {
      zoomFit();
      S.history.reset(snapshot());
      $('[data-act=undo]').disabled = true;
    });
  };

  G.closeEditor = () => { S.active = false; S.design = null; };

  /* ---------- clavier et presse-papiers (installés une seule fois) ---------- */
  const typing = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  document.addEventListener('keydown', (e) => {
    if (!S.active || typing(e.target)) return;
    if (!$('#export-modal').classList.contains('hidden')) {
      if (e.key === 'Escape') $('#export-modal').classList.add('hidden');
      return;
    }
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (mod && key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    else if (mod && key === 'd') { e.preventDefault(); duplicateSel(); }
    else if (mod && key === 'c') { copySel(); }
    else if (mod && key === 'x') { copySel(); deleteSel(); }
    else if (mod && key === 'a') { e.preventDefault(); S.sel = page().elements.filter((x) => !x.hidden).map((x) => x.id); drawOverlay(); buildCtx(); }
    else if (mod && key === 's') { e.preventDefault(); save(); }
    else if (mod && (key === '=' || key === '+')) { e.preventDefault(); setZoom(S.zoom * 1.2); }
    else if (mod && key === '-') { e.preventDefault(); setZoom(S.zoom / 1.2); }
    else if (mod && key === '0') { e.preventDefault(); zoomFit(); }
    else if (key === 'delete' || key === 'backspace') { e.preventDefault(); deleteSel(); }
    else if (key === 'escape') { S.sel = []; drawOverlay(); buildCtx(); }
    else if (key === 'enter' && S.sel.length === 1) { e.preventDefault(); startEditing(S.sel[0]); }
    else if (key.startsWith('arrow')) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 1;
      nudge(key === 'arrowleft' ? -d : key === 'arrowright' ? d : 0, key === 'arrowup' ? -d : key === 'arrowdown' ? d : 0);
    }
  });
  document.addEventListener('paste', (e) => {
    if (!S.active || typing(e.target)) return;
    const files = [...(e.clipboardData ? e.clipboardData.files : [])].filter((f) => f.type.startsWith('image/'));
    if (files.length) { e.preventDefault(); addImageFiles(files); }
    else if (S.clipboard) { e.preventDefault(); paste(); }
    else {
      const text = e.clipboardData && e.clipboardData.getData('text/plain');
      if (text) { e.preventDefault(); addElement(G.makeText({ text, w: W() * 0.6, fontSize: Math.round(32 * k()) })); }
    }
  });
  window.addEventListener('resize', () => { if (S.active && S.fit) zoomFit(); });
})();
