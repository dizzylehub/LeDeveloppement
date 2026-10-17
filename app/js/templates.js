/* GBAKI — modèles originaux. Chaque modèle est adapté au format de la page lorsqu'il est appliqué. */
(function () {
  const G = window.GBAKI;
  const T = (o) => G.makeText(o);
  const S = (shape, o) => G.makeShape(shape, o);
  const grad = (color, color2, angle) => ({ type: 'gradient', color, color2, angle });
  const solid = (color) => ({ type: 'solid', color });

  G.TEMPLATES = [
    {
      name: 'Promo audacieuse', w: 1080, h: 1080, bg: grad('#6d28d9', '#f97316', 135),
      elements: () => [
        S('ellipse', { x: 640, y: -160, w: 620, h: 620, fill: '#ffffff', opacity: 0.12 }),
        S('ellipse', { x: -200, y: 760, w: 520, h: 520, fill: '#ffffff', opacity: 0.1 }),
        T({ x: 90, y: 200, w: 900, text: 'SOLDES', fontFamily: 'Arial Black', fontSize: 190, color: '#ffffff', bold: true }),
        T({ x: 90, y: 440, w: 900, text: "-50 % sur tout le magasin", fontSize: 64, color: '#fde68a', bold: true }),
        T({ x: 90, y: 560, w: 760, text: 'Du 1er au 15 du mois, en boutique et en ligne.', fontSize: 38, color: '#ffffff', lineHeight: 1.35 }),
        S('roundrect', { x: 90, y: 780, w: 420, h: 110, radius: 55, fill: '#ffffff' }),
        T({ x: 90, y: 810, w: 420, text: 'J’en profite', fontSize: 44, color: '#6d28d9', bold: true, align: 'center' }),
      ],
    },
    {
      name: 'Citation inspirante', w: 1080, h: 1080, bg: solid('#fdf6ec'),
      elements: () => [
        S('rect', { x: 80, y: 80, w: 920, h: 920, fill: 'transparent', stroke: '#c2410c', strokeWidth: 4 }),
        T({ x: 140, y: 150, w: 300, text: '“', fontFamily: 'Georgia', fontSize: 300, color: '#c2410c', lineHeight: 1 }),
        T({ x: 160, y: 400, w: 760, text: 'Le succès, c’est d’aller d’échec en échec sans perdre son enthousiasme.', fontFamily: 'Georgia', fontSize: 58, color: '#292524', italic: true, lineHeight: 1.35 }),
        S('line', { x: 160, y: 790, w: 140, stroke: '#c2410c', strokeWidth: 6 }),
        T({ x: 160, y: 830, w: 700, text: 'Winston Churchill', fontSize: 36, color: '#57534e', bold: true, letterSpacing: 2 }),
      ],
    },
    {
      name: 'Annonce événement', w: 1080, h: 1920, bg: grad('#0f172a', '#1e3a8a', 180),
      elements: () => [
        S('ellipse', { x: 560, y: 120, w: 700, h: 700, fill: '#f59e0b', opacity: 0.9 }),
        S('ellipse', { x: -180, y: 1500, w: 600, h: 600, fill: '#38bdf8', opacity: 0.35 }),
        T({ x: 90, y: 860, w: 900, text: 'SOIRÉE', fontFamily: 'Impact', fontSize: 190, color: '#ffffff', letterSpacing: 6 }),
        T({ x: 90, y: 1080, w: 900, text: 'Networking & musique live', fontSize: 64, color: '#fbbf24', bold: true }),
        S('line', { x: 90, y: 1230, w: 300, stroke: '#ffffff', strokeWidth: 6 }),
        T({ x: 90, y: 1290, w: 900, text: 'Samedi 14 novembre · 20h\nLe Grand Hall, Abidjan', fontSize: 50, color: '#e2e8f0', lineHeight: 1.45 }),
        T({ x: 90, y: 1700, w: 900, text: 'Entrée libre sur inscription', fontSize: 40, color: '#94a3b8' }),
      ],
    },
    {
      name: 'Présentation — titre', w: 1920, h: 1080, bg: solid('#ffffff'),
      elements: () => [
        S('rect', { x: 0, y: 0, w: 640, h: 1080, fill: '#1e1b4b' }),
        S('ellipse', { x: 380, y: 680, w: 520, h: 520, fill: '#f97316' }),
        T({ x: 760, y: 360, w: 1050, text: 'Titre de votre présentation', fontSize: 104, color: '#1e1b4b', bold: true, lineHeight: 1.1 }),
        T({ x: 760, y: 640, w: 1000, text: 'Sous-titre ou nom de l’intervenant', fontSize: 48, color: '#6b7280' }),
        S('line', { x: 760, y: 590, w: 220, stroke: '#f97316', strokeWidth: 10 }),
      ],
    },
    {
      name: 'Carte de visite', w: 1050, h: 600, bg: solid('#111827'),
      elements: () => [
        S('rect', { x: 0, y: 0, w: 24, h: 600, fill: '#f97316' }),
        T({ x: 90, y: 150, w: 800, text: 'Aya Koné', fontSize: 72, color: '#ffffff', bold: true }),
        T({ x: 90, y: 245, w: 800, text: 'ARCHITECTE DPLG', fontSize: 30, color: '#f97316', letterSpacing: 6 }),
        T({ x: 90, y: 380, w: 800, text: '+225 07 00 00 00 00\naya.kone@exemple.com', fontSize: 30, color: '#d1d5db', lineHeight: 1.5 }),
        S('hexagon', { x: 820, y: 80, w: 150, h: 150, fill: '#f97316' }),
      ],
    },
    {
      name: 'Affiche concert', w: 1123, h: 1587, bg: grad('#be185d', '#312e81', 160),
      elements: () => [
        S('star', { x: 720, y: 90, w: 320, h: 320, fill: '#fde047' }),
        S('star', { x: 120, y: 1180, w: 180, h: 180, fill: '#fde047', opacity: 0.7 }),
        T({ x: 90, y: 480, w: 950, text: 'LIVE\nCONCERT', fontFamily: 'Impact', fontSize: 185, color: '#ffffff', lineHeight: 0.95 }),
        T({ x: 90, y: 940, w: 950, text: 'Les Étoiles du Plateau', fontSize: 70, color: '#fde047', bold: true }),
        T({ x: 90, y: 1060, w: 950, text: 'Vendredi 21 juin — 21h\nPalais de la Culture', fontSize: 48, color: '#ffffff', lineHeight: 1.4 }),
        T({ x: 400, y: 1440, w: 650, text: 'Billets : 5 000 FCFA', fontSize: 44, color: '#ffffff', bold: true, align: 'right' }),
      ],
    },
    {
      name: 'Menu restaurant', w: 794, h: 1123, bg: solid('#fffbeb'),
      elements: () => [
        T({ x: 60, y: 70, w: 674, text: 'MENU', fontFamily: 'Georgia', fontSize: 96, color: '#78350f', bold: true, align: 'center', letterSpacing: 10 }),
        S('line', { x: 297, y: 200, w: 200, stroke: '#b45309', strokeWidth: 4 }),
        T({ x: 80, y: 260, w: 634, text: 'ENTRÉES', fontSize: 30, color: '#b45309', bold: true, letterSpacing: 4 }),
        T({ x: 80, y: 310, w: 634, text: 'Salade d’avocat ........................ 3 500\nAccras de poisson .................... 4 000', fontFamily: 'Georgia', fontSize: 24, color: '#292524', lineHeight: 1.7 }),
        T({ x: 80, y: 470, w: 634, text: 'PLATS', fontSize: 30, color: '#b45309', bold: true, letterSpacing: 4 }),
        T({ x: 80, y: 520, w: 634, text: 'Poulet braisé, attiéké ............... 6 500\nPoisson grillé, alloco ................. 7 000\nKedjenou de pintade ................... 8 000', fontFamily: 'Georgia', fontSize: 24, color: '#292524', lineHeight: 1.7 }),
        T({ x: 80, y: 730, w: 634, text: 'DESSERTS', fontSize: 30, color: '#b45309', bold: true, letterSpacing: 4 }),
        T({ x: 80, y: 780, w: 634, text: 'Dêguê ......................................... 2 000\nSalade de fruits ......................... 2 500', fontFamily: 'Georgia', fontSize: 24, color: '#292524', lineHeight: 1.7 }),
        S('roundrect', { x: 60, y: 980, w: 674, h: 80, radius: 40, fill: '#78350f' }),
        T({ x: 60, y: 1002, w: 674, text: 'Réservations : 27 22 00 00 00', fontSize: 28, color: '#fffbeb', align: 'center' }),
      ],
    },
    {
      name: 'Miniature YouTube', w: 1280, h: 720, bg: solid('#facc15'),
      elements: () => [
        S('rect', { x: 0, y: 470, w: 1280, h: 250, fill: '#111827' }),
        T({ x: 60, y: 90, w: 1150, text: '5 ASTUCES', fontFamily: 'Impact', fontSize: 180, color: '#111827' }),
        T({ x: 60, y: 300, w: 900, text: 'que personne ne vous dit', fontSize: 70, color: '#111827', bold: true }),
        S('arrow', { x: 940, y: 250, w: 260, h: 180, fill: '#ef4444', rotation: 20 }),
        T({ x: 60, y: 540, w: 1150, text: 'Tuto complet en 10 minutes', fontSize: 64, color: '#facc15', bold: true }),
      ],
    },
    {
      name: 'Invitation élégante', w: 1080, h: 1350, bg: solid('#f5f5f4'),
      elements: () => [
        S('rect', { x: 60, y: 60, w: 960, h: 1230, fill: 'transparent', stroke: '#a16207', strokeWidth: 3 }),
        S('diamond', { x: 500, y: 150, w: 80, h: 80, fill: '#a16207' }),
        T({ x: 120, y: 300, w: 840, text: 'Vous êtes invités', fontFamily: 'Brush Script MT', fontSize: 110, color: '#44403c', align: 'center' }),
        T({ x: 120, y: 480, w: 840, text: 'AU MARIAGE DE', fontSize: 34, color: '#a16207', align: 'center', letterSpacing: 8 }),
        T({ x: 120, y: 560, w: 840, text: 'Awa & Koffi', fontFamily: 'Georgia', fontSize: 100, color: '#1c1917', align: 'center' }),
        T({ x: 120, y: 780, w: 840, text: 'Samedi 12 décembre\nà 15 heures', fontFamily: 'Georgia', fontSize: 44, color: '#44403c', align: 'center', lineHeight: 1.5 }),
        T({ x: 120, y: 1040, w: 840, text: 'Réponse souhaitée avant le 1er novembre', fontSize: 28, color: '#78716c', align: 'center', italic: true }),
      ],
    },
  ];

  /* Construit les pages d'un modèle, mises à l'échelle et centrées dans W × H. */
  G.pagesFromTemplate = (tpl, W, H) => {
    const s = Math.min(W / tpl.w, H / tpl.h);
    const ox = (W - tpl.w * s) / 2;
    const oy = (H - tpl.h * s) / 2;
    const makers = tpl.pages || [tpl.elements];
    const bgs = tpl.bgs || [tpl.bg];
    return makers.map((make, i) => {
      const page = G.newPage(G.clone(bgs[i] || bgs[0]));
      page.elements = G.scaleElements(make(), s, ox, oy);
      return page;
    });
  };
  G.pageFromTemplate = (tpl, W, H) => G.pagesFromTemplate(tpl, W, H)[0];
})();
