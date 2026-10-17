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
    brand: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
  };
  const svgIcon = (inner) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const BASE_TABS = [
    ['templates', 'Modèles', ICON.templates], ['text', 'Texte', ICON.text], ['elements', 'Éléments', ICON.elements],
    ['uploads', 'Importer', ICON.uploads], ['background', 'Fond', ICON.background], ['brand', 'Marque', ICON.brand],
    ['layers', 'Calques', ICON.layers],
  ];
  const CONTEXT_TABS = ['effects', 'adjust', 'position'];
  const SHAPE_NAMES = {
    rect: 'Rectangle', roundrect: 'Rectangle arrondi', ellipse: 'Cercle', triangle: 'Triangle', righttriangle: 'Triangle rectangle',
    diamond: 'Losange', pentagon: 'Pentagone', hexagon: 'Hexagone', octagon: 'Octogone', star: 'Étoile', star6: 'Étoile à 6 branches',
    burst: 'Éclat', heart: 'Cœur', cross: 'Croix', parallelogram: 'Parallélogramme', trapezoid: 'Trapèze', chevron: 'Chevron',
    arrow: 'Flèche', doublearrow: 'Double flèche', bubble: 'Bulle', line: 'Ligne',
  };
  const MASK_NAMES = {
    none: 'Rectangle', ellipse: 'Cercle', roundrect: 'Arrondi', triangle: 'Triangle', diamond: 'Losange', hexagon: 'Hexagone',
    star: 'Étoile', heart: 'Cœur', bubble: 'Bulle', burst: 'Éclat',
  };
  const GRADIENTS = [
    ['#6d28d9', '#f97316'], ['#0ea5e9', '#22c55e'], ['#f43f5e', '#f59e0b'], ['#0f172a', '#1e3a8a'],
    ['#be185d', '#312e81'], ['#fde68a', '#fb7185'], ['#a7f3d0', '#3b82f6'], ['#111827', '#6b7280'],
    ['#fef3c7', '#fdba74'], ['#ecfccb', '#4d7c0f'], ['#e0e7ff', '#a855f7'], ['#fafaf9', '#d6d3d1'],
  ];
  G.WEB_FONTS = ['Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Raleway', 'Nunito', 'Playfair Display', 'Merriweather',
    'DM Serif Display', 'Oswald', 'Bebas Neue', 'Anton', 'Archivo Black', 'Abril Fatface', 'Pacifico', 'Dancing Script',
    'Great Vibes', 'Caveat', 'Lobster'];
  const WEB_BOLD = ['Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Raleway', 'Nunito', 'Playfair Display', 'Merriweather', 'Oswald', 'Dancing Script', 'Caveat'];

  /* Kit de marque : partagé entre tous les designs de ce navigateur. */
  G.brand = (() => {
    try { return Object.assign({ colors: [], heading: '', body: '' }, JSON.parse(localStorage.getItem('gbaki.brand') || '{}')); }
    catch (e) { return { colors: [], heading: '', body: '' }; }
  })();
  const saveBrand = () => { try { localStorage.setItem('gbaki.brand', JSON.stringify(G.brand)); } catch (e) { /* stockage indisponible */ } };

  const S = (G.editor = {
    active: false, design: null, pageIdx: 0, sel: [], zoom: 1, fit: true, history: new G.History(),
    clipboard: null, styleClip: null, editing: null, tab: 'templates', lastTab: 'templates', frames: [], guides: [],
    marquee: null, saveTimer: null, pop: null, drawing: false, pen: { color: '#111827', width: 8, kind: 'pen' }, stroke: null,
    grid: false, tplCat: 'Tous', replaceTarget: null,
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
  const snapshot = () => ({ name: S.design.name, width: S.design.width, height: S.design.height, pages: S.design.pages, fonts: S.design.fonts || [] });
  const W = () => S.design.width;
  const H = () => S.design.height;
  const k = () => Math.min(W(), H()) / 1080; // facteur d'échelle pour les tailles par défaut
  const withGroups = (ids) => {
    const els = page().elements;
    const gids = new Set(els.filter((e) => ids.includes(e.id) && e.groupId).map((e) => e.groupId));
    return els.filter((e) => ids.includes(e.id) || (e.groupId && gids.has(e.groupId))).map((e) => e.id);
  };

  /* ---------- sauvegarde ---------- */
  function markDirty() {
    const st = $('#save-state');
    if (st) st.textContent = 'Modifications…';
    clearTimeout(S.saveTimer);
    S.saveTimer = setTimeout(save, 700);
  }
  async function save() {
    clearTimeout(S.saveTimer);
    S.saveTimer = null;
    const d = S.design;
    if (!d) return;
    d.updatedAt = Date.now();
    try { d.thumb = await G.makeThumb(d); } catch (e) { /* aperçu facultatif */ }
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
    Object.assign(S.design, { name: snap.name, pages: snap.pages, fonts: snap.fonts || [] });
    const resized = snap.width !== S.design.width || snap.height !== S.design.height;
    S.design.width = snap.width;
    S.design.height = snap.height;
    S.pageIdx = Math.min(S.pageIdx, S.design.pages.length - 1);
    S.sel = S.sel.filter((id) => page().elements.some((e) => e.id === id));
    $('#design-name').value = S.design.name;
    markDirty();
    if (resized) zoomFit(); else renderAll();
  }
  const undo = () => restore(S.history.undo());
  const redo = () => restore(S.history.redo());

  /* ---------- rendu ---------- */
  function renderAll() {
    const pagesEl = $('#pages');
    if (!pagesEl) return;
    const scrollTop = $('#scroller').scrollTop;
    pagesEl.innerHTML = '';
    pagesEl.classList.toggle('show-grid', S.grid);
    S.frames = [];
    const z = S.zoom;
    S.design.pages.forEach((p, i) => {
      const many = S.design.pages.length > 1;
      const bar = h('div', { class: 'page-bar' },
        h('span', { class: 'page-title' }, `Page ${i + 1}`),
        h('input', { class: 'page-note', placeholder: 'Ajouter un titre de page', value: p.title || '', onchange: (e) => { p.title = e.target.value; commit(); } }),
        h('div', { class: 'spacer' }),
        many && i > 0 && h('button', { class: 'mini', title: 'Monter la page', onclick: () => movePage(i, -1) }, '↑'),
        many && i < S.design.pages.length - 1 && h('button', { class: 'mini', title: 'Descendre la page', onclick: () => movePage(i, 1) }, '↓'),
        h('button', { class: 'mini', title: 'Dupliquer la page', onclick: () => duplicatePage(i) }, '⧉'),
        h('button', { class: 'mini', title: many ? 'Supprimer la page' : 'Vider la page', onclick: () => deletePage(i) }, '✕'),
        h('button', { class: 'mini', title: 'Ajouter une page après', onclick: () => addPage(i) }, '+'));
      const frame = h('div', { class: 'page-frame', style: `width:${W() * z}px;height:${H() * z}px;--z:${z};--grid:${(Math.min(W(), H()) / 12) * z}px` });
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
      if (n) enterEdit(n, findEl(S.editing).el, false);
      else S.editing = null;
    }
    drawOverlay();
    buildCtx();
    if (['layers', 'uploads', ...CONTEXT_TABS].includes(S.tab)) buildPanel();
    $('[data-act=undo]').disabled = S.history.i <= 0;
    $('[data-act=redo]').disabled = S.history.i >= S.history.stack.length - 1;
  }

  function nodeOf(id, pi = S.pageIdx) {
    const f = S.frames[pi];
    return f && f.pg.querySelector(`[data-id="${id}"]`);
  }
  function measureTexts() {
    S.design.pages.forEach((p, i) => p.elements.forEach((el) => {
      if (el.type !== 'text' || el.hidden || el.curve) return;
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
      if (el.uppercase) old.style.textTransform = 'uppercase';
      el.h = old.offsetHeight;
      return;
    }
    old.replaceWith(n);
    if (el.type === 'text' && !el.curve) el.h = n.offsetHeight;
  }

  function drawOverlay() {
    const z = S.zoom;
    S.frames.forEach(({ ov }, i) => {
      ov.innerHTML = '';
      if (i !== S.pageIdx) return;
      const sel = selected();
      const multi = sel.length > 1;
      for (const el of sel) {
        const box = h('div', {
          class: 'sel-box' + (el.locked ? ' locked' : '') + (S.editing === el.id ? ' editing' : '') + (multi ? ' multi' : ''),
          style: `left:${el.x * z}px;top:${el.y * z}px;width:${el.w * z}px;height:${el.h * z}px;transform:rotate(${el.rotation || 0}deg)`,
        });
        if (!multi && !el.locked && S.editing !== el.id) {
          let dirs = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
          if (el.type === 'text') dirs = el.curve ? ['nw', 'ne', 'sw', 'se'] : ['nw', 'ne', 'sw', 'se', 'w', 'e'];
          else if (el.shape === 'line') dirs = ['w', 'e'];
          for (const d of dirs) box.append(h('div', { class: 'handle h-' + d, 'data-handle': d }));
          box.append(h('div', { class: 'handle rot', 'data-handle': 'rot', title: 'Faire pivoter', html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>' }));
        }
        if (el.locked) box.append(h('div', { class: 'lock-badge' }, '🔒'));
        ov.append(box);
      }
      if (multi && sel.every((e) => !e.locked)) {
        const b = bbox(sel);
        const grouped = sel[0].groupId && sel.every((e) => e.groupId === sel[0].groupId);
        const gb = h('div', { class: 'sel-box group' + (grouped ? ' grouped' : ''), style: `left:${b.x * z}px;top:${b.y * z}px;width:${b.w * z}px;height:${b.h * z}px` });
        for (const d of ['nw', 'ne', 'se', 'sw']) gb.append(h('div', { class: 'handle h-' + d, 'data-handle': 'g-' + d }));
        ov.append(gb);
      }
      for (const g of S.guides) {
        ov.append(h('div', { class: 'guide ' + g.axis, style: g.axis === 'v' ? `left:${g.pos * z}px` : `top:${g.pos * z}px` }));
      }
      if (S.marquee) {
        const m = S.marquee;
        ov.append(h('div', { class: 'marquee', style: `left:${m.x * z}px;top:${m.y * z}px;width:${m.w * z}px;height:${m.h * z}px` }));
      }
      if (S.stroke && S.stroke.pi === i) {
        const pts = S.stroke.pts.map(([x, y]) => `${x * z},${y * z}`).join(' ');
        ov.insertAdjacentHTML('beforeend', `<svg class="stroke-preview" width="100%" height="100%"><polyline points="${pts}" fill="none" stroke="${S.pen.color}" stroke-width="${S.pen.width * z}" stroke-linecap="round" stroke-linejoin="round" opacity="${S.pen.kind === 'highlighter' ? 0.4 : 1}"/></svg>`);
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
  function selectionChanged() {
    drawOverlay();
    buildCtx();
    if (['layers', ...CONTEXT_TABS].includes(S.tab)) buildPanel();
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
    closePop();
    const handle = e.target.closest('[data-handle]');
    const node = e.target.closest('.el');
    if (S.editing) {
      if (node && node.dataset.id === S.editing) return;
      finishEditing();
    }
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    setActivePage(pi);
    e.preventDefault();
    if (S.drawing) { startStroke(e, pi); return; }
    if (handle) {
      const hd = handle.dataset.handle;
      if (hd.startsWith('g-')) { startGroupResize(e, pi, hd.slice(2)); return; }
      const el = selected()[0];
      if (!el) return;
      if (hd === 'rot') startRotate(e, pi, el);
      else startResize(e, pi, el, hd);
      return;
    }
    if (node) {
      const id = node.dataset.id;
      const grp = withGroups([id]);
      if (e.shiftKey) S.sel = S.sel.includes(id) ? S.sel.filter((x) => !grp.includes(x)) : [...new Set([...S.sel, ...grp])];
      else if (!S.sel.includes(id)) S.sel = grp;
      selectionChanged();
      const movable = selected().filter((x) => !x.locked);
      if (movable.length && S.sel.includes(id)) startMove(e, pi, movable);
      return;
    }
    S.sel = [];
    selectionChanged();
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
    const type = G.TYPES[el.type];
    const ratioLocked = hx && hy && (el.type === 'image' || el.type === 'text' || (type && type.keepRatio));
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
      S.hint = { x: el.x + el.w / 2, y: el.y + el.h + 30 / S.zoom, text: el.type === 'text' ? `${el.fontSize} px` : `${Math.round(el.w)} × ${Math.round(el.h)}` };
      drawOverlay();
    }, () => { S.hint = null; commit(); });
  }

  function startGroupResize(e, pi, dir) {
    const els = selected();
    const orig = els.map((el) => G.clone(el));
    const B = bbox(els);
    const ax = dir.includes('w') ? B.x + B.w : B.x, ay = dir.includes('n') ? B.y + B.h : B.y;
    const cx = dir.includes('w') ? B.x : B.x + B.w, cy = dir.includes('n') ? B.y : B.y + B.h;
    const start = toDesign(e, pi);
    drag((ev) => {
      const p = toDesign(ev, pi);
      const nx = cx + p.x - start.x, ny = cy + p.y - start.y;
      const s = Math.max(0.05, Math.max(Math.abs(nx - ax) / B.w, Math.abs(ny - ay) / B.h));
      els.forEach((el, i) => {
        Object.assign(el, G.scaleElements([G.clone(orig[i])], s, ax * (1 - s), ay * (1 - s))[0]);
        updateNode(el);
      });
      S.hint = { x: B.x + (B.w * s) / 2, y: Math.max(ay, ay + (cy - ay) * s) + 30 / S.zoom, text: `${Math.round(s * 100)} %` };
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
      S.sel = withGroups(page().elements
        .filter((el) => !el.hidden && el.x < m.x + m.w && el.x + el.w > m.x && el.y < m.y + m.h && el.y + el.h > m.y)
        .map((el) => el.id));
      drawOverlay();
    }, () => {
      S.marquee = null;
      selectionChanged();
    });
  }

  /* ---------- dessin à main levée ---------- */
  function startDrawing() {
    S.drawing = true;
    S.sel = [];
    document.body.classList.add('drawing');
    selectionChanged();
  }
  function stopDrawing() {
    S.drawing = false;
    document.body.classList.remove('drawing');
    buildCtx();
  }
  function startStroke(e, pi) {
    const p0 = toDesign(e, pi);
    S.stroke = { pi, pts: [[p0.x, p0.y]] };
    drag((ev) => {
      const p = toDesign(ev, pi);
      const last = S.stroke.pts[S.stroke.pts.length - 1];
      if (Math.hypot(p.x - last[0], p.y - last[1]) * S.zoom < 2) return;
      S.stroke.pts.push([p.x, p.y]);
      drawOverlay();
    }, () => {
      const pts = S.stroke.pts;
      S.stroke = null;
      if (pts.length < 2) { pts.push([pts[0][0] + 0.5, pts[0][1] + 0.5]); }
      const pad = S.pen.width / 2 + 1;
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
      const w = Math.max(...xs) + pad - x, hh = Math.max(...ys) + pad - y;
      const hl = S.pen.kind === 'highlighter';
      page().elements.push(Object.assign(G.base(), {
        type: 'draw', x, y, w, h: hh, w0: w, h0: hh, points: pts.map(([px, py]) => [Math.round((px - x) * 10) / 10, Math.round((py - y) * 10) / 10]),
        stroke: S.pen.color, strokeWidth: S.pen.width, opacity: hl ? 0.4 : 1, cap: hl ? 'square' : 'round',
      }));
      commit();
    });
  }
  // Élément « dessin » : tracé lissé, l'épaisseur ne change pas quand on redimensionne.
  G.TYPES.draw = {
    label: 'Dessin',
    svg(el) {
      const p = el.points;
      let d = `M ${p[0][0]} ${p[0][1]}`;
      for (let i = 1; i < p.length - 1; i++) {
        const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
        d += ` Q ${p[i][0]} ${p[i][1]} ${mx} ${my}`;
      }
      d += ` L ${p[p.length - 1][0]} ${p[p.length - 1][1]}`;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${el.w}" height="${el.h}" viewBox="0 0 ${el.w0} ${el.h0}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" stroke-linecap="${el.cap || 'round'}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
    },
    controls(el, ui) {
      return [ui.field('Couleur', ui.color(el.stroke, (v) => ui.live((x) => (x.stroke = v)))),
        ui.field('Épaisseur', ui.number(el.strokeWidth, 1, 200, 1, (v) => ui.live((x) => (x.strokeWidth = v))))];
    },
  };

  /* ---------- édition de texte en place ---------- */
  function onDblClick(e, pi) {
    if (pi !== S.pageIdx || S.drawing) return;
    const node = e.target.closest('.el');
    if (!node) return;
    const { el } = findEl(node.dataset.id);
    if (!el) return;
    if (el.type === 'text') startEditing(el.id);
    else if (el.type === 'image') { S.sel = [el.id]; openContext('adjust'); }
    else if (G.TYPES[el.type] && G.TYPES[el.type].edit) G.TYPES[el.type].edit(el, ui);
  }
  function startEditing(id) {
    const { el } = findEl(id);
    if (!el || el.type !== 'text' || el.locked) return;
    if (el.curve) {
      promptModal('Modifier le texte', el.text, (v) => { el.text = v; commit(); });
      return;
    }
    S.editing = id;
    S.sel = [id];
    enterEdit(nodeOf(id), el, true);
    drawOverlay();
    buildCtx();
  }
  function enterEdit(node, el, selectAll) {
    node.textContent = el.text;
    if (el.uppercase) node.style.textTransform = 'uppercase';
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
      if (ev.relatedTarget && ev.relatedTarget.closest('#ctxbar, .popover')) return;
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
    if (S.drawing) stopDrawing();
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
    const gmap = {};
    return els.map((el) => {
      const c = Object.assign(G.clone(el), { id: G.uid(), x: el.x + offset, y: el.y + offset, locked: false });
      if (c.groupId) c.groupId = gmap[c.groupId] || (gmap[c.groupId] = G.uid());
      return c;
    });
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
  const STYLE_SKIP = ['id', 'type', 'x', 'y', 'w', 'h', 'w0', 'h0', 'rotation', 'text', 'assetId', 'points', 'groupId', 'locked', 'hidden', 'data', 'rows', 'crop', 'name', 'shape'];
  function copyStyle() {
    const el = selected()[0];
    if (!el) return;
    const props = {};
    for (const [key, v] of Object.entries(el)) if (!STYLE_SKIP.includes(key)) props[key] = G.clone(v);
    S.styleClip = { type: el.type, props };
    toast('Style copié — sélectionnez un élément puis « Coller le style » (Ctrl+Alt+V)');
    buildCtx();
  }
  function pasteStyle() {
    if (!S.styleClip) return;
    const els = selected();
    for (const el of els) {
      if (el.type === S.styleClip.type) Object.assign(el, G.clone(S.styleClip.props));
      else for (const key of ['opacity', 'shadow']) if (key in S.styleClip.props) el[key] = G.clone(S.styleClip.props[key]);
    }
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
    const grouped = els.length > 1 && els[0].groupId && els.every((e) => e.groupId === els[0].groupId);
    if (els.length === 1 || grouped) {
      // Un élément ou un groupe : aligné sur la page, en bloc.
      const b = bbox(els);
      let dx = 0, dy = 0;
      if (mode === 'left') dx = -b.x;
      if (mode === 'hcenter') dx = (W() - b.w) / 2 - b.x;
      if (mode === 'right') dx = W() - b.w - b.x;
      if (mode === 'top') dy = -b.y;
      if (mode === 'vcenter') dy = (H() - b.h) / 2 - b.y;
      if (mode === 'bottom') dy = H() - b.h - b.y;
      els.forEach((el) => { el.x += dx; el.y += dy; });
    } else {
      const ref = bbox(els);
      for (const el of els) {
        if (mode === 'left') el.x = ref.x;
        if (mode === 'hcenter') el.x = ref.x + (ref.w - el.w) / 2;
        if (mode === 'right') el.x = ref.x + ref.w - el.w;
        if (mode === 'top') el.y = ref.y;
        if (mode === 'vcenter') el.y = ref.y + (ref.h - el.h) / 2;
        if (mode === 'bottom') el.y = ref.y + ref.h - el.h;
      }
    }
    commit();
  }
  function distribute(axis) {
    const els = selected().filter((e) => !e.locked);
    if (els.length < 3) return;
    const P = axis === 'h' ? 'x' : 'y', D = axis === 'h' ? 'w' : 'h';
    els.sort((a, b) => a[P] - b[P]);
    const first = els[0][P], last = els[els.length - 1][P] + els[els.length - 1][D];
    const gap = (last - first - els.reduce((s, e) => s + e[D], 0)) / (els.length - 1);
    let pos = first;
    for (const el of els) { el[P] = pos; pos += el[D] + gap; }
    commit();
  }
  function group() {
    const els = selected();
    if (els.length < 2) return;
    const gid = G.uid();
    els.forEach((e) => (e.groupId = gid));
    // Les éléments d'un groupe deviennent contigus dans l'ordre des calques.
    const list = page().elements;
    const top = Math.max(...els.map((e) => list.indexOf(e)));
    const rest = list.filter((e) => !els.includes(e));
    const at = rest.indexOf(list.slice(top + 1).find((e) => !els.includes(e)));
    rest.splice(at < 0 ? rest.length : at, 0, ...list.filter((e) => els.includes(e)));
    page().elements = rest;
    commit();
  }
  function ungroup() {
    selected().forEach((e) => delete e.groupId);
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
  function setAsBackground() {
    const el = selected()[0];
    if (!el || el.type !== 'image') return;
    Object.assign(el, { x: 0, y: 0, w: W(), h: H(), rotation: 0, mask: 'none', radius: 0, locked: true });
    delete el.groupId;
    page().elements = [el, ...page().elements.filter((e) => e !== el)];
    S.sel = [];
    commit();
    toast('Image placée en arrière-plan et verrouillée (déverrouillez-la depuis les Calques).');
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
    copy.elements = cloneEls(copy.elements, 0);
    S.design.pages.splice(i + 1, 0, copy);
    S.pageIdx = i + 1;
    S.sel = [];
    commit();
  }
  function deletePage(i) {
    if (S.design.pages.length === 1) S.design.pages[0].elements = [];
    else {
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
  function applyTemplate(t) {
    const pages = G.pagesFromTemplate(t, W(), H());
    page().background = pages[0].background;
    page().elements = pages[0].elements;
    if (pages.length > 1) S.design.pages.splice(S.pageIdx + 1, 0, ...pages.slice(1));
    S.sel = [];
    commit();
    if (pages.length > 1) toast(`${pages.length} pages ajoutées depuis le modèle.`);
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
  async function addImageFiles(files, at, target) {
    const imgs = [...files].filter((f) => f.type.startsWith('image/'));
    for (const f of imgs) {
      try {
        const id = await importImage(f);
        if (target) { target.assetId = id; target.crop = { zoom: 1, x: 0.5, y: 0.5 }; S.sel = [target.id]; commit(); target = null; }
        else addImageAsset(id, at);
      } catch (e) { alert('Image illisible : ' + f.name); }
    }
  }
  // Cadre photo : image de substitution à remplacer (glisser une image dessus ou « Remplacer »).
  function placeholderAsset() {
    if (S.design.assets.placeholder) return 'placeholder';
    const c = document.createElement('canvas');
    c.width = c.height = 600;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 600, 600);
    g.addColorStop(0, '#e5e7eb');
    g.addColorStop(1, '#cbd5e1');
    x.fillStyle = g;
    x.fillRect(0, 0, 600, 600);
    x.fillStyle = '#94a3b8';
    x.beginPath(); x.arc(390, 220, 50, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(120, 450); x.lineTo(260, 270); x.lineTo(360, 390); x.lineTo(420, 330); x.lineTo(500, 450); x.closePath(); x.fill();
    S.design.assets.placeholder = { src: c.toDataURL('image/png'), name: 'Cadre', w: 600, h: 600 };
    return 'placeholder';
  }

  /* Détourage hors ligne : retire un fond uni par remplissage depuis les bords (tolérance réglable). */
  async function removeBackground(el, tol) {
    const a = S.design.assets[el.assetId];
    if (!a) return;
    const img = await loadImg(a.src);
    const w = img.naturalWidth, hh = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = w; c.height = hh;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const im = x.getImageData(0, 0, w, hh);
    const d = im.data;
    const px = (i) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
    const corners = [0, w - 1, (hh - 1) * w, hh * w - 1].map(px);
    const ref = [0, 1, 2].map((j) => corners.reduce((s2, cc) => s2 + cc[j], 0) / 4);
    const dist = (i) => Math.hypot(d[i * 4] - ref[0], d[i * 4 + 1] - ref[1], d[i * 4 + 2] - ref[2]);
    const seen = new Uint8Array(w * hh);
    const queue = new Int32Array(w * hh);
    let qh = 0, qt = 0;
    const push = (i) => { if (!seen[i] && d[i * 4 + 3] > 0 && dist(i) <= tol * 1.6) { seen[i] = 1; queue[qt++] = i; } };
    for (let i = 0; i < w; i++) { push(i); push((hh - 1) * w + i); }
    for (let j = 0; j < hh; j++) { push(j * w); push(j * w + w - 1); }
    while (qh < qt) {
      const i = queue[qh++];
      const dd = dist(i);
      // Bord adouci : opacité progressive entre tol et 1,6 × tol.
      d[i * 4 + 3] = dd <= tol ? 0 : Math.round(d[i * 4 + 3] * Math.min(1, (dd - tol) / (tol * 0.6)));
      if (dd > tol) continue;
      const cx = i % w;
      if (cx > 0) push(i - 1);
      if (cx < w - 1) push(i + 1);
      if (i >= w) push(i - w);
      if (i < w * (hh - 1)) push(i + w);
    }
    x.putImageData(im, 0, 0);
    const id = G.uid();
    S.design.assets[id] = { src: c.toDataURL('image/png'), name: (a.name || 'image') + ' (détourée)', w, h: hh };
    el.originalAssetId = el.originalAssetId || el.assetId;
    el.assetId = id;
    commit();
  }

  /* Harmonies : recolore tout le design en associant les couleurs par luminosité. */
  const THEMES = [
    ['Coucher de soleil', ['#1e1b4b', '#7c3aed', '#f97316', '#fbbf24', '#fff7ed']],
    ['Océan', ['#082f49', '#0369a1', '#06b6d4', '#a5f3fc', '#f0f9ff']],
    ['Forêt', ['#052e16', '#166534', '#65a30d', '#d9f99d', '#f7fee7']],
    ['Terre d’Afrique', ['#3b1d0f', '#9a3412', '#d97706', '#fcd34d', '#fefce8']],
    ['Kente', ['#111827', '#15803d', '#dc2626', '#facc15', '#fffbeb']],
    ['Pastel', ['#4c1d95', '#f472b6', '#a5b4fc', '#bbf7d0', '#fdf2f8']],
    ['Minimal', ['#0a0a0a', '#404040', '#a3a3a3', '#e5e5e5', '#ffffff']],
    ['Royal', ['#172554', '#1d4ed8', '#c2410c', '#fcd34d', '#fefce8']],
  ];
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };
  function recolor(pal) {
    const used = docColors().sort((a, b) => lum(a) - lum(b));
    if (!used.length) return;
    const p = [...pal].sort((a, b) => lum(a) - lum(b));
    const map = {};
    used.forEach((c, i) => { map[c] = p[used.length === 1 ? p.length - 1 : Math.round((i * (p.length - 1)) / (used.length - 1))]; });
    const sw = (v) => (typeof v === 'string' && map[v.toLowerCase()]) || v;
    for (const pg of S.design.pages) {
      pg.background.color = sw(pg.background.color);
      if (pg.background.color2) pg.background.color2 = sw(pg.background.color2);
      for (const e of pg.elements) for (const key of ['color', 'fill', 'fill2', 'stroke', 'bgColor']) if (e[key]) e[key] = sw(e[key]);
    }
    commit();
  }

  /* ---------- polices ---------- */
  function loadWebFonts() {
    for (const f of G.WEB_FONTS) {
      const id = 'wf-' + f.replace(/ /g, '-');
      if (document.getElementById(id)) continue;
      const fam = f.replace(/ /g, '+') + (WEB_BOLD.includes(f) ? ':wght@400;700' : '');
      document.head.append(h('link', { id, rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?family=${fam}&display=swap` }));
    }
  }
  async function loadDesignFonts(d) {
    for (const f of d.fonts || []) {
      try {
        const ff = new FontFace(f.family, `url(${f.src})`);
        await ff.load();
        document.fonts.add(ff);
      } catch (e) { /* police illisible */ }
    }
  }
  async function importFont(file) {
    try {
      const src = await readAsDataUrl(file);
      const family = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
      const ff = new FontFace(family, `url(${src})`);
      await ff.load();
      document.fonts.add(ff);
      S.design.fonts = (S.design.fonts || []).filter((x) => x.family !== family).concat([{ family, src }]);
      commit();
      toast(`Police « ${family} » importée.`);
    } catch (e) {
      alert('Police illisible. Formats acceptés : TTF, OTF, WOFF, WOFF2.');
    }
  }
  function fontSelect(value, onChange) {
    const groups = [['Polices importées', (S.design.fonts || []).map((f) => f.family)], ['Polices web (internet requis)', G.WEB_FONTS], ['Polices de l’ordinateur', G.FONTS]];
    const known = groups.some(([, l]) => l.includes(value));
    return h('select', { class: 'font-select', title: 'Police', onchange: (e) => onChange(e.target.value) },
      !known && h('option', { value, selected: true }, value),
      groups.filter(([, l]) => l.length).map(([label, list]) => h('optgroup', { label },
        list.map((f) => h('option', { value: f, style: `font-family:"${f}"`, selected: f === value }, f)))));
  }

  /* ---------- petits composants d'interface ---------- */
  function toast(msg) {
    const t = h('div', { class: 'toast' }, msg);
    document.body.append(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
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
  function closePop() {
    if (!S.pop) return;
    S.pop.remove();
    S.pop = null;
    document.removeEventListener('pointerdown', popOutside, true);
  }
  function popOutside(e) { if (S.pop && !S.pop.contains(e.target) && !e.target.closest('.color-btn')) closePop(); }
  function showPop(pop, anchor) {
    closePop();
    document.body.append(pop);
    const r = anchor.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8));
    let top = r.bottom + 6;
    if (top + pop.offsetHeight > innerHeight - 8) top = Math.max(8, r.top - pop.offsetHeight - 6);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    S.pop = pop;
    document.addEventListener('pointerdown', popOutside, true);
  }
  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v);
  function docColors() {
    const set = new Set();
    const add = (v) => { if (typeof v === 'string' && isHex(v)) set.add(v.toLowerCase()); };
    for (const p of S.design.pages) {
      add(p.background.color); add(p.background.color2);
      for (const e of p.elements) ['color', 'fill', 'fill2', 'stroke', 'bgColor', 'fg'].forEach((key) => add(e[key]));
    }
    return [...set].slice(0, 24);
  }
  /* Sélecteur de couleur : couleurs du document, de la marque, palette et couleur libre. */
  function colorInput(value, onLive) {
    const btn = h('button', { class: 'color-btn', title: 'Couleur', style: `background:${value}` });
    btn.addEventListener('mousedown', (e) => e.preventDefault()); // ne pas quitter l'édition de texte
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (S.pop && S.pop.anchor === btn) { closePop(); return; }
      let cur = value;
      const pick = (v, final) => { cur = v; onLive(v); btn.style.background = v; if (final) commit(); };
      const native = h('input', { type: 'color', value: isHex(cur) ? cur : '#ffffff' });
      native.addEventListener('input', () => pick(native.value, false));
      native.addEventListener('change', () => pick(native.value, true));
      const hex = h('input', { class: 'hex', value: isHex(cur) ? cur : '', placeholder: '#rrggbb', onchange: (ev) => {
        let v = ev.target.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        if (/^#[0-9a-f]{3}$/i.test(v)) v = '#' + [...v.slice(1)].map((c) => c + c).join('');
        if (isHex(v)) pick(v.toLowerCase(), true);
      } });
      const row = (title, colors) => colors.length ? [h('div', { class: 'pop-title' }, title),
        h('div', { class: 'pop-swatches' }, colors.map((c) => h('button', { class: 'sw', style: `background:${c}`, title: c, onmousedown: (ev) => ev.preventDefault(), onclick: () => pick(c, true) })))] : [];
      const pop = h('div', { class: 'popover color-pop' },
        h('div', { class: 'pop-row' }, native, hex),
        row('Couleurs du document', docColors()), row('Ma marque', G.brand.colors), row('Palette', G.PALETTE));
      pop.anchor = btn;
      showPop(pop, btn);
    });
    return btn;
  }
  function numInput(value, min, max, step, onLive, width = 56) {
    const i = h('input', { type: 'number', value: Math.round(value * 100) / 100, min, max, step, style: `width:${width}px` });
    i.addEventListener('input', () => { const v = parseFloat(i.value); if (!isNaN(v)) onLive(Math.max(min, Math.min(max, v))); });
    i.addEventListener('change', commit);
    return i;
  }
  function rangeInput(value, min, max, step, onLive) {
    const i = h('input', { type: 'range', min, max, step, value });
    const out = h('span', { class: 'range-val' }, String(Math.round(value * 10) / 10));
    i.addEventListener('input', () => { out.textContent = i.value; onLive(parseFloat(i.value)); });
    i.addEventListener('change', commit);
    return h('div', { class: 'range-row' }, i, out);
  }
  const field = (label, ...ctl) => h('label', { class: 'field' }, h('span', {}, label), ...ctl);
  const toggle = (label, title, on, fn) => h('button', { class: 'tool' + (on ? ' on' : ''), title, onmousedown: (e) => e.preventDefault(), onclick: fn }, label);
  const sep = () => h('div', { class: 'sep' });
  const selectInput = (value, opts, fn, title) => h('select', { title, onchange: (e) => fn(e.target.value) },
    opts.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l)));

  function promptModal(title, value, cb, opts = {}) {
    const input = opts.multiline ? h('textarea', { rows: 10 }) : h('input', { type: 'text' });
    input.value = value;
    const close = () => m.remove();
    const ok = () => { close(); cb(input.value); };
    const m = h('div', { class: 'modal' }, h('div', { class: 'modal-card wide' },
      h('h3', {}, title), opts.help && h('p', { class: 'muted small' }, opts.help), input,
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn', onclick: close }, 'Annuler'),
        h('button', { class: 'btn primary', onclick: ok }, 'Valider'))));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (!opts.multiline || e.ctrlKey)) { e.preventDefault(); ok(); }
      if (e.key === 'Escape') close();
    });
    document.body.append(m);
    input.focus();
    input.select();
  }
  /* Boîte à outils fournie aux types d'éléments des modules (voir docs/EXTENSIONS.md). */
  const ui = {
    h, field,
    color: (v, fn) => colorInput(v, fn),
    number: (v, min, max, step, fn, w) => numInput(v, min, max, step, fn, w),
    text: (v, fn, w = 140) => { const i = h('input', { type: 'text', value: v, style: `width:${w}px` }); i.addEventListener('input', () => fn(i.value)); i.addEventListener('change', commit); return i; },
    select: (v, opts, fn) => selectInput(v, opts, fn),
    toggle: (l, t, on, fn) => toggle(l, t, on, fn),
    button: (l, t, fn) => h('button', { class: 'tool', title: t, onclick: fn }, l),
    live: (fn) => applyLive(fn),
    commit: () => commit(),
    prompt: promptModal,
  };
  const api = {
    h, add: (el) => addElement(el), W, H, k,
    get design() { return S.design; },
    applyPage: (p) => { page().background = p.background; page().elements = p.elements; S.sel = []; commit(); },
    rebuild: () => buildPanel(),
  };

  /* ---------- barre contextuelle ---------- */
  function openContext(tab) {
    if (!CONTEXT_TABS.includes(S.tab)) S.lastTab = S.tab;
    S.tab = tab;
    buildPanel();
  }
  function buildCtx() {
    const bar = $('#ctxbar');
    if (!bar) return;
    bar.innerHTML = '';
    if (S.drawing) {
      const kinds = [['pen', '🖊 Stylo'], ['marker', '🖍 Marqueur'], ['highlighter', '🖌 Surligneur']];
      bar.append(h('strong', { class: 'ctx-title' }, 'Dessin à main levée'),
        ...kinds.map(([kd, l]) => toggle(l, l, S.pen.kind === kd, () => {
          S.pen.kind = kd;
          S.pen.width = kd === 'pen' ? 6 : kd === 'marker' ? 16 : 30;
          if (kd === 'highlighter') S.pen.color = '#facc15';
          buildCtx();
        })),
        field('Couleur', colorInput(S.pen.color, (v) => (S.pen.color = v))),
        field('Épaisseur', numInput(S.pen.width, 1, 200, 1, (v) => (S.pen.width = v))),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: stopDrawing }, 'Terminer'));
      return;
    }
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
      bar.append(h('div', { class: 'spacer' }), h('span', { class: 'muted' }, `${W()} × ${H()} px`),
        h('button', { class: 'tool wide', onclick: openResize }, '⤢ Redimensionner'));
      return;
    }
    const el = sel[0];
    const single = sel.length === 1;
    const effectsBtn = () => h('button', { class: 'tool wide' + (S.tab === 'effects' ? ' on' : ''), onmousedown: (e) => e.preventDefault(), onclick: () => openContext('effects') }, '✨ Effets');
    if (single && el.type === 'text') {
      const step = (d) => () => { applyLive((x) => (x.fontSize = Math.max(4, Math.round(x.fontSize + d)))); commit(); };
      bar.append(fontSelect(el.fontFamily, (v) => { applyLive((x) => (x.fontFamily = v)); commit(); }),
        h('div', { class: 'stepper' }, h('button', { class: 'tool', title: 'Réduire', onmousedown: (e) => e.preventDefault(), onclick: step(-2) }, '−'),
          numInput(el.fontSize, 4, 800, 1, (v) => applyLive((x) => (x.fontSize = v))),
          h('button', { class: 'tool', title: 'Agrandir', onmousedown: (e) => e.preventDefault(), onclick: step(2) }, '+')),
        h('span', { class: 'color-wrap', title: 'Couleur du texte' }, h('span', { class: 'swatch-a' }, 'A'), colorInput(el.color, (v) => applyLive((x) => (x.color = v)))),
        toggle(h('b', {}, 'G'), 'Gras (Ctrl+B)', el.bold, () => { applyLive((x) => (x.bold = !x.bold)); commit(); }),
        toggle(h('i', {}, 'I'), 'Italique (Ctrl+I)', el.italic, () => { applyLive((x) => (x.italic = !x.italic)); commit(); }),
        toggle(h('u', {}, 'S'), 'Souligné (Ctrl+U)', el.underline, () => { applyLive((x) => (x.underline = !x.underline)); commit(); }),
        toggle('aA', 'Majuscules', el.uppercase, () => { applyLive((x) => (x.uppercase = !x.uppercase)); commit(); }),
        selectInput(el.align, [['left', '⯇ Gauche'], ['center', '≡ Centre'], ['right', 'Droite ⯈'], ['justify', '☰ Justifié']], (v) => { applyLive((x) => (x.align = v)); commit(); }, 'Alignement'),
        toggle('•', 'Liste à puces', el.list === 'bullet', () => { applyLive((x) => (x.list = x.list === 'bullet' ? null : 'bullet')); commit(); }),
        toggle('1.', 'Liste numérotée', el.list === 'number', () => { applyLive((x) => (x.list = x.list === 'number' ? null : 'number')); commit(); }),
        field('Interligne', numInput(el.lineHeight, 0.5, 3, 0.05, (v) => applyLive((x) => (x.lineHeight = v)), 52)),
        field('Espacement', numInput(el.letterSpacing || 0, -20, 100, 0.5, (v) => applyLive((x) => (x.letterSpacing = v)), 52)),
        effectsBtn(), sep());
    } else if (single && el.type === 'shape') {
      if (el.shape !== 'line') {
        const none = el.fill === 'transparent';
        bar.append(field('Remplissage', colorInput(none ? '#ffffff' : el.fill, (v) => applyLive((x) => (x.fill = v)))),
          toggle('∅', 'Sans remplissage', none, () => { applyLive((x) => (x.fill = none ? '#8b5cf6' : 'transparent')); commit(); }));
      }
      bar.append(field(el.shape === 'line' ? 'Couleur' : 'Contour', colorInput(el.stroke, (v) => applyLive((x) => (x.stroke = v)))),
        field('Épaisseur', numInput(el.strokeWidth, 0, 200, 1, (v) => applyLive((x) => (x.strokeWidth = v)))));
      if (el.shape === 'rect' || el.shape === 'roundrect') bar.append(field('Arrondi', numInput(el.radius || 0, 0, 2000, 1, (v) => applyLive((x) => (x.radius = v)))));
      if (el.shape === 'line') {
        const caps = [['none', 'Aucune'], ['arrow', 'Flèche'], ['circle', 'Rond'], ['bar', 'Barre']];
        bar.append(selectInput(el.dash || 'solid', [['solid', '━ Continu'], ['dashed', '╍ Tirets'], ['dotted', '┈ Pointillé']], (v) => { applyLive((x) => (x.dash = v)); commit(); }, 'Style de trait'),
          field('Début', selectInput(el.startCap || 'none', caps, (v) => { applyLive((x) => (x.startCap = v)); commit(); })),
          field('Fin', selectInput(el.endCap || 'none', caps, (v) => { applyLive((x) => (x.endCap = v)); commit(); })));
      }
      bar.append(effectsBtn(), sep());
    } else if (single && el.type === 'image') {
      bar.append(h('button', { class: 'tool wide' + (S.tab === 'adjust' ? ' on' : ''), onclick: () => openContext('adjust') }, '🎚 Modifier la photo'),
        h('button', { class: 'tool wide', title: 'Remplacer l’image en gardant le cadre', onclick: () => { S.replaceTarget = el.id; $('#file-image').click(); } }, '⟳ Remplacer'),
        field('Forme', selectInput(el.mask || 'none', G.MASKS.map((m) => [m, MASK_NAMES[m]]), (v) => { applyLive((x) => (x.mask = v)); commit(); })),
        (!el.mask || el.mask === 'none') ? field('Arrondi', numInput(el.radius || 0, 0, 5000, 1, (v) => applyLive((x) => (x.radius = v)))) : '',
        toggle('⇋', 'Retourner horizontalement', el.flipX, () => { applyLive((x) => (x.flipX = !x.flipX)); commit(); }),
        toggle('⇅', 'Retourner verticalement', el.flipY, () => { applyLive((x) => (x.flipY = !x.flipY)); commit(); }),
        effectsBtn(), sep());
    } else if (single && G.TYPES[el.type]) {
      const t = G.TYPES[el.type];
      if (t.controls) { try { bar.append(...t.controls(el, ui)); } catch (e) { console.error(e); } }
      bar.append(effectsBtn(), sep());
    } else if (!single) {
      const grouped = el.groupId && sel.every((e) => e.groupId === el.groupId);
      bar.append(h('strong', { class: 'ctx-title' }, grouped ? `Groupe (${sel.length})` : `${sel.length} éléments`),
        grouped ? h('button', { class: 'tool wide', onclick: ungroup, title: 'Ctrl+Maj+G' }, 'Dissocier')
          : h('button', { class: 'tool wide', onclick: group, title: 'Ctrl+G' }, '⧠ Grouper'),
        effectsBtn(), sep());
    }
    const op = h('input', { type: 'range', min: 0, max: 100, value: Math.round(el.opacity * 100), style: 'width:70px' });
    op.addEventListener('input', () => applyLive((x) => (x.opacity = op.value / 100)));
    op.addEventListener('change', commit);
    bar.append(field('Opacité', op),
      h('button', { class: 'tool wide' + (S.tab === 'position' ? ' on' : ''), onmousedown: (e) => e.preventDefault(), onclick: () => openContext('position') }, '✥ Position'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'tool', title: 'Copier le style (Ctrl+Alt+C)', onclick: copyStyle }, '🖌'),
      S.styleClip ? h('button', { class: 'tool', title: 'Coller le style (Ctrl+Alt+V)', onclick: pasteStyle }, '🎨') : '',
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
    const title = (t, sub) => [h('h3', {}, t), sub ? h('p', { class: 'muted small' }, sub) : ''];
    const ext = G.PANELS.find((p) => p.id === S.tab);
    if (ext) {
      panel.append(...title(ext.label));
      try { ext.build(panel, api); } catch (e) { console.error(e); panel.append(h('p', {}, 'Module indisponible.')); }
    } else if (CONTEXT_TABS.includes(S.tab)) {
      buildContextPanel(panel, title);
    } else {
      (PANEL_BUILDERS[S.tab] || PANEL_BUILDERS.templates)(panel, title);
    }
    panel.scrollTop = scroll;
  }

  const PANEL_BUILDERS = {
    templates(panel, title) {
      panel.append(...title('Modèles', 'Cliquez pour appliquer un modèle à la page sélectionnée.'));
      const cats = ['Tous', ...new Set(G.TEMPLATES.map((t) => t.category).filter(Boolean))];
      panel.append(h('div', { class: 'chips' }, cats.map((c) => h('button', { class: 'chip' + (S.tplCat === c ? ' on' : ''), onclick: () => { S.tplCat = c; buildPanel(); } }, c))));
      const grid = h('div', { class: 'tpl-grid' });
      for (const t of G.TEMPLATES.filter((t) => S.tplCat === 'Tous' || t.category === S.tplCat)) {
        const tmp = { width: t.w, height: t.h, assets: {} };
        const n = t.pages ? t.pages.length : 1;
        grid.append(h('button', { class: 'tpl-card', title: t.name, onclick: () => applyTemplate(t) },
          G.renderPreview(tmp, G.pageFromTemplate(t, t.w, t.h), 116, 116),
          h('span', {}, t.name + (n > 1 ? ` · ${n} p.` : ''))));
      }
      panel.append(grid);
    },

    text(panel, title) {
      panel.append(...title('Texte', 'Double-cliquez sur un texte pour le modifier.'));
      const add = (o) => addElement(G.makeText(Object.assign({ w: W() * 0.7 }, o)));
      const hf = G.brand.heading || 'Arial', bf = G.brand.body || 'Arial';
      panel.append(
        h('button', { class: 'text-preset t1', style: `font-family:"${hf}"`, onclick: () => add({ text: 'Ajouter un titre', fontFamily: hf, fontSize: Math.round(84 * k()), bold: true, align: 'center' }) }, 'Ajouter un titre'),
        h('button', { class: 'text-preset t2', style: `font-family:"${hf}"`, onclick: () => add({ text: 'Ajouter un sous-titre', fontFamily: hf, fontSize: Math.round(52 * k()), bold: true, align: 'center' }) }, 'Ajouter un sous-titre'),
        h('button', { class: 'text-preset t3', style: `font-family:"${bf}"`, onclick: () => add({ text: 'Ajouter un peu de texte', fontFamily: bf, fontSize: Math.round(32 * k()), align: 'center' }) }, 'Ajouter un peu de texte'),
        h('button', { class: 'text-preset t3', onclick: () => add({ text: 'Premier point\nDeuxième point\nTroisième point', fontFamily: bf, fontSize: Math.round(32 * k()), list: 'bullet', lineHeight: 1.5 }) }, '•  Liste à puces'),
        h('h4', {}, 'Combinaisons'));
      const combos = [
        { label: 'Titre + sous-titre', make: () => [
          G.makeText({ text: 'GRAND TITRE', fontFamily: 'Arial Black', fontSize: 96, color: '#111827', align: 'center', w: 900 }),
          G.makeText({ text: 'Une phrase d’accroche courte', fontFamily: 'Georgia', fontSize: 40, italic: true, color: '#6b7280', align: 'center', w: 900, y: 130 })] },
        { label: 'Étiquette promo', make: () => [
          G.makeShape('roundrect', { w: 520, h: 120, radius: 60, fill: '#ef4444' }),
          G.makeText({ text: '-30 % AUJOURD’HUI', fontFamily: 'Arial', bold: true, fontSize: 46, color: '#ffffff', align: 'center', w: 520, y: 33 })] },
        { label: 'Citation', make: () => [
          G.makeText({ text: '« La créativité, c’est l’intelligence qui s’amuse. »', fontFamily: 'Georgia', italic: true, fontSize: 48, color: '#1f2937', align: 'center', w: 800, lineHeight: 1.3 }),
          G.makeText({ text: '— ALBERT EINSTEIN', fontSize: 26, letterSpacing: 4, color: '#9a3412', align: 'center', w: 800, y: 200 })] },
        { label: 'Texte néon', make: () => [
          G.makeText({ text: 'OPEN', fontFamily: 'Arial Black', fontSize: 140, color: '#ffffff', align: 'center', w: 600, shadow: { x: 0, y: 0, blur: 30, color: '#ec4899' }, outline: { width: 4, color: '#ec4899' } })] },
        { label: 'Texte en arc', make: () => [
          G.makeText({ text: 'TEXTE EN ARC • GBAKI •', fontFamily: 'Arial', bold: true, fontSize: 56, color: '#7c3aed', align: 'center', w: 700, curve: 55, letterSpacing: 4 })] },
      ];
      for (const c of combos) {
        panel.append(h('button', { class: 'font-style combo', onclick: () => {
          const els = c.make();
          const s = k();
          const scaled = G.scaleElements(els, s, 0, 0);
          const b = bbox(scaled.map((e) => (e.type === 'text' ? Object.assign({}, e, { h: e.fontSize * 1.3 }) : e)));
          const dx = (W() - b.w) / 2 - b.x, dy = (H() - b.h) / 2 - b.y;
          const gid = scaled.length > 1 ? G.uid() : null;
          scaled.forEach((e) => { e.x += dx; e.y += dy; if (gid) e.groupId = gid; });
          page().elements.push(...scaled);
          S.sel = scaled.map((e) => e.id);
          commit();
        } }, c.label));
      }
      panel.append(h('h4', {}, 'Styles de police'));
      const styles = [
        { label: 'IMPACT', text: 'GRAND TITRE', fontFamily: 'Impact', fontSize: 110, color: '#111827', letterSpacing: 2 },
        { label: 'Élégant', text: 'Élégance', fontFamily: 'Georgia', fontSize: 90, italic: true, color: '#7c2d12' },
        { label: 'Manuscrit', text: 'Avec amour', fontFamily: 'Brush Script MT', fontSize: 110, color: '#be185d' },
        { label: 'Moderne', text: 'Moderne', fontFamily: 'Poppins', fontSize: 96, bold: true, color: '#0f172a' },
        { label: 'Affiche', text: 'AFFICHE', fontFamily: 'Bebas Neue', fontSize: 140, color: '#dc2626', letterSpacing: 4 },
        { label: 'Calligraphie', text: 'Bienvenue', fontFamily: 'Great Vibes', fontSize: 120, color: '#a16207' },
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
      const fontFile = h('input', { type: 'file', accept: '.ttf,.otf,.woff,.woff2', hidden: true, onchange: (e) => { if (e.target.files[0]) importFont(e.target.files[0]); e.target.value = ''; } });
      panel.append(h('h4', {}, 'Mes polices'), fontFile,
        h('button', { class: 'btn block', onclick: () => fontFile.click() }, '⤒ Importer une police (TTF, OTF, WOFF)'),
        ...(S.design.fonts || []).map((f) => h('div', { class: 'font-row', style: `font-family:"${f.family}"` }, f.family)));
    },

    elements(panel, title) {
      panel.append(...title('Formes', 'Cliquez pour ajouter, puis personnalisez couleurs et contours.'));
      const grid = h('div', { class: 'shape-grid' });
      for (const shape of G.SHAPES.filter((s) => s !== 'line')) {
        const demo = G.makeShape(shape, { w: 56, h: shape === 'arrow' || shape === 'doublearrow' ? 38 : 56, fill: '#8b5cf6', radius: shape === 'roundrect' ? 12 : 0 });
        const prev = G.renderElement(Object.assign(demo, { x: 0, y: 0 }), S.design);
        prev.style.position = 'relative';
        grid.append(h('button', { class: 'shape-btn', title: SHAPE_NAMES[shape], onclick: () => {
          const size = Math.min(W(), H()) * 0.3;
          const o = { w: size, h: size, radius: shape === 'roundrect' ? size * 0.15 : 0 };
          if (shape === 'arrow' || shape === 'doublearrow') o.h = size * 0.6;
          if (shape === 'parallelogram' || shape === 'trapezoid' || shape === 'bubble') o.w = size * 1.4;
          addElement(G.makeShape(shape, o));
        } }, prev));
      }
      panel.append(grid, h('h4', {}, 'Lignes et flèches'));
      const lines = [
        ['Ligne', {}], ['Tirets', { dash: 'dashed' }], ['Pointillés', { dash: 'dotted' }],
        ['Ligne fléchée', { endCap: 'arrow' }], ['Ligne double flèche', { startCap: 'arrow', endCap: 'arrow' }], ['Connecteur', { startCap: 'circle', endCap: 'circle' }],
      ];
      const lg = h('div', { class: 'shape-grid' });
      for (const [label, o] of lines) {
        const demo = G.makeShape('line', Object.assign({ x: 0, y: 0, w: 60, h: 20, strokeWidth: 3, stroke: '#374151' }, o));
        const prev = G.renderElement(demo, S.design);
        prev.style.position = 'relative';
        lg.append(h('button', { class: 'shape-btn', title: label, onclick: () => addElement(G.makeShape('line', Object.assign({ w: W() * 0.4, h: 20 * k() + 10, strokeWidth: Math.max(2, 8 * k()) }, o))) }, prev));
      }
      panel.append(lg, h('h4', {}, 'Cadres photo'));
      const fg = h('div', { class: 'shape-grid' });
      for (const m of G.MASKS) {
        const demo = G.makeImage(placeholderAsset(), { x: 0, y: 0, w: 56, h: 56, mask: m, radius: m === 'none' ? 0 : 0 });
        const prev = G.renderElement(demo, S.design);
        prev.style.position = 'relative';
        fg.append(h('button', { class: 'shape-btn', title: 'Cadre ' + MASK_NAMES[m].toLowerCase(), onclick: () => {
          const size = Math.min(W(), H()) * 0.4;
          addElement(G.makeImage(placeholderAsset(), { w: size, h: size, mask: m }));
          toast('Glissez une image sur le cadre, ou cliquez sur « Remplacer ».');
        } }, prev));
      }
      panel.append(fg, h('h4', {}, 'Dessin'),
        h('button', { class: 'btn block' + (S.drawing ? ' primary' : ''), onclick: () => (S.drawing ? stopDrawing() : startDrawing()) }, S.drawing ? 'Terminer le dessin' : '✏️ Dessiner à main levée'));
      for (const sec of G.ELEMENT_SECTIONS) {
        const box = h('div', { class: 'ext-section' });
        panel.append(h('h4', {}, sec.title), box);
        try { sec.build(box, api); } catch (e) { console.error(e); }
      }
    },

    uploads(panel, title) {
      panel.append(...title('Importer', 'Images PNG, JPG, SVG, WebP… Vous pouvez aussi les glisser sur la page ou les coller (Ctrl+V).'));
      panel.append(h('button', { class: 'btn primary block', onclick: () => { S.replaceTarget = null; $('#file-image').click(); } }, 'Importer des images'));
      const ids = Object.keys(S.design.assets).filter((id) => id !== 'placeholder');
      if (ids.length) {
        panel.append(h('h4', {}, 'Images de ce design'));
        const grid = h('div', { class: 'asset-grid' });
        for (const id of ids) {
          grid.append(h('button', { class: 'asset', title: S.design.assets[id].name, onclick: () => addImageAsset(id) },
            h('img', { src: S.design.assets[id].src, draggable: false })));
        }
        panel.append(grid);
      }
    },

    background(panel, title) {
      panel.append(...title('Fond', 'S’applique à la page sélectionnée.'));
      const bg = page().background;
      const grid = h('div', { class: 'swatches' });
      for (const c of [...G.brand.colors, ...G.PALETTE]) {
        grid.append(h('button', { class: 'sw', style: `background:${c}`, title: c, onclick: () => { page().background = { type: 'solid', color: c }; commit(); } }));
      }
      panel.append(grid, field('Couleur personnalisée', colorInput(bg.color, (v) => { page().background = { type: 'solid', color: v }; refreshBg(); })), h('h4', {}, 'Dégradés'));
      const g2 = h('div', { class: 'swatches big' });
      for (const [a, b] of GRADIENTS) {
        g2.append(h('button', { class: 'sw', style: `background:linear-gradient(135deg, ${a}, ${b})`, onclick: () => { page().background = { type: 'gradient', color: a, color2: b, angle: 135 }; commit(); } }));
      }
      panel.append(g2, h('h4', {}, 'Harmonies de couleurs'), h('p', { class: 'muted small' }, 'Recolore tout le design en un clic (annulable avec Ctrl+Z).'));
      const th = h('div', { class: 'themes' });
      for (const [name, pal] of THEMES) {
        th.append(h('button', { class: 'theme', title: name, onclick: () => recolor(pal) },
          h('div', { class: 'theme-bar' }, pal.map((c) => h('span', { style: `background:${c}` }))), h('span', {}, name)));
      }
      panel.append(th);
      panel.append(
        h('p', { class: 'muted small' }, 'Astuce : pour une photo en fond, sélectionnez une image puis « Modifier la photo » → « Définir comme arrière-plan ».'),
        h('button', { class: 'btn block', onclick: () => { S.design.pages.forEach((p) => (p.background = G.clone(page().background))); commit(); } }, 'Appliquer à toutes les pages'));
    },

    brand(panel, title) {
      panel.append(...title('Ma marque', 'Vos couleurs et polices, disponibles dans tous vos designs sur ce navigateur.'));
      panel.append(h('h4', {}, 'Couleurs'));
      const sw = h('div', { class: 'swatches' });
      G.brand.colors.forEach((c, i) => sw.append(h('div', { class: 'sw brand-sw', style: `background:${c}`, title: c },
        h('button', { class: 'sw-del', title: 'Retirer', onclick: () => { G.brand.colors.splice(i, 1); saveBrand(); buildPanel(); } }, '×'))));
      const pickNew = h('input', { type: 'color', value: '#f97316' });
      panel.append(sw, h('div', { class: 'row' }, pickNew,
        h('button', { class: 'btn', onclick: () => { if (!G.brand.colors.includes(pickNew.value)) G.brand.colors.push(pickNew.value); saveBrand(); buildPanel(); } }, 'Ajouter la couleur')),
      h('button', { class: 'btn block', onclick: () => { for (const c of docColors()) if (!G.brand.colors.includes(c)) G.brand.colors.push(c); G.brand.colors = G.brand.colors.slice(0, 30); saveBrand(); buildPanel(); } }, 'Ajouter les couleurs de ce design'));
      panel.append(h('h4', {}, 'Polices'),
        field('Titres', fontSelect(G.brand.heading || 'Arial', (v) => { G.brand.heading = v; saveBrand(); })),
        field('Texte', fontSelect(G.brand.body || 'Arial', (v) => { G.brand.body = v; saveBrand(); })),
        h('button', { class: 'btn block', onclick: () => {
          // Applique les polices de la marque à tout le design (gros textes = titres).
          for (const p of S.design.pages) for (const e of p.elements) if (e.type === 'text') e.fontFamily = e.fontSize >= 48 * k() ? (G.brand.heading || e.fontFamily) : (G.brand.body || e.fontFamily);
          commit();
        } }, 'Appliquer mes polices à ce design'));
    },

    layers(panel, title) {
      panel.append(...title('Calques', 'Du premier plan à l’arrière-plan.'));
      const list = h('div', { class: 'layers' });
      const els = [...page().elements].reverse();
      if (!els.length) list.append(h('p', { class: 'muted small' }, 'Cette page est vide.'));
      for (const el of els) {
        const label = el.type === 'text' ? el.text.split('\n')[0].slice(0, 26) || '(texte vide)'
          : el.type === 'image' ? (el.assetId === 'placeholder' ? 'Cadre photo' : 'Image')
            : el.type === 'shape' ? SHAPE_NAMES[el.shape] : (G.TYPES[el.type] && G.TYPES[el.type].label) || el.type;
        const kind = el.type === 'text' ? 'T' : el.type === 'image' ? '▣' : el.type === 'shape' ? '◆' : '✦';
        const move = (d) => (e) => {
          e.stopPropagation();
          const l = page().elements, i = l.indexOf(el), j = i + d;
          if (j < 0 || j >= l.length) return;
          [l[i], l[j]] = [l[j], l[i]];
          commit();
        };
        list.append(h('div', { class: 'layer' + (S.sel.includes(el.id) ? ' on' : '') + (el.groupId ? ' grouped' : ''), onclick: (e) => {
          S.sel = e.shiftKey ? [...new Set([...S.sel, el.id])] : withGroups([el.id]);
          selectionChanged();
        } },
        h('span', { class: 'kind' }, kind), h('span', { class: 'lname' }, label),
        h('button', { class: 'mini', title: 'Monter', onclick: move(1) }, '↑'),
        h('button', { class: 'mini', title: 'Descendre', onclick: move(-1) }, '↓'),
        h('button', { class: 'mini', title: el.hidden ? 'Afficher' : 'Masquer', onclick: (e) => { e.stopPropagation(); el.hidden = !el.hidden; commit(); } }, el.hidden ? '◌' : '👁'),
        h('button', { class: 'mini', title: el.locked ? 'Déverrouiller' : 'Verrouiller', onclick: (e) => { e.stopPropagation(); el.locked = !el.locked; commit(); } }, el.locked ? '🔒' : '🔓')));
      }
      panel.append(list);
    },
  };

  /* Panneaux contextuels : Effets, Modifier la photo, Position. */
  function buildContextPanel(panel, title) {
    const back = h('button', { class: 'back', onclick: () => { S.tab = S.lastTab; buildPanel(); } }, '‹ Retour');
    panel.append(back);
    const sel = selected();
    const el = sel[0];
    if (!el) { panel.append(...title(S.tab === 'position' ? 'Position' : S.tab === 'adjust' ? 'Modifier la photo' : 'Effets', 'Sélectionnez un élément sur la page.')); return; }
    const set = (fn) => { applyLive(fn); commit(); };
    const shadowFields = (key = 'shadow') => {
      const s = el[key];
      if (!s) return [];
      return [field('Couleur', colorInput(/^#/.test(s.color) ? s.color : '#000000', (v) => applyLive((x) => x[key] && (x[key].color = v)))),
        field('Décalage X', rangeInput(s.x || 0, -100, 100, 1, (v) => applyLive((x) => x[key] && (x[key].x = v)))),
        field('Décalage Y', rangeInput(s.y || 0, -100, 100, 1, (v) => applyLive((x) => x[key] && (x[key].y = v)))),
        field('Flou', rangeInput(s.blur || 0, 0, 120, 1, (v) => applyLive((x) => x[key] && (x[key].blur = v))))];
    };

    if (S.tab === 'effects') {
      panel.append(...title('Effets'));
      if (el.type === 'text') {
        const fs = el.fontSize;
        const base = (x) => { x.shadow = null; x.outline = null; x.bgColor = null; if (x.color === 'transparent') x.color = '#111827'; };
        const presets = [
          ['Aucun', (x) => base(x)],
          ['Ombre', (x) => { base(x); x.shadow = { x: fs * 0.05, y: fs * 0.05, blur: fs * 0.15, color: 'rgba(0,0,0,0.45)' }; }],
          ['Décalé', (x) => { base(x); x.shadow = { x: fs * 0.08, y: fs * 0.08, blur: 0, color: '#f97316' }; }],
          ['Contour', (x) => { base(x); x.outline = { width: Math.max(1, Math.round(fs * 0.08)), color: '#111827' }; }],
          ['Creux', (x) => { const c = x.color; base(x); x.outline = { width: Math.max(1, Math.round(fs * 0.04)), color: c === 'transparent' ? '#111827' : c }; x.color = 'transparent'; }],
          ['Néon', (x) => { base(x); x.shadow = { x: 0, y: 0, blur: fs * 0.35, color: x.color === '#ffffff' ? '#ec4899' : x.color }; }],
          ['Surligné', (x) => { base(x); x.bgColor = '#fde68a'; x.bgRadius = fs * 0.15; }],
        ];
        const grid = h('div', { class: 'fx-grid' });
        for (const [label, fn] of presets) {
          const demo = Object.assign(G.clone(el), { x: 0, y: 0, rotation: 0, text: 'Ag', fontSize: 34, w: 70, curve: 0, list: null, opacity: 1 });
          fn(demo);
          if (demo.shadow) demo.shadow = { ...demo.shadow, x: demo.shadow.x * 34 / fs, y: demo.shadow.y * 34 / fs, blur: demo.shadow.blur * 34 / fs };
          if (demo.outline) demo.outline = { ...demo.outline, width: Math.max(1, demo.outline.width * 34 / fs) };
          if (demo.color === '#ffffff' && !demo.bgColor) demo.color = '#111827';
          demo.align = 'center';
          const prev = G.renderElement(demo, S.design);
          prev.style.position = 'relative';
          grid.append(h('button', { class: 'fx', onclick: () => set(fn) }, h('div', { class: 'fx-prev' }, prev), h('span', {}, label)));
        }
        panel.append(grid);
        if (el.shadow) panel.append(h('h4', {}, 'Ombre'), ...shadowFields());
        if (el.outline) {
          panel.append(h('h4', {}, 'Contour'),
            field('Couleur', colorInput(el.outline.color, (v) => applyLive((x) => x.outline && (x.outline.color = v)))),
            field('Épaisseur', rangeInput(el.outline.width, 0.5, 40, 0.5, (v) => applyLive((x) => x.outline && (x.outline.width = v)))));
        }
        if (el.bgColor) {
          panel.append(h('h4', {}, 'Surlignage'),
            field('Couleur', colorInput(el.bgColor, (v) => applyLive((x) => (x.bgColor = v)))),
            field('Arrondi', rangeInput(el.bgRadius || 0, 0, 200, 1, (v) => applyLive((x) => (x.bgRadius = v)))),
            field('Marge', rangeInput(G.textPad(el), 0, 150, 1, (v) => applyLive((x) => (x.bgPad = v)))));
        }
        panel.append(h('h4', {}, 'Forme du texte'),
          h('div', { class: 'row' },
            h('button', { class: 'btn' + (!el.curve ? ' primary' : ''), onclick: () => set((x) => (x.curve = 0)) }, 'Droit'),
            h('button', { class: 'btn' + (el.curve ? ' primary' : ''), onclick: () => set((x) => (x.curve = x.curve || 50)) }, 'Courbe')));
        if (el.curve) panel.append(field('Courbure', rangeInput(el.curve, -100, 100, 1, (v) => applyLive((x) => (x.curve = v || 1)))));
        return;
      }
      // Formes, images, éléments des modules : ombre portée (+ dégradé, bordure).
      panel.append(h('div', { class: 'row' },
        h('button', { class: 'btn' + (el.shadow ? ' primary' : ''), onclick: () => set((x) => (x.shadow = x.shadow ? null : { x: 8 * k() + 2, y: 12 * k() + 3, blur: 30 * k() + 6, color: 'rgba(0,0,0,0.35)' })) }, el.shadow ? '✓ Ombre portée' : 'Ombre portée')));
      panel.append(...shadowFields());
      if (el.type === 'shape' && el.shape !== 'line') {
        panel.append(h('h4', {}, 'Remplissage dégradé'),
          h('button', { class: 'btn block' + (el.fill2 ? ' primary' : ''), onclick: () => set((x) => { x.fill2 = x.fill2 ? null : '#f97316'; if (x.fill === 'transparent') x.fill = '#8b5cf6'; }) }, el.fill2 ? '✓ Dégradé activé' : 'Activer le dégradé'));
        if (el.fill2) {
          panel.append(field('2ᵉ couleur', colorInput(el.fill2, (v) => applyLive((x) => (x.fill2 = v)))),
            field('Angle', rangeInput(el.fillAngle || 135, 0, 360, 5, (v) => applyLive((x) => (x.fillAngle = v)))));
        }
      }
      if (el.type === 'image') {
        panel.append(h('h4', {}, 'Bordure'),
          field('Épaisseur', rangeInput(el.border ? el.border.width : 0, 0, 80, 1, (v) => applyLive((x) => (x.border = { color: (x.border && x.border.color) || '#ffffff', width: v })))),
          field('Couleur', colorInput(el.border ? el.border.color : '#ffffff', (v) => applyLive((x) => (x.border = { width: (x.border && x.border.width) || 8, color: v })))));
      }
      return;
    }

    if (S.tab === 'adjust') {
      panel.append(...title('Modifier la photo'));
      if (el.type !== 'image') { panel.append(h('p', { class: 'muted small' }, 'Sélectionnez une image.')); return; }
      const src = (S.design.assets[el.assetId] || {}).src;
      panel.append(h('h4', {}, 'Filtres'));
      const grid = h('div', { class: 'fx-grid' });
      for (const [label, f] of G.FILTER_PRESETS) {
        const img = h('img', { src, draggable: false, style: `filter:${G.filterCss(f) || 'none'}` });
        grid.append(h('button', { class: 'fx photo', onclick: () => set((x) => (x.filters = G.clone(f))) }, h('div', { class: 'fx-prev' }, img), h('span', {}, label)));
      }
      panel.append(grid, h('h4', {}, 'Réglages'));
      const f = Object.assign({}, G.FILTER_DEFAULTS, el.filters);
      const adj = (label, key, min, max, step = 1) => field(label, rangeInput(f[key], min, max, step, (v) => applyLive((x) => { x.filters = Object.assign({}, x.filters, { [key]: v }); })));
      panel.append(adj('Luminosité', 'brightness', 0, 200), adj('Contraste', 'contrast', 0, 200), adj('Saturation', 'saturate', 0, 300),
        adj('Teinte', 'hue', -180, 180), adj('Noir et blanc', 'grayscale', 0, 100), adj('Sépia', 'sepia', 0, 100), adj('Flou', 'blur', 0, 20, 0.5));
      const c = el.crop || { zoom: 1, x: 0.5, y: 0.5 };
      const crop = (label, key, min, max, step, mul) => field(label, rangeInput(Math.round(c[key] * mul), min, max, step, (v) => applyLive((x) => { x.crop = Object.assign({ zoom: 1, x: 0.5, y: 0.5 }, x.crop, { [key]: v / mul }); })));
      panel.append(h('h4', {}, 'Recadrage'), crop('Zoom (%)', 'zoom', 100, 400, 1, 100), crop('Horizontal', 'x', 0, 100, 1, 100), crop('Vertical', 'y', 0, 100, 1, 100),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: () => set((x) => { x.flipX = !x.flipX; }) }, '⇋ Miroir'),
          h('button', { class: 'btn', onclick: () => set((x) => { x.flipY = !x.flipY; }) }, '⇅ Retourner')),
        h('button', { class: 'btn block', onclick: () => {
          // Rétablit les proportions d'origine de l'image.
          const a = S.design.assets[el.assetId];
          if (a) set((x) => { x.h = (x.w * a.h) / a.w; x.crop = { zoom: 1, x: 0.5, y: 0.5 }; });
        } }, 'Proportions d’origine'),
        h('h4', {}, 'Retirer le fond'),
        h('p', { class: 'muted small' }, 'Efface un fond uni (blanc, couleur unie) en partant des bords de l’image. Augmentez la tolérance si des restes subsistent.'),
        field('Tolérance', (() => { const r = h('input', { type: 'range', min: 5, max: 120, value: S.bgTol || 40, oninput: (e) => (S.bgTol = +e.target.value) }); return r; })()),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', onclick: async (e) => { e.target.disabled = true; e.target.textContent = 'Traitement…'; await removeBackground(el, S.bgTol || 40); } }, '✂ Retirer le fond'),
          el.originalAssetId ? h('button', { class: 'btn', onclick: () => set((x) => { x.assetId = x.originalAssetId; delete x.originalAssetId; }) }, 'Restaurer l’original') : ''),
        h('h4', {}, 'Autres actions'),
        h('button', { class: 'btn block', onclick: setAsBackground }, 'Définir comme arrière-plan'),
        h('button', { class: 'btn block', onclick: () => set((x) => { x.filters = null; x.crop = null; x.flipX = x.flipY = false; }) }, 'Réinitialiser'));
      return;
    }

    // Position
    panel.append(...title('Position'));
    panel.append(h('h4', {}, 'Disposition'), h('div', { class: 'btn-grid' },
      h('button', { class: 'btn', onclick: () => arrange('forward') }, '↑ Avancer'),
      h('button', { class: 'btn', onclick: () => arrange('backward') }, '↓ Reculer'),
      h('button', { class: 'btn', onclick: () => arrange('front') }, '⇈ Premier plan'),
      h('button', { class: 'btn', onclick: () => arrange('back') }, '⇊ Arrière-plan')));
    panel.append(h('h4', {}, sel.length > 1 && !(el.groupId && sel.every((e) => e.groupId === el.groupId)) ? 'Aligner les éléments' : 'Aligner sur la page'), h('div', { class: 'btn-grid three' },
      [['left', '⇤ Gauche'], ['hcenter', '↔ Centre'], ['right', 'Droite ⇥'], ['top', '⤒ Haut'], ['vcenter', '↕ Milieu'], ['bottom', '⤓ Bas']]
        .map(([m, l]) => h('button', { class: 'btn', onclick: () => align(m) }, l))));
    if (sel.length >= 3) {
      panel.append(h('h4', {}, 'Répartir'), h('div', { class: 'btn-grid' },
        h('button', { class: 'btn', onclick: () => distribute('h') }, '⇹ Horizontalement'),
        h('button', { class: 'btn', onclick: () => distribute('v') }, '⇳ Verticalement')));
    }
    if (sel.length > 1) {
      const grouped = el.groupId && sel.every((e) => e.groupId === el.groupId);
      panel.append(h('button', { class: 'btn block', onclick: grouped ? ungroup : group }, grouped ? 'Dissocier le groupe' : 'Grouper les éléments'));
    }
    if (sel.length === 1) {
      const num = (label, key, dis) => field(label, numInput(el[key] || 0, -100000, 100000, 1, (v) => applyLive((x) => (x[key] = v)), 80));
      panel.append(h('h4', {}, 'Taille et position (px)'), h('div', { class: 'pos-grid' },
        num('X', 'x'), num('Y', 'y'),
        el.type === 'text' ? field('Largeur', numInput(el.w, 8, 100000, 1, (v) => applyLive((x) => (x.w = v)), 80)) : num('Largeur', 'w'),
        el.type === 'text' ? field('Hauteur', h('span', { class: 'muted' }, Math.round(el.h) + ' (auto)')) : num('Hauteur', 'h'),
        num('Rotation', 'rotation')));
    }
  }

  /* ---------- redimensionner le design ---------- */
  function openResize() {
    let chosen = { w: W(), h: H() };
    const cw = h('input', { type: 'number', value: W(), min: 50, max: 8000 });
    const ch = h('input', { type: 'number', value: H(), min: 50, max: 8000 });
    const copy = h('input', { type: 'checkbox', checked: true });
    const list = h('div', { class: 'resize-list' }, G.FORMATS.map((f) => h('button', { class: 'resize-opt', onclick: (e) => {
      chosen = { w: f.w, h: f.h }; cw.value = f.w; ch.value = f.h;
      m.querySelectorAll('.resize-opt').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
    } }, h('strong', {}, f.name), h('span', { class: 'muted small' }, `${f.w} × ${f.h}`))));
    const close = () => m.remove();
    const go = async () => {
      const nw = Math.max(50, Math.min(8000, +cw.value || chosen.w)), nh = Math.max(50, Math.min(8000, +ch.value || chosen.h));
      const s = Math.min(nw / W(), nh / H());
      const ox = (nw - W() * s) / 2, oy = (nh - H() * s) / 2;
      const pages = G.clone(S.design.pages).map((p) => Object.assign(p, { elements: G.scaleElements(p.elements, s, ox, oy) }));
      close();
      if (copy.checked) {
        await save();
        const d = Object.assign(G.clone(S.design), { id: G.uid(), name: `${S.design.name} (${nw}×${nh})`, width: nw, height: nh, pages, updatedAt: Date.now() });
        await G.store.put(d);
        location.hash = '#/d/' + d.id;
      } else {
        Object.assign(S.design, { width: nw, height: nh, pages });
        S.sel = [];
        S.history.push(snapshot());
        markDirty();
        zoomFit();
      }
    };
    const m = h('div', { class: 'modal', onclick: (e) => { if (e.target === m) close(); } }, h('div', { class: 'modal-card wide' },
      h('h3', {}, 'Redimensionner le design'),
      h('p', { class: 'muted small' }, 'Le contenu est mis à l’échelle et centré dans le nouveau format.'),
      list,
      h('div', { class: 'row' }, h('span', {}, 'Personnalisé :'), cw, h('span', {}, '×'), ch, h('span', { class: 'muted' }, 'px')),
      h('label', { class: 'row' }, copy, h('span', {}, 'Créer une copie (conserver l’original)')),
      h('div', { class: 'modal-actions' }, h('button', { class: 'btn', onclick: close }, 'Annuler'), h('button', { class: 'btn primary', onclick: go }, 'Redimensionner'))));
    document.body.append(m);
  }

  /* ---------- mode présentation ---------- */
  function present() {
    finishEditing();
    let i = S.pageIdx;
    const stage = h('div', { class: 'stage' });
    const counter = h('div', { class: 'present-counter' });
    const ov = h('div', { class: 'present' }, stage, counter,
      h('button', { class: 'present-close', title: 'Quitter (Échap)', onclick: () => exit() }, '✕'));
    const show = () => {
      const s = Math.min(innerWidth / W(), innerHeight / H());
      stage.innerHTML = '';
      const p = G.renderPage(S.design, S.design.pages[i]);
      p.style.transform = `scale(${s})`;
      p.style.transformOrigin = '0 0';
      const box = h('div', { class: 'slide', style: `width:${W() * s}px;height:${H() * s}px` }, p);
      stage.append(box);
      counter.textContent = `${i + 1} / ${S.design.pages.length}`;
    };
    const go = (d) => { const j = Math.max(0, Math.min(S.design.pages.length - 1, i + d)); if (j !== i) { i = j; show(); } };
    const key = (e) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(1); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === 'Home') { i = 0; show(); }
      else if (e.key === 'End') { i = S.design.pages.length - 1; show(); }
      else if (e.key === 'Escape') exit();
      e.stopPropagation();
    };
    const exit = () => {
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('resize', show);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      ov.remove();
    };
    ov.addEventListener('click', (e) => { if (e.target.closest('.present-close')) return; go(e.clientX > innerWidth / 3 ? 1 : -1); });
    window.addEventListener('keydown', key, true);
    window.addEventListener('resize', show);
    document.body.append(ov);
    if (ov.requestFullscreen) ov.requestFullscreen().catch(() => {});
    show();
  }

  /* ---------- aide ---------- */
  function openHelp() {
    const rows = [
      ['T', 'Ajouter un texte'], ['R', 'Ajouter un rectangle'], ['C', 'Ajouter un cercle'], ['L', 'Ajouter une ligne'], ['D', 'Dessiner à main levée'],
      ['Ctrl+Z / Ctrl+Y', 'Annuler / rétablir'], ['Ctrl+C / V / X', 'Copier / coller / couper'], ['Ctrl+D', 'Dupliquer'],
      ['Ctrl+G / Ctrl+Maj+G', 'Grouper / dissocier'], ['Ctrl+Alt+C / V', 'Copier / coller le style'], ['Ctrl+A', 'Tout sélectionner'],
      ['Ctrl+B / I / U', 'Gras / italique / souligné'], ['Suppr', 'Supprimer'], ['Flèches (Maj ×10)', 'Déplacer finement'],
      ['Entrée', 'Modifier le texte sélectionné'], ['Ctrl+Alt+P', 'Présenter'], ['Ctrl + molette, Ctrl+0', 'Zoom, ajuster'],
      ['Maj pendant une rotation', 'Pas de 15°'], ['Alt pendant un déplacement', 'Sans magnétisme'], ['Double-clic sur une image', 'Modifier la photo'], ['?', 'Cette aide'],
    ];
    const m = h('div', { class: 'modal', onclick: (e) => { if (e.target === m || e.target.closest('.close')) m.remove(); } },
      h('div', { class: 'modal-card wide' }, h('h3', {}, 'Raccourcis clavier'),
        h('table', { class: 'keys' }, rows.map(([kk, l]) => h('tr', {}, h('td', {}, h('kbd', {}, kk)), h('td', {}, l)))),
        h('div', { class: 'modal-actions' }, h('button', { class: 'btn primary close' }, 'Fermer'))));
    document.body.append(m);
  }

  /* ---------- export ---------- */
  function openExport() {
    const m = $('#export-modal');
    m.classList.remove('hidden');
    $('#exp-pages').innerHTML = '';
    $('#exp-pages').append(h('option', { value: 'all' }, `Toutes les pages (${S.design.pages.length})`),
      h('option', { value: 'current' }, `Page actuelle (${S.pageIdx + 1})`));
    syncExportForm();
  }
  function syncExportForm() {
    const fmt = $('#exp-format').value;
    $('#exp-transparent-row').classList.toggle('hidden', fmt !== 'png');
    $('#exp-scale-row').classList.toggle('hidden', fmt === 'gbaki');
    $('#exp-pages-row').classList.toggle('hidden', fmt === 'gbaki');
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
      else await G.exportDesign(S.design, fmt, scale, pages, { transparent: $('#exp-transparent').checked });
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
  function tabs() {
    const list = BASE_TABS.map(([id, label, ic]) => ({ id, label, icon: ic }));
    for (const p of G.PANELS) {
      const at = p.after ? list.findIndex((t) => t.id === p.after) : -1;
      list.splice(at < 0 ? list.length : at + 1, 0, { id: p.id, label: p.label, icon: p.icon || ICON.elements });
    }
    return list;
  }
  G.openEditor = (design) => {
    S.active = true;
    S.design = design;
    S.design.assets = S.design.assets || {};
    S.design.fonts = S.design.fonts || [];
    S.pageIdx = 0;
    S.sel = [];
    S.editing = null;
    S.drawing = false;
    if (CONTEXT_TABS.includes(S.tab)) S.tab = S.lastTab;
    S.history = new G.History();
    S.history.reset(snapshot());
    loadWebFonts();
    loadDesignFonts(design).then(() => { if (S.design === design && design.fonts.length) renderAll(); });
    const app = $('#app');
    app.innerHTML = '';
    app.append(h('div', { class: 'editor' },
      h('header', { class: 'topbar' },
        h('a', { class: 'brand', href: '#/' }, 'GBAKI'),
        h('a', { class: 'tb-btn', href: '#/' }, '← Accueil'),
        h('input', { id: 'design-name', class: 'name-input', value: design.name, title: 'Renommer le design',
          oninput: (e) => { S.design.name = e.target.value; document.title = e.target.value + ' — GBAKI'; markDirty(); } }),
        h('div', { class: 'spacer' }),
        h('button', { class: 'icon-btn', 'data-act': 'undo', title: 'Annuler (Ctrl+Z)', onclick: undo }, '↶'),
        h('button', { class: 'icon-btn', 'data-act': 'redo', title: 'Rétablir (Ctrl+Y)', onclick: redo }, '↷'),
        h('span', { id: 'save-state', class: 'save-state' }, 'Enregistré'),
        h('button', { class: 'tb-btn', onclick: openResize, title: 'Changer le format du design' }, '⤢ Redimensionner'),
        h('button', { class: 'tb-btn', onclick: present, title: 'Présenter en plein écran (Ctrl+Alt+P)' }, '▶ Présenter'),
        h('button', { class: 'tb-btn', onclick: saveFile, title: 'Télécharger le fichier projet (réouvrable sur un autre ordinateur)' }, 'Enregistrer .gbaki'),
        h('button', { class: 'tb-btn primary', onclick: openExport }, 'Télécharger'),
        h('button', { class: 'icon-btn', onclick: openHelp, title: 'Raccourcis clavier (?)' }, '?')),
      h('div', { class: 'body' },
        h('nav', { class: 'tabs' }, tabs().map((t) => h('button', { 'data-tab': t.id, onclick: () => { S.tab = t.id; buildPanel(); } },
          h('span', { html: svgIcon(t.icon) }), h('span', {}, t.label)))),
        h('aside', { class: 'panel', id: 'panel' }),
        h('section', { class: 'workspace' },
          h('div', { class: 'ctxbar', id: 'ctxbar' }),
          h('div', { class: 'scroller', id: 'scroller' }, h('div', { class: 'pages', id: 'pages' })),
          h('footer', { class: 'statusbar' },
            h('button', { class: 'tb-btn', onclick: () => addPage() }, '+ Ajouter une page'),
            h('button', { class: 'tb-btn', id: 'grid-btn', title: 'Afficher une grille', onclick: (e) => { S.grid = !S.grid; e.currentTarget.classList.toggle('on', S.grid); renderAll(); } }, '▦ Grille'),
            h('div', { class: 'spacer' }),
            h('button', { class: 'icon-btn', title: 'Zoom arrière', onclick: () => setZoom(S.zoom / 1.2) }, '−'),
            h('input', { id: 'zoom', type: 'range', min: 5, max: 300, oninput: (e) => setZoom(e.target.value / 100) }),
            h('button', { class: 'icon-btn', title: 'Zoom avant', onclick: () => setZoom(S.zoom * 1.2) }, '+'),
            h('span', { id: 'zoom-label', class: 'zoom-label' }),
            h('button', { class: 'tb-btn', onclick: zoomFit }, 'Ajuster')))),
      h('div', { class: 'modal hidden', id: 'export-modal', onclick: (e) => { if (e.target.id === 'export-modal') e.target.classList.add('hidden'); } },
        h('div', { class: 'modal-card' },
          h('h3', {}, 'Télécharger'),
          field('Type de fichier', h('select', { id: 'exp-format', onchange: syncExportForm },
            h('option', { value: 'png' }, 'PNG — qualité maximale'),
            h('option', { value: 'jpg' }, 'JPG — fichier léger'),
            h('option', { value: 'pdf' }, 'PDF — impression / partage'),
            h('option', { value: 'gbaki' }, 'Projet GBAKI (.gbaki) — modifiable'))),
          h('div', { id: 'exp-scale-row' }, field('Taille', h('select', { id: 'exp-scale' },
            h('option', { value: '1' }, '× 1 (taille du design)'),
            h('option', { value: '2', selected: true }, '× 2 (haute définition)'),
            h('option', { value: '3' }, '× 3 (impression)')))),
          h('label', { class: 'row', id: 'exp-transparent-row' }, h('input', { type: 'checkbox', id: 'exp-transparent' }), h('span', {}, 'Fond transparent')),
          h('div', { id: 'exp-pages-row' }, field('Pages', h('select', { id: 'exp-pages' }))),
          h('div', { class: 'modal-actions' },
            h('button', { class: 'btn', onclick: () => $('#export-modal').classList.add('hidden') }, 'Annuler'),
            h('button', { class: 'btn primary', id: 'exp-go', onclick: doExport }, 'Télécharger')))),
      h('input', { type: 'file', id: 'file-image', accept: 'image/*', multiple: true, hidden: true,
        onchange: (e) => {
          const target = S.replaceTarget && findEl(S.replaceTarget).el;
          S.replaceTarget = null;
          addImageFiles(e.target.files, null, target);
          e.target.value = '';
        } })));

    const scroller = $('#scroller');
    scroller.addEventListener('pointerdown', (e) => {
      if (e.target === scroller || e.target.id === 'pages') {
        closePop();
        if (S.editing) finishEditing();
        S.sel = [];
        selectionChanged();
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
      e.stopPropagation();
      if (!e.dataTransfer.files.length) return;
      const wrap = e.target.closest('.page-wrap');
      let at = null, target = null;
      if (wrap) {
        const pi = +wrap.dataset.page;
        setActivePage(pi);
        at = toDesign(e, pi);
        const imgNode = e.target.closest('.el-image');
        if (imgNode) target = findEl(imgNode.dataset.id).el; // dépôt sur une image : on la remplace
      }
      addImageFiles(e.dataTransfer.files, at, target);
    });
    buildPanel();
    requestAnimationFrame(() => {
      zoomFit();
      S.history.reset(snapshot());
      $('[data-act=undo]').disabled = true;
    });
  };

  G.closeEditor = () => { closePop(); S.active = false; S.design = null; document.body.classList.remove('drawing'); };

  /* ---------- clavier et presse-papiers (installés une seule fois) ---------- */
  const typing = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  document.addEventListener('keydown', (e) => {
    if (!S.active) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    // Raccourcis de mise en forme aussi actifs pendant l'édition du texte.
    if (mod && !e.altKey && ['b', 'i', 'u'].includes(key) && selected().length && selected().every((x) => x.type === 'text')) {
      e.preventDefault();
      const prop = { b: 'bold', i: 'italic', u: 'underline' }[key];
      applyLive((x) => (x[prop] = !x[prop]));
      commit();
      return;
    }
    if (typing(e.target) || document.querySelector('.modal:not(.hidden)')) {
      if (key === 'escape' && !$('#export-modal').classList.contains('hidden')) $('#export-modal').classList.add('hidden');
      return;
    }
    if (mod && e.altKey && key === 'c') { e.preventDefault(); copyStyle(); }
    else if (mod && e.altKey && key === 'v') { e.preventDefault(); pasteStyle(); }
    else if (mod && e.altKey && key === 'p') { e.preventDefault(); present(); }
    else if (mod && key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    else if (mod && key === 'g') { e.preventDefault(); if (e.shiftKey) ungroup(); else group(); }
    else if (mod && key === 'd') { e.preventDefault(); duplicateSel(); }
    else if (mod && key === 'c') { copySel(); }
    else if (mod && key === 'x') { copySel(); deleteSel(); }
    else if (mod && key === 'a') { e.preventDefault(); S.sel = page().elements.filter((x) => !x.hidden).map((x) => x.id); selectionChanged(); }
    else if (mod && key === 's') { e.preventDefault(); save(); }
    else if (mod && (key === '=' || key === '+')) { e.preventDefault(); setZoom(S.zoom * 1.2); }
    else if (mod && key === '-') { e.preventDefault(); setZoom(S.zoom / 1.2); }
    else if (mod && key === '0') { e.preventDefault(); zoomFit(); }
    else if (mod) return;
    else if (key === 'delete' || key === 'backspace') { e.preventDefault(); deleteSel(); }
    else if (key === 'escape') { closePop(); if (S.drawing) stopDrawing(); S.sel = []; selectionChanged(); }
    else if (key === 'enter' && S.sel.length === 1) { e.preventDefault(); startEditing(S.sel[0]); }
    else if (key.startsWith('arrow')) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 1;
      nudge(key === 'arrowleft' ? -d : key === 'arrowright' ? d : 0, key === 'arrowup' ? -d : key === 'arrowdown' ? d : 0);
    }
    else if (e.key === '?') openHelp();
    else if (key === 't') addElement(G.makeText({ text: 'Votre texte', w: W() * 0.6, fontSize: Math.round(48 * k()), align: 'center', fontFamily: G.brand.body || 'Arial' }));
    else if (key === 'r') addElement(G.makeShape('rect', { w: 300 * k(), h: 300 * k() }));
    else if (key === 'c') addElement(G.makeShape('ellipse', { w: 300 * k(), h: 300 * k() }));
    else if (key === 'l') addElement(G.makeShape('line', { w: W() * 0.4, h: 20 * k() + 10, strokeWidth: Math.max(2, 8 * k()) }));
    else if (key === 'd') { if (S.drawing) stopDrawing(); else startDrawing(); }
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
  window.addEventListener('resize', () => { if (S.active && S.fit) zoomFit(); closePop(); });
})();
