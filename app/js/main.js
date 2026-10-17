/* GBAKI — navigation entre l'accueil et l'éditeur. */
(function () {
  const G = window.GBAKI;

  async function route() {
    await G.flushEditor();
    const m = location.hash.match(/^#\/d\/([\w-]+)/);
    if (m) {
      const d = await G.store.get(m[1]);
      if (d) {
        document.title = (d.name || 'Design') + ' — GBAKI';
        G.openEditor(d);
        return;
      }
      location.hash = '#/';
      return;
    }
    G.closeEditor();
    document.title = 'GBAKI — créez vos visuels';
    G.openHome();
  }

  window.addEventListener('hashchange', route);
  // Glisser un fichier .gbaki sur l'accueil pour l'ouvrir.
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (G.editor.active) return;
    const f = e.dataTransfer.files[0];
    if (f && /\.gbaki$/i.test(f.name)) G.openGbakiFile(f);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) G.flushEditor(); });
  window.addEventListener('beforeunload', () => { G.flushEditor(); });
  route();
})();
