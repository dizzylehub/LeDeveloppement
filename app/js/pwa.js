/* GBAKI — installation comme application (PWA) et fonctionnement hors ligne. */
(function () {
  const G = window.GBAKI;
  let deferred = null;

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    document.dispatchEvent(new Event('gbaki-installable'));
  });
  window.addEventListener('appinstalled', () => { deferred = null; });

  const ua = navigator.userAgent;
  G.pwa = {
    standalone: () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
    ios: () => /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    hosted: () => /^https?:$/.test(location.protocol),
    canPrompt: () => !!deferred,
    async install() {
      if (deferred) {
        deferred.prompt();
        await deferred.userChoice.catch(() => {});
        deferred = null;
        return true;
      }
      return false;
    },
  };
})();
