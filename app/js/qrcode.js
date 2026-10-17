/* GBAKI — élément « QR code » : encodeur QR écrit d'après la norme ISO/IEC 18004 (mode octet, UTF-8). */
(function () {
  const G = window.GBAKI;

  /* ---------- Tables de la norme (index = version 1..40, 0 inutilisé) ---------- */
  // Nombre de codes de correction par bloc, selon le niveau L, M, Q, H.
  const ECC_PER_BLOCK = {
    L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  };
  // Nombre de blocs de correction.
  const NUM_BLOCKS = {
    L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
  };
  const ECL_BITS = { L: 1, M: 0, Q: 3, H: 2 };

  // Modules disponibles pour les données (hors motifs fonctionnels), puis en octets.
  function rawModules(v) {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) {
      const n = Math.floor(v / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (v >= 7) r -= 36;
    }
    return r;
  }
  const totalCodewords = (v) => Math.floor(rawModules(v) / 8);
  const dataCodewords = (v, ecl) => totalCodewords(v) - ECC_PER_BLOCK[ecl][v] * NUM_BLOCKS[ecl][v];

  function alignPositions(v) {
    if (v === 1) return [];
    const n = Math.floor(v / 7) + 2;
    const size = v * 4 + 17;
    const step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
    const res = [6];
    for (let p = size - 7; res.length < n; p -= step) res.splice(1, 0, p);
    return res;
  }

  /* ---------- Reed–Solomon sur GF(256), polynôme 0x11D ---------- */
  const EXP = new Array(512);
  const LOG = new Array(256);
  for (let i = 0, x = 1; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

  // Générateur (x - α^0)(x - α^1)…(x - α^(n-1)), coefficients sans le terme dominant.
  function rsGenerator(n) {
    let g = [1];
    for (let i = 0; i < n; i++) {
      const next = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) {
        next[j] ^= g[j];
        next[j + 1] ^= mul(g[j], EXP[i]);
      }
      g = next;
    }
    return g.slice(1);
  }
  function rsRemainder(data, gen) {
    const r = new Array(gen.length).fill(0);
    for (const b of data) {
      const f = b ^ r.shift();
      r.push(0);
      for (let i = 0; i < gen.length; i++) r[i] ^= mul(gen[i], f);
    }
    return r;
  }

  function utf8(str) {
    const out = [];
    for (const ch of String(str)) {
      let c = ch.codePointAt(0);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  /* ---------- Encodage des données : mode octet ---------- */
  function encodeData(bytes, ecl) {
    let v = 1;
    for (; v <= 40; v++) {
      const bits = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
      if (bits <= dataCodewords(v, ecl) * 8) break;
    }
    if (v > 40) throw new Error('Texte trop long pour un QR code');
    const cap = dataCodewords(v, ecl) * 8;
    const bb = [];
    const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
    put(4, 4); // indicateur de mode octet 0100
    put(bytes.length, v < 10 ? 8 : 16);
    for (const b of bytes) put(b, 8);
    put(0, Math.min(4, cap - bb.length)); // terminateur
    put(0, (8 - (bb.length % 8)) % 8);
    for (let pad = 0xec; bb.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
    const data = [];
    for (let i = 0; i < bb.length; i += 8) data.push(bb.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
    return { v, codewords: addEcc(data, v, ecl) };
  }

  // Découpe en blocs, calcule la correction et entrelace.
  function addEcc(data, v, ecl) {
    const nb = NUM_BLOCKS[ecl][v];
    const ecLen = ECC_PER_BLOCK[ecl][v];
    const total = totalCodewords(v);
    const shortCount = nb - (total % nb);
    const shortLen = Math.floor(total / nb) - ecLen;
    const gen = rsGenerator(ecLen);
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const len = shortLen + (i < shortCount ? 0 : 1);
      const d = data.slice(k, k + len);
      k += len;
      blocks.push({ d, e: rsRemainder(d, gen) });
    }
    const out = [];
    for (let i = 0; i <= shortLen; i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i]);
    for (let i = 0; i < ecLen; i++) for (const b of blocks) out.push(b.e[i]);
    return out;
  }

  /* ---------- Construction de la matrice ---------- */
  function bch(val, poly, deg) {
    let r = val << deg;
    const top = Math.floor(Math.log2(poly));
    while (r && Math.floor(Math.log2(r)) >= top) r ^= poly << (Math.floor(Math.log2(r)) - top);
    return (val << deg) | r;
  }

  const MASKS = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];

  function buildBase(v) {
    const size = v * 4 + 17;
    const m = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, dark) => { m[y][x] = dark; fn[y][x] = true; };
    // Motifs de position (avec séparateurs).
    for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, d !== 2 && d !== 4);
      }
    }
    // Motifs de synchronisation.
    for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    // Motifs d'alignement.
    const al = alignPositions(v);
    const last = al.length - 1;
    al.forEach((ay, i) => al.forEach((ax, j) => {
      if ((i === 0 && (j === 0 || j === last)) || (i === last && j === 0)) return; // coins des motifs de position
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    // Réserve des zones de format (remplies plus tard) et module sombre.
    for (let i = 0; i < 9; i++) { if (!fn[8][i]) set(i, 8, false); if (!fn[i][8]) set(8, i, false); }
    for (let i = 0; i < 8; i++) { set(size - 1 - i, 8, false); set(8, size - 1 - i, false); }
    set(8, size - 8, true);
    // Informations de version (v ≥ 7).
    if (v >= 7) {
      const bits = bch(v, 0x1f25, 12);
      for (let i = 0; i < 18; i++) {
        const dark = ((bits >> i) & 1) === 1;
        const a = size - 11 + (i % 3), b = Math.floor(i / 3);
        set(a, b, dark);
        set(b, a, dark);
      }
    }
    return { size, m, fn };
  }

  function placeData(base, codewords) {
    const { size, m, fn } = base;
    let i = 0;
    const total = codewords.length * 8;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (fn[y][x]) continue;
          if (i < total) m[y][x] = ((codewords[i >> 3] >> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }

  function drawFormat(base, ecl, mask) {
    const { size, m } = base;
    const bits = bch((ECL_BITS[ecl] << 3) | mask, 0x537, 10) ^ 0x5412;
    const bit = (i) => ((bits >> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) m[i][8] = bit(i);
    m[7][8] = bit(6);
    m[8][8] = bit(7);
    m[8][7] = bit(8);
    for (let i = 9; i < 15; i++) m[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i++) m[8][size - 1 - i] = bit(i);
    for (let i = 8; i < 15; i++) m[size - 15 + i][8] = bit(i);
    m[size - 8][8] = true;
  }

  // Pénalités de la norme (règles 1 à 4).
  function penalty(m) {
    const size = m.length;
    let p = 0, dark = 0;
    const lines = [];
    for (let y = 0; y < size; y++) {
      lines.push(m[y]);
      lines.push(m.map((row) => row[y]));
    }
    for (const line of lines) {
      let run = 1;
      for (let i = 1; i <= size; i++) {
        if (i < size && line[i] === line[i - 1]) run++;
        else { if (run >= 5) p += run - 2; run = 1; }
      }
      const s = '0000' + line.map((d) => (d ? 1 : 0)).join('') + '0000';
      for (let i = 0; i + 11 <= s.length; i++) {
        const sub = s.substr(i, 11);
        if (sub === '00001011101' || sub === '10111010000') p += 40;
      }
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (m[y][x]) dark++;
      if (x < size - 1 && y < size - 1) {
        const c = m[y][x];
        if (m[y][x + 1] === c && m[y + 1][x] === c && m[y + 1][x + 1] === c) p += 3;
      }
    }
    p += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
    return p;
  }

  /* Matrice booléenne [ligne][colonne] (true = module sombre). */
  G.qrMatrix = (text, ecl) => {
    ecl = ECL_BITS[ecl] != null ? ecl : 'M';
    const { v, codewords } = encodeData(utf8(text), ecl);
    let best = null, bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const base = buildBase(v);
      placeData(base, codewords);
      const f = MASKS[mask];
      for (let y = 0; y < base.size; y++) for (let x = 0; x < base.size; x++) {
        if (!base.fn[y][x] && f(x, y)) base.m[y][x] = !base.m[y][x];
      }
      drawFormat(base, ecl, mask);
      const score = penalty(base.m);
      if (score < bestScore) { bestScore = score; best = base.m; }
    }
    return best;
  };

  /* ---------- Type d'élément ---------- */
  const cache = { key: null, m: null };
  function matrixFor(el) {
    const key = el.ecl + '|' + el.text;
    if (cache.key !== key) {
      try { cache.m = G.qrMatrix(el.text || ' ', el.ecl); } catch (e) { cache.m = null; }
      cache.key = key;
    }
    return cache.m;
  }

  G.TYPES.qrcode = {
    label: 'QR code',
    keepRatio: true,
    svg(el) {
      const w = el.w, h = el.h;
      const m = matrixFor(el);
      if (!m) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
          `<rect width="${w}" height="${h}" fill="${G.esc(el.bg)}"/><text x="${w / 2}" y="${h / 2}" text-anchor="middle" ` +
          `font-family="Arial" font-size="${Math.max(10, w / 14)}" fill="#dc2626">Texte trop long</text></svg>`;
      }
      const q = Math.max(0, Math.round(el.margin || 0));
      const n = m.length + 2 * q;
      let d = '';
      m.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (!row[x]) continue;
          let len = 1;
          while (x + len < row.length && row[x + len]) len++;
          d += `M${x + q} ${y + q}h${len}v1h-${len}z`;
          x += len - 1;
        }
      });
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${n} ${n}" preserveAspectRatio="none" shape-rendering="crispEdges">` +
        `<rect width="${n}" height="${n}" fill="${G.esc(el.bg)}"/><path d="${d}" fill="${G.esc(el.fg)}"/></svg>`;
    },
    controls(el, ui) {
      return [
        ui.field('Contenu', ui.text(el.text, (v) => ui.live((x) => (x.text = v)), 200)),
        ui.button('Modifier…', 'Saisir un texte long (plusieurs lignes)', () => ui.prompt('Contenu du QR code', el.text, (t) => {
          ui.live((x) => (x.text = t));
          ui.commit();
        }, { multiline: true })),
        ui.field('Motif', ui.color(el.fg, (v) => ui.live((x) => (x.fg = v)))),
        ui.field('Fond', ui.color(el.bg, (v) => ui.live((x) => (x.bg = v)))),
        ui.field('Correction', ui.select(el.ecl, [['L', 'L (7 %)'], ['M', 'M (15 %)'], ['Q', 'Q (25 %)'], ['H', 'H (30 %)']], (v) => {
          ui.live((x) => (x.ecl = v));
          ui.commit();
        })),
        ui.field('Marge', ui.number(el.margin, 0, 10, 1, (v) => ui.live((x) => (x.margin = v)), 50)),
      ];
    },
  };

  G.makeQrcode = (o) => Object.assign(G.base(), {
    type: 'qrcode', text: 'https://exemple.com', fg: '#000000', bg: '#ffffff', ecl: 'M', margin: 2,
  }, o);

  G.ELEMENT_SECTIONS.push({
    title: 'QR code',
    build(container, api) {
      const h = api.h;
      const input = h('input', { type: 'text', value: 'https://exemple.com', placeholder: 'Lien ou texte',
        style: 'width:100%;box-sizing:border-box;padding:8px;border:1px solid #d1d5db;border-radius:8px' });
      const create = () => {
        const text = input.value.trim();
        if (!text) return input.focus();
        const s = Math.min(api.W(), api.H()) * 0.35;
        api.add(G.makeQrcode({ text, w: s, h: s }));
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') create(); });
      container.append(input, h('button', { class: 'btn primary block', onclick: create }, 'Créer le QR code'));
    },
  });
})();
