/* GBAKI — modèle de données, historique et stockage local (IndexedDB). */
(function () {
  const G = (window.GBAKI = window.GBAKI || {});

  G.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  G.clone = (o) => JSON.parse(JSON.stringify(o));

  G.FORMATS = [
    { id: 'insta-post', name: 'Publication Instagram', w: 1080, h: 1080 },
    { id: 'insta-story', name: 'Story / Reel', w: 1080, h: 1920 },
    { id: 'presentation', name: 'Présentation 16:9', w: 1920, h: 1080 },
    { id: 'a4', name: 'Document A4', w: 794, h: 1123 },
    { id: 'affiche', name: 'Affiche A3', w: 1123, h: 1587 },
    { id: 'flyer', name: 'Flyer A5', w: 559, h: 794 },
    { id: 'fb-cover', name: 'Couverture Facebook', w: 1640, h: 624 },
    { id: 'yt-thumb', name: 'Miniature YouTube', w: 1280, h: 720 },
    { id: 'carte', name: 'Carte de visite', w: 1050, h: 600 },
    { id: 'logo', name: 'Logo', w: 500, h: 500 },
  ];

  G.FONTS = [
    'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Segoe UI',
    'Georgia', 'Times New Roman', 'Garamond', 'Palatino Linotype',
    'Courier New', 'Impact', 'Arial Black', 'Comic Sans MS', 'Brush Script MT',
  ];

  G.PALETTE = [
    '#000000', '#374151', '#9ca3af', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
    '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#d946ef', '#ec4899', '#7c2d12', '#1e1b4b', '#fde68a',
  ];

  G.newPage = (bg) => ({ id: G.uid(), background: bg || { type: 'solid', color: '#ffffff' }, elements: [] });

  G.newDesign = (name, w, h) => ({
    id: G.uid(),
    name: name || 'Design sans titre',
    width: w,
    height: h,
    pages: [G.newPage()],
    assets: {},
    thumb: null,
    updatedAt: Date.now(),
  });

  const base = () => ({ id: G.uid(), x: 0, y: 0, w: 200, h: 200, rotation: 0, opacity: 1, locked: false, hidden: false });
  G.base = base;
  G.esc = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* Points d'extension (voir docs/EXTENSIONS.md). */
  G.TYPES = {};
  G.PANELS = [];
  G.ELEMENT_SECTIONS = [];

  G.makeText = (o) => Object.assign(base(), {
    type: 'text', w: 500, h: 60, text: 'Votre texte', fontFamily: 'Arial', fontSize: 40,
    color: '#111827', bold: false, italic: false, underline: false, align: 'left',
    lineHeight: 1.2, letterSpacing: 0,
  }, o);

  G.makeShape = (shape, o) => Object.assign(base(), {
    type: 'shape', shape, fill: '#8b5cf6', stroke: '#111827', strokeWidth: 0, radius: 0,
  }, shape === 'line' ? { h: 20, w: 300, strokeWidth: 6, stroke: '#111827' } : {}, o);

  G.makeImage = (assetId, o) => Object.assign(base(), { type: 'image', assetId, radius: 0 }, o);

  /* Formes : points normalisés (0..1) partagés par le rendu SVG et l'export canvas. */
  G.SHAPES = ['rect', 'roundrect', 'ellipse', 'triangle', 'diamond', 'pentagon', 'hexagon', 'star', 'arrow', 'line'];
  G.shapePoints = (shape) => {
    const poly = (n, rot) => Array.from({ length: n }, (_, i) => {
      const a = rot + (i * 2 * Math.PI) / n;
      return [0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a)];
    });
    switch (shape) {
      case 'triangle': return [[0.5, 0], [1, 1], [0, 1]];
      case 'diamond': return [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
      case 'pentagon': return poly(5, -Math.PI / 2);
      case 'hexagon': return poly(6, 0);
      case 'arrow': return [[0, 0.3], [0.6, 0.3], [0.6, 0], [1, 0.5], [0.6, 1], [0.6, 0.7], [0, 0.7]];
      case 'star': return Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 0.2 : 0.5;
        return [0.5 + r * Math.cos(a), 0.52 + r * Math.sin(a)];
      });
      default: return null;
    }
  };

  /* Historique (annuler / rétablir) : on ne stocke pas les images, seulement les pages. */
  G.History = class {
    constructor() { this.stack = []; this.i = -1; }
    reset(state) { this.stack = [JSON.stringify(state)]; this.i = 0; }
    push(state) {
      const s = JSON.stringify(state);
      if (this.stack[this.i] === s) return;
      this.stack = this.stack.slice(0, this.i + 1);
      this.stack.push(s);
      if (this.stack.length > 100) this.stack.shift();
      this.i = this.stack.length - 1;
    }
    undo() { if (this.i > 0) return JSON.parse(this.stack[--this.i]); return null; }
    redo() { if (this.i < this.stack.length - 1) return JSON.parse(this.stack[++this.i]); return null; }
  };

  /* Stockage local : IndexedDB, avec repli en mémoire si indisponible. */
  const memory = new Map();
  let dbPromise = null;
  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve) => {
        try {
          const req = indexedDB.open('gbaki', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('designs', { keyPath: 'id' });
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }
    return dbPromise;
  }
  function tx(mode, fn) {
    return db().then((d) => new Promise((resolve, reject) => {
      if (!d) {
        const r = fn(null);
        return resolve(r && typeof r === 'object' && 'result' in r ? r.result : undefined);
      }
      const t = d.transaction('designs', mode);
      const r = fn(t.objectStore('designs'));
      t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
      t.onerror = () => reject(t.error);
    }));
  }
  G.store = {
    persistent: () => db().then((d) => !!d),
    all: () => tx('readonly', (s) => (s ? s.getAll() : { result: [...memory.values()] })),
    get: (id) => tx('readonly', (s) => (s ? s.get(id) : { result: memory.get(id) })),
    put: (d) => tx('readwrite', (s) => (s ? s.put(d) : memory.set(d.id, G.clone(d)))),
    del: (id) => tx('readwrite', (s) => (s ? s.delete(id) : memory.delete(id))),
  };
})();
