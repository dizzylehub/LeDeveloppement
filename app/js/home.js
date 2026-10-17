/* GBAKI — écran d'accueil : formats, modèles, designs enregistrés. */
(function () {
  const G = window.GBAKI;
  const h = G.h;

  async function create(name, w, h_, pages) {
    const d = G.newDesign(name, w, h_);
    if (pages) d.pages = pages;
    try { d.thumb = await G.makeThumb(d); } catch (e) { /* facultatif */ }
    await G.store.put(d);
    location.hash = '#/d/' + d.id;
  }

  async function openFile(file) {
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.pages) || !data.width) throw new Error('format');
      const d = Object.assign(G.newDesign(), data);
      delete d.gbaki;
      if (await G.store.get(d.id)) d.id = G.uid();
      d.updatedAt = Date.now();
      try { d.thumb = await G.makeThumb(d); } catch (e) { /* facultatif */ }
      await G.store.put(d);
      location.hash = '#/d/' + d.id;
    } catch (e) {
      alert('Ce fichier n’est pas un projet GBAKI valide.');
    }
  }

  const fmtDate = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  G.openHome = async () => {
    const app = document.getElementById('app');
    app.innerHTML = '';
    const persistent = await G.store.persistent();
    const designs = (await G.store.all()).sort((a, b) => b.updatedAt - a.updatedAt);
    const fileInput = h('input', { type: 'file', accept: '.gbaki,application/json', hidden: true, onchange: (e) => e.target.files[0] && openFile(e.target.files[0]) });

    const formatCard = (f) => {
      const r = Math.min(70 / f.w, 70 / f.h);
      return h('button', { class: 'format-card', onclick: () => create('Design sans titre', f.w, f.h) },
        h('div', { class: 'format-shape' }, h('div', { style: `width:${f.w * r}px;height:${f.h * r}px` })),
        h('strong', {}, f.name), h('span', { class: 'muted small' }, `${f.w} × ${f.h} px`));
    };

    const cw = h('input', { type: 'number', value: 1200, min: 50, max: 8000 });
    const ch = h('input', { type: 'number', value: 800, min: 50, max: 8000 });
    const custom = h('div', { class: 'format-card custom' },
      h('strong', {}, 'Taille personnalisée'),
      h('div', { class: 'custom-row' }, cw, h('span', {}, '×'), ch),
      h('button', { class: 'btn primary', onclick: () => {
        const w = Math.max(50, Math.min(8000, +cw.value || 0)), hh = Math.max(50, Math.min(8000, +ch.value || 0));
        create('Design sans titre', w, hh);
      } }, 'Créer'));

    let cat = 'Tous';
    const cats = ['Tous', ...new Set(G.TEMPLATES.map((t) => t.category).filter(Boolean))];
    const tplGrid = h('div', { class: 'home-tpl-grid' });
    const catBar = h('div', { class: 'home-cats' });
    const renderTpls = () => {
      catBar.innerHTML = '';
      catBar.append(...cats.map((c) => h('button', { class: 'chip' + (c === cat ? ' on' : ''), onclick: () => { cat = c; renderTpls(); } }, c)));
      tplGrid.innerHTML = '';
      for (const t of G.TEMPLATES.filter((x) => cat === 'Tous' || x.category === cat)) {
        const n = t.pages ? t.pages.length : 1;
        tplGrid.append(h('button', { class: 'home-tpl', onclick: () => create(t.name, t.w, t.h, G.pagesFromTemplate(t, t.w, t.h)) },
          G.renderPreview({ width: t.w, height: t.h, assets: {} }, G.pageFromTemplate(t, t.w, t.h), 200, 200),
          h('span', {}, t.name + (n > 1 ? ` · ${n} pages` : ''))));
      }
    };
    renderTpls();

    const search = h('input', { class: 'search', type: 'search', placeholder: 'Rechercher dans mes designs…' });
    const list = h('div', { class: 'design-grid' });
    const renderList = () => {
      list.innerHTML = '';
      const q = search.value.trim().toLowerCase();
      const shown = designs.filter((d) => !q || (d.name || '').toLowerCase().includes(q));
      if (!shown.length) list.append(h('p', { class: 'muted' }, designs.length ? 'Aucun résultat.' : 'Aucun design pour l’instant — choisissez un format ou un modèle ci-dessus.'));
      for (const d of shown) {
        list.append(h('div', { class: 'design-card' },
          h('a', { class: 'thumb', href: '#/d/' + d.id }, d.thumb ? h('img', { src: d.thumb, alt: '' }) : h('div', { class: 'thumb-empty' })),
          h('div', { class: 'design-meta' },
            h('a', { class: 'design-name', href: '#/d/' + d.id }, d.name || 'Sans titre'),
            h('span', { class: 'muted small' }, `${d.width} × ${d.height} · ${d.pages.length} page${d.pages.length > 1 ? 's' : ''} · ${fmtDate(d.updatedAt)}`)),
          h('div', { class: 'design-actions' },
            h('button', { class: 'mini', title: 'Dupliquer', onclick: async () => {
              const c = Object.assign(G.clone(d), { id: G.uid(), name: d.name + ' (copie)', updatedAt: Date.now() });
              await G.store.put(c);
              G.openHome();
            } }, '⧉'),
            h('button', { class: 'mini', title: 'Supprimer', onclick: async () => {
              if (!confirm(`Supprimer « ${d.name} » ? Cette action est définitive.`)) return;
              await G.store.del(d.id);
              G.openHome();
            } }, '🗑'))));
      }
    };
    search.addEventListener('input', renderList);
    renderList();

    app.append(h('div', { class: 'home' },
      h('header', { class: 'home-top' },
        h('span', { class: 'brand' }, 'GBAKI'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn', onclick: () => fileInput.click() }, 'Ouvrir un fichier .gbaki'),
        fileInput),
      h('section', { class: 'hero' },
        h('h1', {}, 'Que voulez-vous créer aujourd’hui ?'),
        h('p', {}, 'Affiches, publications, présentations, cartes… GBAKI fonctionne entièrement dans votre navigateur, même sans connexion internet.')),
      h('section', { class: 'home-section' }, h('h2', {}, 'Créer un design'), h('div', { class: 'format-grid' }, G.FORMATS.map(formatCard), custom)),
      h('section', { class: 'home-section' }, h('h2', {}, `Partir d’un modèle (${G.TEMPLATES.length})`), catBar, tplGrid),
      h('section', { class: 'home-section' },
        h('div', { class: 'section-head' }, h('h2', {}, 'Mes designs'), search),
        list,
        h('p', { class: 'muted small note' }, persistent
          ? 'Vos designs sont enregistrés dans ce navigateur, sur cet ordinateur. Pour les transférer ailleurs, utilisez « Enregistrer .gbaki » dans l’éditeur.'
          : 'Attention : ce navigateur ne permet pas l’enregistrement local. Pensez à télécharger vos projets au format .gbaki.'))));

  };
  G.openGbakiFile = openFile;
})();
