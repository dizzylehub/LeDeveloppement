/* GBAKI — modèles supplémentaires (originaux) et catégories des modèles. */
(function () {
  const G = window.GBAKI;
  const T = (o) => G.makeText(o);
  const S = (shape, o) => G.makeShape(shape, o);
  // Icône (si icons.js est chargé), sinon rien
  const I = (name, o) => (G.ICON_SET && G.ICON_SET[name]
    ? Object.assign(G.base(), { type: 'icon', name, color: '#ffffff', strokeWidth: 2, fill: 'none' }, o)
    : null);
  const L = (list) => list.filter(Boolean);
  const grad = (color, color2, angle) => ({ type: 'gradient', color, color2, angle });
  const solid = (color) => ({ type: 'solid', color });
  const NONE = 'transparent';

  /* ---------- catégories des modèles existants ---------- */
  const CATS = {
    'Promo audacieuse': 'Réseaux sociaux',
    'Citation inspirante': 'Réseaux sociaux',
    'Annonce événement': 'Événements',
    'Présentation — titre': 'Présentations',
    'Carte de visite': 'Business',
    'Affiche concert': 'Événements',
    'Menu restaurant': 'Impression',
    'Miniature YouTube': 'Réseaux sociaux',
    'Invitation élégante': 'Événements',
  };
  for (const t of G.TEMPLATES) if (!t.category && CATS[t.name]) t.category = CATS[t.name];
  G.TEMPLATE_CATEGORIES = ['Réseaux sociaux', 'Présentations', 'Documents', 'Impression', 'Événements', 'Business'];

  /* ---------- CV moderne (A4) ---------- */
  const cv = () => {
    const navy = '#1f3a5f', accent = '#f4a261', dark = '#0f172a', grey = '#475569';
    const side = (title, y) => T({ x: 40, y, w: 200, text: title, fontSize: 14, bold: true, color: accent, letterSpacing: 3 });
    const main = (title, y) => T({ x: 320, y, w: 420, text: title, fontSize: 15, bold: true, color: navy, letterSpacing: 3 });
    const skills = [['Stratégie digitale', 0.9], ['Rédaction web', 0.85], ['Design graphique', 0.75], ['Gestion de projet', 0.7]];
    const job = (y, title, where, lines) => [
      T({ x: 320, y, w: 420, text: title, fontSize: 15, bold: true, color: dark }),
      T({ x: 320, y: y + 23, w: 420, text: where, fontSize: 13, color: '#c2410c' }),
      T({ x: 320, y: y + 47, w: 420, text: lines, fontSize: 13, color: grey, lineHeight: 1.6 }),
    ];
    return L([
      S('rect', { x: 0, y: 0, w: 270, h: 1123, fill: navy }),
      S('ellipse', { x: 75, y: 60, w: 120, h: 120, fill: accent }),
      T({ x: 75, y: 92, w: 120, text: 'AK', fontFamily: 'Georgia', fontSize: 46, bold: true, color: navy, align: 'center' }),
      side('CONTACT', 228),
      ...[['phone', '+225 07 08 09 10 11'], ['mail', 'aya.kouassi@exemple.ci'], ['map-pin', 'Cocody, Abidjan'], ['globe', 'aya-kouassi.ci']]
        .flatMap(([ic, txt], i) => [
          I(ic, { x: 40, y: 268 + i * 32, w: 17, h: 17, color: accent }),
          T({ x: 68, y: 268 + i * 32, w: 190, text: txt, fontSize: 13, color: '#e2e8f0' }),
        ]),
      side('COMPÉTENCES', 420),
      ...skills.flatMap(([name, v], i) => [
        T({ x: 40, y: 456 + i * 48, w: 200, text: name, fontSize: 13, color: '#e2e8f0' }),
        S('roundrect', { x: 40, y: 479 + i * 48, w: 190, h: 6, radius: 3, fill: '#2f5480' }),
        S('roundrect', { x: 40, y: 479 + i * 48, w: 190 * v, h: 6, radius: 3, fill: accent }),
      ]),
      side('LANGUES', 660),
      T({ x: 40, y: 694, w: 210, text: 'Français — langue maternelle\nAnglais — courant\nDioula — courant', fontSize: 13, color: '#e2e8f0', lineHeight: 1.8 }),
      side('CENTRES D’INTÉRÊT', 810),
      T({ x: 40, y: 844, w: 210, text: 'Photographie, lecture,\nbasket-ball, bénévolat', fontSize: 13, color: '#e2e8f0', lineHeight: 1.7 }),
      T({ x: 320, y: 64, w: 430, text: 'Aya Kouassi', fontFamily: 'Georgia', fontSize: 44, bold: true, color: navy }),
      T({ x: 320, y: 126, w: 430, text: 'CHARGÉE DE COMMUNICATION DIGITALE', fontSize: 13, bold: true, color: '#c2410c', letterSpacing: 2 }),
      S('line', { x: 320, y: 158, w: 60, h: 20, stroke: accent, strokeWidth: 4 }),
      main('PROFIL', 200),
      T({ x: 320, y: 230, w: 420, text: 'Communicante passionnée avec 6 ans d’expérience dans la gestion des réseaux sociaux, la création de contenus et le pilotage de campagnes pour des marques ivoiriennes et panafricaines.', fontSize: 13, color: grey, lineHeight: 1.6 }),
      main('EXPÉRIENCE', 345),
      ...job(380, 'Responsable communication digitale', 'Agence Lagune Média · 2021 — aujourd’hui', '• Pilotage de 12 comptes clients sur 4 réseaux\n• Hausse moyenne de 140 % de l’engagement\n• Encadrement d’une équipe de 3 personnes'),
      ...job(520, 'Chargée de contenus', 'Kanvas Digital · 2018 — 2021', '• Calendrier éditorial et rédaction web\n• Campagnes sponsorisées (budget 2 M FCFA/mois)'),
      ...job(640, 'Stagiaire marketing', 'Comptoir du Plateau · 2017', '• Organisation d’animations commerciales en magasin'),
      main('FORMATION', 750),
      T({ x: 320, y: 785, w: 420, text: 'Master Communication & Marketing', fontSize: 15, bold: true, color: dark }),
      T({ x: 320, y: 808, w: 420, text: 'Institut des Sciences de la Communication · 2017', fontSize: 13, color: grey }),
      T({ x: 320, y: 845, w: 420, text: 'Licence Lettres modernes', fontSize: 15, bold: true, color: dark }),
      T({ x: 320, y: 868, w: 420, text: 'Université de Bouaké · 2015', fontSize: 13, color: grey }),
      main('OUTILS', 925),
      T({ x: 320, y: 958, w: 420, text: 'Suite Adobe · Meta Business · Google Analytics · WordPress · Canva', fontSize: 13, color: grey, lineHeight: 1.6 }),
      main('RÉFÉRENCES', 1010),
      T({ x: 320, y: 1043, w: 420, text: 'Disponibles sur demande', fontSize: 13, italic: true, color: grey }),
    ]);
  };

  /* ---------- Certificat (A4 paysage) ---------- */
  const certificate = () => {
    const green = '#0f3d3e', gold = '#c9a227';
    return L([
      S('rect', { x: 30, y: 30, w: 1063, h: 734, fill: NONE, stroke: green, strokeWidth: 10 }),
      S('rect', { x: 52, y: 52, w: 1019, h: 690, fill: NONE, stroke: gold, strokeWidth: 2 }),
      ...[[40, 40], [1059, 40], [40, 730], [1059, 730]].map(([x, y]) => S('diamond', { x, y, w: 24, h: 24, fill: gold })),
      T({ x: 0, y: 105, w: 1123, text: 'CERTIFICAT', fontFamily: 'Georgia', fontSize: 64, bold: true, color: green, align: 'center', letterSpacing: 12 }),
      T({ x: 0, y: 192, w: 1123, text: 'DE RÉUSSITE', fontSize: 22, bold: true, color: gold, align: 'center', letterSpacing: 10 }),
      S('line', { x: 481, y: 230, w: 160, h: 20, stroke: gold, strokeWidth: 2 }),
      T({ x: 0, y: 268, w: 1123, text: 'Ce certificat est fièrement décerné à', fontFamily: 'Georgia', fontSize: 22, italic: true, color: '#475569', align: 'center' }),
      T({ x: 0, y: 305, w: 1123, text: 'Awa Traoré', fontFamily: 'Brush Script MT', fontSize: 100, color: green, align: 'center' }),
      S('line', { x: 311, y: 432, w: 500, h: 20, stroke: '#cbd5e1', strokeWidth: 2 }),
      T({ x: 131, y: 470, w: 860, text: 'pour avoir suivi avec succès la formation « Leadership et gestion d’équipe »\n(40 heures), organisée à Abidjan du 3 au 28 mars 2026.', fontSize: 19, color: '#334155', align: 'center', lineHeight: 1.6 }),
      S('line', { x: 150, y: 640, w: 260, h: 20, stroke: '#94a3b8', strokeWidth: 1.5 }),
      T({ x: 150, y: 663, w: 260, text: 'Koffi N’Guessan\nDirecteur pédagogique', fontSize: 15, color: '#334155', align: 'center', lineHeight: 1.45 }),
      S('line', { x: 713, y: 640, w: 260, h: 20, stroke: '#94a3b8', strokeWidth: 1.5 }),
      T({ x: 713, y: 663, w: 260, text: 'Aya Bamba\nPrésidente du jury', fontSize: 15, color: '#334155', align: 'center', lineHeight: 1.45 }),
      S('ellipse', { x: 506, y: 590, w: 110, h: 110, fill: gold }),
      S('ellipse', { x: 516, y: 600, w: 90, h: 90, fill: NONE, stroke: '#fffdf7', strokeWidth: 2 }),
      I('award', { x: 534, y: 618, w: 54, h: 54, color: '#fffdf7', strokeWidth: 1.75 }),
      T({ x: 813, y: 76, w: 240, text: 'N° CERT-2026-0412', fontSize: 12, color: '#94a3b8', align: 'right', letterSpacing: 1 }),
    ]);
  };

  /* ---------- Facture (A4) ---------- */
  const invoice = () => {
    const teal = '#0f766e', ink = '#0f172a', grey = '#475569';
    const rows = [
      ['Tonte et entretien pelouse (mensuel)', '1', '150 000', '150 000'],
      ['Taille des haies et arbustes', '2', '35 000', '70 000'],
      ['Plantation de palmiers nains', '6', '12 500', '75 000'],
      ['Évacuation des déchets verts', '1', '25 000', '25 000'],
      ['Fourniture d’engrais bio (sac 25 kg)', '4', '9 000', '36 000'],
    ];
    const block = (x, title, text) => [
      T({ x, y: 190, w: 220, text: title, fontSize: 12, bold: true, color: teal, letterSpacing: 2 }),
      T({ x, y: 214, w: 230, text, fontSize: 13, color: '#334155', lineHeight: 1.5 }),
    ];
    return L([
      S('rect', { x: 0, y: 0, w: 794, h: 150, fill: teal }),
      S('roundrect', { x: 50, y: 45, w: 60, h: 60, radius: 14, fill: '#ffffff' }),
      I('sprout', { x: 62, y: 57, w: 36, h: 36, color: teal }),
      T({ x: 125, y: 48, w: 300, text: 'Verdure Services', fontSize: 26, bold: true, color: '#ffffff' }),
      T({ x: 125, y: 84, w: 300, text: 'Entretien d’espaces verts', fontSize: 14, color: '#ccfbf1' }),
      T({ x: 444, y: 42, w: 300, text: 'FACTURE', fontSize: 40, bold: true, color: '#ffffff', align: 'right', letterSpacing: 4 }),
      T({ x: 444, y: 98, w: 300, text: 'N° FAC-2026-0158', fontSize: 15, color: '#ccfbf1', align: 'right' }),
      ...block(50, 'ÉMETTEUR', 'Verdure Services SARL\nRue des Jardins, Cocody\nAbidjan, Côte d’Ivoire\nRCCM CI-ABJ-2024-B-1234'),
      ...block(300, 'FACTURÉ À', 'Résidence Les Palmiers\nM. Koffi Yao\nBd Latrille, Abidjan\n+225 07 00 11 22 33'),
      ...block(560, 'DÉTAILS', 'Date : 15/10/2026\nÉchéance : 30/10/2026\nPaiement : virement\nou Mobile Money'),
      S('roundrect', { x: 50, y: 340, w: 694, h: 44, radius: 6, fill: '#f1f5f9' }),
      T({ x: 66, y: 353, w: 300, text: 'DÉSIGNATION', fontSize: 12, bold: true, color: ink, letterSpacing: 1 }),
      T({ x: 420, y: 353, w: 70, text: 'QTÉ', fontSize: 12, bold: true, color: ink, align: 'center', letterSpacing: 1 }),
      T({ x: 495, y: 353, w: 110, text: 'PRIX UNIT.', fontSize: 12, bold: true, color: ink, align: 'right', letterSpacing: 1 }),
      T({ x: 618, y: 353, w: 110, text: 'MONTANT', fontSize: 12, bold: true, color: ink, align: 'right', letterSpacing: 1 }),
      ...rows.flatMap((r, i) => {
        const y = 384 + i * 52;
        return [
          T({ x: 66, y: y + 16, w: 350, text: r[0], fontSize: 14, color: ink }),
          T({ x: 420, y: y + 16, w: 70, text: r[1], fontSize: 14, color: grey, align: 'center' }),
          T({ x: 495, y: y + 16, w: 110, text: r[2], fontSize: 14, color: grey, align: 'right' }),
          T({ x: 618, y: y + 16, w: 110, text: r[3], fontSize: 14, bold: true, color: ink, align: 'right' }),
          S('line', { x: 50, y: y + 42, w: 694, h: 20, stroke: '#e2e8f0', strokeWidth: 1 }),
        ];
      }),
      T({ x: 466, y: 680, w: 140, text: 'Sous-total', fontSize: 14, color: grey }),
      T({ x: 600, y: 680, w: 128, text: '356 000 FCFA', fontSize: 14, color: ink, align: 'right' }),
      T({ x: 466, y: 714, w: 140, text: 'TVA (18 %)', fontSize: 14, color: grey }),
      T({ x: 600, y: 714, w: 128, text: '64 080 FCFA', fontSize: 14, color: ink, align: 'right' }),
      S('roundrect', { x: 450, y: 756, w: 294, h: 56, radius: 8, fill: teal }),
      T({ x: 466, y: 774, w: 120, text: 'TOTAL TTC', fontSize: 15, bold: true, color: '#ffffff', letterSpacing: 1 }),
      T({ x: 560, y: 771, w: 168, text: '420 080 FCFA', fontSize: 19, bold: true, color: '#ffffff', align: 'right' }),
      T({ x: 50, y: 680, w: 360, text: 'Modalités de paiement', fontSize: 14, bold: true, color: ink }),
      T({ x: 50, y: 706, w: 370, text: 'Mobile Money : 07 00 11 22 33\nVirement : CI00 1234 5678 9012 3456 78\nMerci de rappeler le numéro de facture.', fontSize: 12.5, color: grey, lineHeight: 1.6 }),
      T({ x: 50, y: 930, w: 694, text: 'Merci pour votre confiance !', fontFamily: 'Georgia', fontSize: 22, italic: true, color: teal, align: 'center' }),
      S('line', { x: 50, y: 1020, w: 694, h: 20, stroke: '#e2e8f0', strokeWidth: 1 }),
      T({ x: 50, y: 1050, w: 694, text: 'Verdure Services SARL · Capital 1 000 000 FCFA · contact@verdure.ci · +225 27 22 00 00 00', fontSize: 11, color: '#94a3b8', align: 'center' }),
      S('rect', { x: 0, y: 1105, w: 794, h: 18, fill: teal }),
    ]);
  };

  /* ---------- Lettre à en-tête (A4) ---------- */
  const letter = () => {
    const brown = '#b45309', ink = '#1c1917', grey = '#57534e';
    return [
      S('hexagon', { x: 60, y: 52, w: 58, h: 58, fill: brown }),
      T({ x: 60, y: 64, w: 58, text: 'K', fontFamily: 'Georgia', fontSize: 28, bold: true, color: '#ffffff', align: 'center' }),
      T({ x: 134, y: 56, w: 320, text: 'KONÉ & ASSOCIÉS', fontSize: 24, bold: true, color: ink, letterSpacing: 2 }),
      T({ x: 134, y: 90, w: 320, text: 'Cabinet de conseil juridique', fontSize: 13, color: '#78716c' }),
      T({ x: 470, y: 52, w: 264, text: 'Immeuble Alpha, 8e étage\nPlateau, Abidjan\n+225 27 20 00 00 00\ncontact@kone-associes.ci', fontSize: 11.5, color: grey, align: 'right', lineHeight: 1.5 }),
      S('line', { x: 60, y: 140, w: 674, h: 20, stroke: brown, strokeWidth: 2 }),
      T({ x: 434, y: 200, w: 300, text: 'Madame Awa Diallo\nDirectrice générale\nIvoire Logistique SA\n01 BP 1234 Abidjan 01', fontSize: 14, color: ink, lineHeight: 1.5 }),
      T({ x: 60, y: 330, w: 674, text: 'Abidjan, le 17 octobre 2026', fontSize: 14, color: grey }),
      T({ x: 60, y: 372, w: 674, text: 'Objet : proposition d’accompagnement juridique', fontSize: 15, bold: true, color: ink }),
      T({ x: 60, y: 425, w: 674, text: 'Madame la Directrice,\n\nNous vous remercions de l’intérêt que vous portez à notre cabinet. Suite à notre entretien du 10 octobre, nous avons le plaisir de vous adresser notre proposition d’accompagnement pour la structuration juridique de vos activités logistiques en Côte d’Ivoire et dans la sous-région.\n\nNotre équipe se tient à votre disposition pour en discuter lors d’une prochaine rencontre, à la date qui vous conviendra.\n\nNous vous prions d’agréer, Madame la Directrice, l’expression de nos salutations distinguées.', fontSize: 14, color: '#292524', lineHeight: 1.7 }),
      T({ x: 434, y: 735, w: 300, text: 'K. Koné', fontFamily: 'Brush Script MT', fontSize: 46, color: '#1e3a8a' }),
      T({ x: 434, y: 800, w: 300, text: 'Me Koffi Koné\nAvocat associé', fontSize: 14, color: ink, lineHeight: 1.5 }),
      S('line', { x: 60, y: 1030, w: 674, h: 20, stroke: '#e7e5e4', strokeWidth: 1 }),
      T({ x: 60, y: 1060, w: 674, text: 'SCP Koné & Associés · RCCM CI-ABJ-2019-B-5678 · www.kone-associes.ci', fontSize: 10.5, color: '#a8a29e', align: 'center' }),
      S('rect', { x: 0, y: 1113, w: 794, h: 10, fill: brown }),
    ];
  };

  /* ---------- Flyer immobilier (A5) ---------- */
  const realEstate = () => {
    const navy = '#0c4a6e', red = '#dc2626';
    const feats = [['bed', '4 chambres'], ['bath', '3 salles d’eau'], ['car', 'Garage 2 pl.'], ['trees', 'Jardin 300 m²']];
    return L([
      S('rect', { x: 0, y: 0, w: 559, h: 360, fill: '#e0f2fe' }),
      S('ellipse', { x: 400, y: 40, w: 80, h: 80, fill: '#fde68a' }),
      S('ellipse', { x: -120, y: 290, w: 800, h: 220, fill: '#bbf7d0' }),
      S('rect', { x: 0, y: 360, w: 559, h: 320, fill: '#ffffff' }),
      I('tree-palm', { x: 50, y: 140, w: 120, h: 120, color: '#166534', strokeWidth: 1.5 }),
      I('house', { x: 190, y: 92, w: 190, h: 190, color: navy, strokeWidth: 1.5 }),
      S('roundrect', { x: 30, y: 30, w: 150, h: 44, radius: 22, fill: red }),
      T({ x: 30, y: 42, w: 150, text: 'À VENDRE', fontSize: 17, bold: true, color: '#ffffff', align: 'center', letterSpacing: 2 }),
      T({ x: 30, y: 385, w: 500, text: 'Villa duplex 5 pièces', fontFamily: 'Georgia', fontSize: 30, bold: true, color: navy }),
      I('map-pin', { x: 30, y: 436, w: 18, h: 18, color: red }),
      T({ x: 54, y: 435, w: 470, text: 'Cocody Angré, Abidjan', fontSize: 15, color: '#475569' }),
      ...feats.flatMap(([ic, label], i) => [
        S('roundrect', { x: 30 + i * 127, y: 478, w: 116, h: 84, radius: 12, fill: '#f1f5f9' }),
        I(ic, { x: 30 + i * 127 + 44, y: 490, w: 28, h: 28, color: navy }),
        T({ x: 30 + i * 127, y: 530, w: 116, text: label, fontSize: 12, color: '#334155', align: 'center' }),
      ]),
      T({ x: 30, y: 588, w: 499, text: 'Belle villa lumineuse avec séjour double, cuisine équipée, terrasse et piscine, dans une résidence sécurisée proche des commodités.', fontSize: 13, color: '#334155', lineHeight: 1.55 }),
      S('rect', { x: 0, y: 680, w: 559, h: 114, fill: navy }),
      T({ x: 30, y: 700, w: 250, text: 'PRIX', fontSize: 12, bold: true, color: '#7dd3fc', letterSpacing: 3 }),
      T({ x: 30, y: 720, w: 300, text: '85 000 000 FCFA', fontSize: 28, bold: true, color: '#ffffff' }),
      I('phone', { x: 344, y: 712, w: 26, h: 26, color: '#7dd3fc' }),
      T({ x: 380, y: 703, w: 160, text: 'Appelez Koffi\n07 08 09 10 11', fontSize: 15, bold: true, color: '#ffffff', lineHeight: 1.4 }),
    ]);
  };

  /* ---------- Post recrutement ---------- */
  const hiring = () => L([
    S('ellipse', { x: 760, y: 760, w: 520, h: 520, fill: '#facc15' }),
    I('briefcase-business', { x: 870, y: 860, w: 130, h: 130, color: '#0f172a', strokeWidth: 1.75 }),
    S('roundrect', { x: 80, y: 90, w: 270, h: 52, radius: 26, fill: '#facc15' }),
    T({ x: 80, y: 104, w: 270, text: 'OFFRE D’EMPLOI', fontSize: 20, bold: true, color: '#0f172a', align: 'center', letterSpacing: 2 }),
    T({ x: 80, y: 180, w: 920, text: 'NOUS\nRECRUTONS', fontFamily: 'Arial Black', fontSize: 118, color: '#ffffff', lineHeight: 1 }),
    T({ x: 80, y: 445, w: 920, text: 'Commercial(e) terrain — Abidjan', fontSize: 44, bold: true, color: '#facc15' }),
    ...['Bac+2 en commerce ou marketing', '2 ans d’expérience minimum', 'Permis moto apprécié', 'Salaire motivant + commissions']
      .flatMap((txt, i) => [
        I('circle-check', { x: 80, y: 548 + i * 62, w: 38, h: 38, color: '#facc15' }),
        T({ x: 135, y: 550 + i * 62, w: 620, text: txt, fontSize: 30, color: '#e2e8f0' }),
      ]),
    T({ x: 80, y: 850, w: 680, text: 'Envoyez votre CV à', fontSize: 26, color: '#94a3b8' }),
    T({ x: 80, y: 888, w: 680, text: 'rh@akwaba-distribution.ci', fontSize: 34, bold: true, color: '#ffffff' }),
    T({ x: 80, y: 955, w: 680, text: 'Date limite : 30 novembre 2026', fontSize: 22, color: '#94a3b8' }),
  ]);

  /* ---------- Post produit e-commerce ---------- */
  const product = () => L([
    S('ellipse', { x: 520, y: 150, w: 500, h: 500, fill: '#fb923c' }),
    S('ellipse', { x: 570, y: 200, w: 400, h: 400, fill: '#fed7aa' }),
    I('shopping-bag', { x: 650, y: 280, w: 240, h: 240, color: '#9a3412', strokeWidth: 1.5 }),
    S('ellipse', { x: 870, y: 90, w: 160, h: 160, fill: '#dc2626' }),
    T({ x: 870, y: 145, w: 160, text: '-26 %', fontSize: 40, bold: true, color: '#ffffff', align: 'center' }),
    S('roundrect', { x: 80, y: 100, w: 210, h: 50, radius: 25, fill: '#9a3412' }),
    T({ x: 80, y: 113, w: 210, text: 'NOUVEAUTÉ', fontSize: 20, bold: true, color: '#ffffff', align: 'center', letterSpacing: 2 }),
    T({ x: 80, y: 190, w: 440, text: 'Sac\nAkwaba', fontFamily: 'Georgia', fontSize: 100, bold: true, color: '#431407', lineHeight: 1 }),
    T({ x: 80, y: 420, w: 430, text: 'Tissu wax 100 % coton,\ncousu main à Abidjan.', fontSize: 28, color: '#7c2d12', lineHeight: 1.4 }),
    T({ x: 80, y: 560, w: 440, text: '18 500 FCFA', fontSize: 56, bold: true, color: '#ea580c' }),
    T({ x: 80, y: 640, w: 440, text: 'au lieu de 25 000 FCFA', fontSize: 26, color: '#a8a29e' }),
    S('rect', { x: 0, y: 790, w: 1080, h: 290, fill: '#431407' }),
    I('truck', { x: 80, y: 838, w: 40, h: 40, color: '#fdba74' }),
    T({ x: 140, y: 841, w: 860, text: 'Livraison gratuite à Abidjan', fontSize: 28, color: '#ffffff' }),
    I('shield-check', { x: 80, y: 906, w: 40, h: 40, color: '#fdba74' }),
    T({ x: 140, y: 909, w: 860, text: 'Paiement à la livraison ou Mobile Money', fontSize: 28, color: '#ffffff' }),
    I('phone', { x: 80, y: 974, w: 40, h: 40, color: '#fdba74' }),
    T({ x: 140, y: 973, w: 860, text: 'Commandez au 07 00 00 00 00', fontSize: 32, bold: true, color: '#fdba74' }),
  ]);

  /* ---------- Story témoignage client ---------- */
  const testimonial = () => {
    const teal = '#0f766e';
    return L([
      S('ellipse', { x: 760, y: -180, w: 520, h: 520, fill: '#ccfbf1' }),
      T({ x: 90, y: 170, w: 900, text: 'ILS NOUS FONT CONFIANCE', fontSize: 34, bold: true, color: teal, letterSpacing: 6 }),
      S('line', { x: 90, y: 230, w: 120, h: 20, stroke: teal, strokeWidth: 6 }),
      S('roundrect', { x: 70, y: 340, w: 940, h: 1060, radius: 48, fill: '#ffffff' }),
      T({ x: 130, y: 395, w: 300, text: '“', fontFamily: 'Georgia', fontSize: 260, color: '#14b8a6', lineHeight: 1 }),
      ...[0, 1, 2, 3, 4].map((i) => I('star', { x: 140 + i * 70, y: 590, w: 56, h: 56, color: '#f59e0b', fill: '#f59e0b' })),
      T({ x: 140, y: 700, w: 800, text: 'Service rapide, équipe adorable et des résultats au-delà de mes attentes. Je recommande les yeux fermés !', fontFamily: 'Georgia', fontSize: 54, italic: true, color: '#134e4a', lineHeight: 1.4 }),
      S('ellipse', { x: 140, y: 1190, w: 140, h: 140, fill: '#99f6e4' }),
      T({ x: 140, y: 1232, w: 140, text: 'AD', fontSize: 48, bold: true, color: teal, align: 'center' }),
      T({ x: 310, y: 1208, w: 660, text: 'Awa Diabaté', fontSize: 44, bold: true, color: '#0f172a' }),
      T({ x: 310, y: 1268, w: 660, text: 'Gérante, Boutique Awa Couture', fontSize: 30, color: '#64748b' }),
      T({ x: 90, y: 1510, w: 900, text: 'Et vous, quand commencez-vous ?', fontSize: 44, bold: true, color: teal, align: 'center' }),
      S('roundrect', { x: 290, y: 1610, w: 500, h: 110, radius: 55, fill: teal }),
      T({ x: 290, y: 1640, w: 500, text: 'Contactez-nous', fontSize: 42, bold: true, color: '#ffffff', align: 'center' }),
      T({ x: 90, y: 1790, w: 900, text: '@lagune.studio', fontSize: 32, color: teal, align: 'center', opacity: 0.75 }),
    ]);
  };

  /* ---------- Bannière LinkedIn ---------- */
  const linkedin = () => L([
    S('ellipse', { x: 1220, y: -170, w: 520, h: 520, fill: '#3b82f6', opacity: 0.25 }),
    S('ellipse', { x: 1400, y: 210, w: 300, h: 300, fill: '#f59e0b', opacity: 0.9 }),
    T({ x: 560, y: 96, w: 800, text: 'TRANSFORMATION DIGITALE · DATA · STRATÉGIE', fontSize: 18, bold: true, color: '#93c5fd', letterSpacing: 3 }),
    T({ x: 560, y: 140, w: 800, text: 'J’aide les PME africaines à réussir\nleur passage au numérique.', fontSize: 38, bold: true, color: '#ffffff', lineHeight: 1.25 }),
    I('mail', { x: 560, y: 285, w: 24, h: 24, color: '#93c5fd' }),
    T({ x: 594, y: 285, w: 280, text: 'koffi.yao@exemple.ci', fontSize: 20, color: '#e2e8f0' }),
    I('globe', { x: 870, y: 285, w: 24, h: 24, color: '#93c5fd' }),
    T({ x: 904, y: 285, w: 280, text: 'www.koffiyao.ci', fontSize: 20, color: '#e2e8f0' }),
  ]);

  /* ---------- Logos (3 variantes) ---------- */
  const logo1 = () => [
    S('ellipse', { x: 150, y: 70, w: 200, h: 200, fill: '#1e3a8a' }),
    S('ellipse', { x: 162, y: 82, w: 176, h: 176, fill: NONE, stroke: '#f59e0b', strokeWidth: 3 }),
    T({ x: 150, y: 120, w: 200, text: 'KF', fontFamily: 'Georgia', fontSize: 84, bold: true, color: '#ffffff', align: 'center' }),
    T({ x: 0, y: 300, w: 500, text: 'KOFFI & FILS', fontSize: 38, bold: true, color: '#1e3a8a', align: 'center', letterSpacing: 4 }),
    S('line', { x: 200, y: 350, w: 100, h: 20, stroke: '#f59e0b', strokeWidth: 4 }),
    T({ x: 0, y: 382, w: 500, text: 'BÂTIMENT · DEPUIS 1998', fontSize: 16, color: '#64748b', align: 'center', letterSpacing: 4 }),
  ];
  const logo2 = () => L([
    S('ellipse', { x: 185, y: 115, w: 130, h: 130, fill: '#dcfce7' }),
    I('leaf', { x: 210, y: 140, w: 80, h: 80, color: '#15803d', strokeWidth: 1.75 }),
    T({ x: 0, y: 260, w: 500, text: 'verdure', fontFamily: 'Georgia', fontSize: 76, italic: true, color: '#14532d', align: 'center' }),
    T({ x: 0, y: 365, w: 500, text: 'JARDINS & PAYSAGES', fontSize: 17, bold: true, color: '#16a34a', align: 'center', letterSpacing: 6 }),
  ]);
  const logo3 = () => L([
    S('hexagon', { x: 175, y: 105, w: 150, h: 150, fill: '#f97316' }),
    I('camera', { x: 212, y: 142, w: 76, h: 76, color: '#ffffff' }),
    T({ x: 0, y: 293, w: 500, text: 'AYA STUDIO', fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff', align: 'center', letterSpacing: 2 }),
    T({ x: 0, y: 370, w: 500, text: 'Photographie · Vidéo', fontSize: 20, color: '#fdba74', align: 'center', letterSpacing: 2 }),
  ]);

  /* ---------- Infographie en 3 étapes ---------- */
  const steps = () => {
    const list = [
      ['#6366f1', 'smartphone', 'Téléchargez l’application', 'Disponible gratuitement sur Android et iPhone, en quelques secondes.'],
      ['#ec4899', 'id-card', 'Créez votre profil', 'Munissez-vous de votre pièce d’identité et prenez un selfie.'],
      ['#f59e0b', 'wallet', 'Faites un dépôt', 'Rechargez via Mobile Money et commencez à épargner dès 1 000 FCFA.'],
    ];
    return L([
      T({ x: 90, y: 90, w: 900, text: 'COMMENT ÇA MARCHE ?', fontSize: 24, bold: true, color: '#6366f1', letterSpacing: 5 }),
      T({ x: 90, y: 140, w: 900, text: 'Ouvrir votre compte\nen 3 étapes', fontSize: 72, bold: true, color: '#0f172a', lineHeight: 1.1 }),
      ...list.flatMap(([c, ic, title, desc], i) => {
        const y = 380 + i * 300;
        return [
          i < 2 && S('rect', { x: 152, y: y + 135, w: 6, h: 165, fill: '#cbd5e1' }),
          S('ellipse', { x: 90, y, w: 130, h: 130, fill: c }),
          T({ x: 90, y: y + 33, w: 130, text: String(i + 1), fontSize: 54, bold: true, color: '#ffffff', align: 'center' }),
          T({ x: 260, y: y + 12, w: 580, text: title, fontSize: 38, bold: true, color: '#0f172a' }),
          T({ x: 260, y: y + 70, w: 560, text: desc, fontSize: 26, color: '#475569', lineHeight: 1.45 }),
          S('roundrect', { x: 870, y: y + 5, w: 120, h: 120, radius: 28, fill: c, opacity: 0.12 }),
          I(ic, { x: 900, y: y + 35, w: 60, h: 60, color: c }),
        ];
      }),
      T({ x: 90, y: 1255, w: 900, text: 'Besoin d’aide ? Appelez le 1313 (appel gratuit)', fontSize: 26, color: '#64748b' }),
    ]);
  };

  /* ---------- Faire-part de naissance ---------- */
  const birth = () => L([
    S('ellipse', { x: -120, y: -120, w: 420, h: 420, fill: '#fed7aa', opacity: 0.6 }),
    S('ellipse', { x: 820, y: 1080, w: 420, h: 420, fill: '#bae6fd', opacity: 0.7 }),
    S('star', { x: 860, y: 140, w: 60, h: 60, fill: '#fbbf24' }),
    S('star', { x: 945, y: 235, w: 36, h: 36, fill: '#fbbf24', opacity: 0.7 }),
    S('star', { x: 140, y: 1130, w: 44, h: 44, fill: '#fbbf24' }),
    I('baby', { x: 470, y: 180, w: 140, h: 140, color: '#c2410c', strokeWidth: 1.5 }),
    T({ x: 0, y: 350, w: 1080, text: 'Bienvenue', fontFamily: 'Brush Script MT', fontSize: 130, color: '#9a3412', align: 'center' }),
    T({ x: 90, y: 540, w: 900, text: 'NOUS AVONS LA JOIE DE VOUS ANNONCER\nLA NAISSANCE DE', fontSize: 24, color: '#78716c', align: 'center', letterSpacing: 4, lineHeight: 1.6 }),
    T({ x: 40, y: 650, w: 1000, text: 'Emmanuel Kouadio', fontFamily: 'Georgia', fontSize: 86, bold: true, color: '#1c1917', align: 'center' }),
    S('roundrect', { x: 240, y: 810, w: 600, h: 190, radius: 30, fill: '#ffffff' }),
    T({ x: 240, y: 852, w: 600, text: 'Né le 2 septembre 2026 à 7 h 45\n3,4 kg · 51 cm', fontSize: 30, color: '#44403c', align: 'center', lineHeight: 1.6 }),
    T({ x: 90, y: 1070, w: 900, text: 'Les heureux parents\nAya & Koffi Kouadio', fontFamily: 'Georgia', fontSize: 38, italic: true, color: '#9a3412', align: 'center', lineHeight: 1.5 }),
  ]);

  /* ---------- Affiche conférence (A3) ---------- */
  const conference = () => {
    const cyan = '#22d3ee', violet = '#a78bfa';
    const speakers = [['AK', 'Dr Awa Koné', 'Experte fintech'], ['KM', 'Koffi Mensah', 'Fondateur, AgriTech CI'], ['AO', 'Aya Ouattara', 'Directrice innovation']];
    return L([
      S('ellipse', { x: 600, y: -250, w: 800, h: 800, fill: '#7c3aed', opacity: 0.35 }),
      S('ellipse', { x: 800, y: 140, w: 400, h: 400, fill: cyan, opacity: 0.22 }),
      S('roundrect', { x: 90, y: 110, w: 390, h: 56, radius: 28, fill: NONE, stroke: cyan, strokeWidth: 2 }),
      T({ x: 90, y: 126, w: 390, text: 'CONFÉRENCE · 2e ÉDITION', fontSize: 20, bold: true, color: cyan, align: 'center', letterSpacing: 2 }),
      T({ x: 90, y: 230, w: 950, text: 'Afrique\nNumérique', fontFamily: 'Arial Black', fontSize: 130, color: '#ffffff', lineHeight: 1 }),
      T({ x: 90, y: 490, w: 950, text: '2026', fontFamily: 'Arial Black', fontSize: 130, color: cyan, lineHeight: 1 }),
      T({ x: 90, y: 665, w: 900, text: 'Innovation, emploi des jeunes et inclusion financière', fontSize: 40, color: '#cbd5e1', lineHeight: 1.35 }),
      ...[['calendar', '12 & 13 novembre 2026'], ['map-pin', 'Palais des Congrès, Abidjan'], ['clock', '9 h — 18 h · Entrée libre sur inscription']]
        .flatMap(([ic, txt], i) => [
          I(ic, { x: 90, y: 840 + i * 76, w: 42, h: 42, color: cyan }),
          T({ x: 155, y: 841 + i * 76, w: 880, text: txt, fontSize: 34, bold: true, color: '#ffffff' }),
        ]),
      T({ x: 90, y: 1100, w: 900, text: 'INTERVENANTS', fontSize: 22, bold: true, color: violet, letterSpacing: 5 }),
      ...speakers.flatMap(([ini, name, role], i) => {
        const x = 90 + i * 330;
        return [
          S('ellipse', { x, y: 1150, w: 110, h: 110, fill: '#1e293b', stroke: '#7c3aed', strokeWidth: 3 }),
          T({ x, y: 1182, w: 110, text: ini, fontSize: 36, bold: true, color: violet, align: 'center' }),
          T({ x, y: 1280, w: 300, text: name, fontSize: 26, bold: true, color: '#ffffff' }),
          T({ x, y: 1318, w: 300, text: role, fontSize: 20, color: '#94a3b8' }),
        ];
      }),
      S('rect', { x: 0, y: 1460, w: 1123, h: 127, fill: '#7c3aed' }),
      T({ x: 90, y: 1503, w: 950, text: 'Inscription : www.afrique-numerique.ci', fontSize: 32, bold: true, color: '#ffffff' }),
    ]);
  };

  /* ---------- Carte de vœux ---------- */
  const greetings = () => {
    const gold = '#d4af37';
    return L([
      S('rect', { x: 50, y: 50, w: 980, h: 980, fill: NONE, stroke: gold, strokeWidth: 2 }),
      S('star', { x: 140, y: 140, w: 60, h: 60, fill: gold }),
      S('star', { x: 880, y: 170, w: 40, h: 40, fill: gold, opacity: 0.8 }),
      S('star', { x: 190, y: 860, w: 40, h: 40, fill: gold, opacity: 0.8 }),
      S('star', { x: 850, y: 840, w: 72, h: 72, fill: gold }),
      ...[[260, 110], [820, 300], [120, 640], [960, 640], [700, 950]].map(([x, y]) => S('ellipse', { x, y, w: 10, h: 10, fill: '#fde68a', opacity: 0.8 })),
      I('sparkles', { x: 485, y: 180, w: 110, h: 110, color: gold, strokeWidth: 1.5 }),
      T({ x: 0, y: 320, w: 1080, text: 'Meilleurs vœux', fontFamily: 'Brush Script MT', fontSize: 140, color: '#fde68a', align: 'center' }),
      T({ x: 0, y: 505, w: 1080, text: '2027', fontFamily: 'Georgia', fontSize: 150, bold: true, color: gold, align: 'center', letterSpacing: 10 }),
      T({ x: 90, y: 730, w: 900, text: 'Que cette nouvelle année vous apporte santé,\njoie et réussite, à vous et à vos proches.', fontFamily: 'Georgia', fontSize: 32, italic: true, color: '#d1fae5', align: 'center', lineHeight: 1.5 }),
      T({ x: 90, y: 900, w: 900, text: 'TOUTE L’ÉQUIPE DE LAGUNE MÉDIA', fontSize: 22, bold: true, color: gold, align: 'center', letterSpacing: 4 }),
    ]);
  };

  /* ---------- Programme de cérémonie (A4) ---------- */
  const ceremony = () => {
    const gold = '#b08d57', brown = '#7c5a2a';
    const items = [
      ['14 h 00', 'Mariage civil', 'Mairie de Cocody'],
      ['15 h 30', 'Bénédiction nuptiale', 'Église Sainte-Famille, Riviera'],
      ['17 h 30', 'Vin d’honneur', 'Jardins de la résidence · photos de famille'],
      ['19 h 30', 'Entrée des mariés', 'Accueil en musique au son du tam-tam'],
      ['20 h 00', 'Dîner de gala', 'Buffet ivoirien et international'],
      ['22 h 00', 'Ouverture du bal', 'Coupé-décalé, zouglou et surprises !'],
    ];
    return [
      S('rect', { x: 30, y: 30, w: 734, h: 1063, fill: NONE, stroke: gold, strokeWidth: 1.5 }),
      S('rect', { x: 40, y: 40, w: 714, h: 1043, fill: NONE, stroke: gold, strokeWidth: 0.75 }),
      T({ x: 0, y: 80, w: 794, text: 'Programme', fontFamily: 'Brush Script MT', fontSize: 84, color: brown, align: 'center' }),
      T({ x: 0, y: 190, w: 794, text: 'MARIAGE DE AWA & KOFFI', fontSize: 18, bold: true, color: gold, align: 'center', letterSpacing: 5 }),
      T({ x: 0, y: 224, w: 794, text: 'Samedi 12 décembre 2026 · Abidjan', fontFamily: 'Georgia', fontSize: 16, italic: true, color: '#78716c', align: 'center' }),
      S('line', { x: 262, y: 266, w: 110, h: 20, stroke: gold, strokeWidth: 1.5 }),
      S('diamond', { x: 387, y: 266, w: 20, h: 20, fill: gold }),
      S('line', { x: 422, y: 266, w: 110, h: 20, stroke: gold, strokeWidth: 1.5 }),
      S('rect', { x: 289, y: 345, w: 2, h: 590, fill: '#e7d8bf' }),
      ...items.flatMap(([time, title, desc], i) => {
        const y = 330 + i * 115;
        return [
          T({ x: 90, y: y - 2, w: 170, text: time, fontFamily: 'Georgia', fontSize: 26, bold: true, color: brown, align: 'right' }),
          S('ellipse', { x: 282, y: y + 8, w: 16, h: 16, fill: gold }),
          T({ x: 330, y, w: 380, text: title, fontSize: 21, bold: true, color: '#292524' }),
          T({ x: 330, y: y + 32, w: 380, text: desc, fontSize: 15, color: '#78716c', lineHeight: 1.5 }),
        ];
      }),
      T({ x: 0, y: 1010, w: 794, text: 'Merci de partager ce jour avec nous', fontFamily: 'Georgia', fontSize: 20, italic: true, color: brown, align: 'center' }),
    ];
  };

  /* ---------- Billet d'événement ---------- */
  const ticket = () => {
    const violet = '#4c1d95', yellow = '#fde047';
    return L([
      S('ellipse', { x: 760, y: -180, w: 480, h: 480, fill: '#7c3aed', opacity: 0.5 }),
      S('rect', { x: 1120, y: 0, w: 380, h: 560, fill: yellow }),
      ...Array.from({ length: 14 }, (_, i) => S('ellipse', { x: 1114, y: 12 + i * 40, w: 12, h: 12, fill: violet })),
      T({ x: 70, y: 60, w: 700, text: 'BILLET D’ENTRÉE', fontSize: 20, bold: true, color: yellow, letterSpacing: 6 }),
      T({ x: 70, y: 105, w: 980, text: 'Festival\nAbidjan Groove', fontFamily: 'Arial Black', fontSize: 76, color: '#ffffff', lineHeight: 1 }),
      ...[['DATE', 'Sam. 20 déc. 2026', 240], ['HEURE', '18 h 00', 200], ['LIEU', 'Esplanade de la Lagune', 420]].map(([l, v, w], i) => [
        T({ x: [70, 340, 560][i], y: 315, w, text: l, fontSize: 15, bold: true, color: '#c4b5fd', letterSpacing: 3 }),
        T({ x: [70, 340, 560][i], y: 343, w, text: v, fontSize: 24, bold: true, color: '#ffffff' }),
      ]).flat(),
      S('roundrect', { x: 70, y: 440, w: 280, h: 70, radius: 35, fill: yellow }),
      T({ x: 70, y: 461, w: 280, text: 'CATÉGORIE VIP', fontSize: 22, bold: true, color: violet, align: 'center', letterSpacing: 1 }),
      T({ x: 390, y: 453, w: 400, text: '15 000 FCFA', fontSize: 36, bold: true, color: '#ffffff' }),
      T({ x: 1150, y: 55, w: 320, text: 'ADMIS', fontSize: 22, bold: true, color: violet, align: 'center', letterSpacing: 6 }),
      I('qr-code', { x: 1215, y: 105, w: 190, h: 190, color: violet, strokeWidth: 1.5 }),
      T({ x: 1150, y: 325, w: 320, text: 'N° 000482', fontFamily: 'Courier New', fontSize: 30, bold: true, color: violet, align: 'center' }),
      T({ x: 1150, y: 375, w: 320, text: 'Rangée F · Place 12', fontSize: 20, color: '#6b21a8', align: 'center' }),
      T({ x: 1150, y: 470, w: 320, text: 'Billet non remboursable', fontSize: 15, italic: true, color: '#6b21a8', align: 'center' }),
    ]);
  };

  /* ---------- Bon de réduction ---------- */
  const coupon = () => {
    const red = '#dc2626';
    return L([
      S('rect', { x: 0, y: 0, w: 420, h: 600, fill: red }),
      ...Array.from({ length: 15 }, (_, i) => S('ellipse', { x: 414, y: 10 + i * 40, w: 12, h: 12, fill: '#ffffff' })),
      T({ x: 0, y: 205, w: 420, text: '-20 %', fontFamily: 'Arial Black', fontSize: 120, color: '#ffffff', align: 'center' }),
      T({ x: 0, y: 372, w: 420, text: 'DE RÉDUCTION', fontSize: 28, bold: true, color: '#fee2e2', align: 'center', letterSpacing: 6 }),
      T({ x: 480, y: 80, w: 640, text: 'BON D’ACHAT', fontSize: 22, bold: true, color: red, letterSpacing: 6 }),
      T({ x: 480, y: 125, w: 680, text: 'Supermarché\nLe Bon Panier', fontSize: 64, bold: true, color: '#111827', lineHeight: 1.1 }),
      T({ x: 480, y: 300, w: 640, text: 'Valable sur tout le rayon frais du 1er au 30 novembre 2026, dès 10 000 FCFA d’achat.', fontSize: 24, color: '#4b5563', lineHeight: 1.5 }),
      S('roundrect', { x: 480, y: 420, w: 340, h: 80, radius: 12, fill: '#fef2f2', stroke: red, strokeWidth: 3 }),
      T({ x: 480, y: 446, w: 340, text: 'CODE : PANIER20', fontFamily: 'Courier New', fontSize: 26, bold: true, color: red, align: 'center' }),
      I('shopping-cart', { x: 1030, y: 415, w: 90, h: 90, color: red, strokeWidth: 1.75 }),
    ]);
  };

  /* ---------- Post webinaire ---------- */
  const webinar = () => {
    const indigo = '#4f46e5', ink = '#1e1b4b';
    return L([
      S('ellipse', { x: 760, y: -120, w: 440, h: 440, fill: '#c7d2fe', opacity: 0.6 }),
      S('rect', { x: 0, y: 0, w: 1080, h: 14, fill: indigo }),
      S('roundrect', { x: 80, y: 90, w: 320, h: 52, radius: 26, fill: indigo }),
      T({ x: 80, y: 104, w: 320, text: 'WEBINAIRE GRATUIT', fontSize: 20, bold: true, color: '#ffffff', align: 'center', letterSpacing: 3 }),
      T({ x: 80, y: 180, w: 920, text: 'Vendre plus\ngrâce aux\nréseaux sociaux', fontSize: 92, bold: true, color: ink, lineHeight: 1.05 }),
      ...[['calendar', 'Jeudi 5 novembre 2026'], ['clock', '19 h 00 — 20 h 30 (heure d’Abidjan)'], ['video', 'En ligne · lien envoyé après inscription']]
        .flatMap(([ic, txt], i) => [
          I(ic, { x: 80, y: 535 + i * 68, w: 40, h: 40, color: indigo }),
          T({ x: 140, y: 537 + i * 68, w: 860, text: txt, fontSize: 30, bold: i === 0, color: ink }),
        ]),
      S('roundrect', { x: 80, y: 800, w: 560, h: 170, radius: 24, fill: '#ffffff' }),
      S('ellipse', { x: 110, y: 830, w: 110, h: 110, fill: '#c7d2fe' }),
      T({ x: 110, y: 862, w: 110, text: 'AK', fontSize: 40, bold: true, color: indigo, align: 'center' }),
      T({ x: 250, y: 840, w: 370, text: 'Animé par', fontSize: 20, color: '#6366f1' }),
      T({ x: 250, y: 867, w: 370, text: 'Awa Koné', fontSize: 34, bold: true, color: ink }),
      T({ x: 250, y: 913, w: 370, text: 'Consultante e-commerce', fontSize: 20, color: '#64748b' }),
      S('roundrect', { x: 680, y: 840, w: 320, h: 90, radius: 45, fill: indigo }),
      T({ x: 680, y: 865, w: 320, text: 'Je m’inscris', fontSize: 32, bold: true, color: '#ffffff', align: 'center' }),
    ]);
  };

  /* ---------- Présentation 5 pages (16:9) ---------- */
  const NAVY = '#0b1f3a', TEAL = '#14b8a6', AMBER = '#f59e0b';
  const slideTitle = () => L([
    S('ellipse', { x: 1250, y: -320, w: 1000, h: 1000, fill: TEAL, opacity: 0.18 }),
    S('ellipse', { x: 1380, y: 640, w: 640, h: 640, fill: AMBER }),
    T({ x: 140, y: 290, w: 1100, text: 'RAPPORT ANNUEL 2026', fontSize: 32, bold: true, color: TEAL, letterSpacing: 8 }),
    T({ x: 140, y: 360, w: 1100, text: 'Grandir\nensemble', fontSize: 140, bold: true, color: '#ffffff', lineHeight: 1.02 }),
    T({ x: 140, y: 690, w: 1100, text: 'Bilan, résultats et perspectives', fontSize: 46, color: '#cbd5e1' }),
    S('line', { x: 140, y: 850, w: 120, h: 20, stroke: TEAL, strokeWidth: 6 }),
    T({ x: 140, y: 900, w: 1100, text: 'Présenté par Aya Kouassi · Directrice générale', fontSize: 28, color: '#94a3b8' }),
  ]);
  const slideAgenda = () => [
    S('rect', { x: 0, y: 0, w: 620, h: 1080, fill: NAVY }),
    T({ x: 120, y: 380, w: 470, text: 'Au\nprogramme', fontSize: 76, bold: true, color: '#ffffff', lineHeight: 1.05 }),
    S('line', { x: 120, y: 590, w: 120, h: 20, stroke: TEAL, strokeWidth: 8 }),
    ...[['L’année en bref', 'Les faits marquants de 2026'], ['Nos résultats', 'Chiffres clés et performance'],
      ['Nos équipes', 'Recrutement, formation et engagement'], ['Perspectives 2027', 'Priorités et nouveaux marchés']]
      .flatMap(([t, d], i) => {
        const y = 215 + i * 190;
        return [
          T({ x: 760, y, w: 130, text: '0' + (i + 1), fontSize: 64, bold: true, color: TEAL }),
          T({ x: 900, y: y + 2, w: 880, text: t, fontSize: 46, bold: true, color: NAVY }),
          T({ x: 900, y: y + 64, w: 880, text: d, fontSize: 28, color: '#64748b' }),
          i < 3 && S('line', { x: 760, y: y + 140, w: 1020, h: 20, stroke: '#e2e8f0', strokeWidth: 2 }),
        ];
      }).filter(Boolean),
  ];
  const slideContent = () => L([
    T({ x: 140, y: 120, w: 1000, text: 'L’ANNÉE EN BREF', fontSize: 26, bold: true, color: TEAL, letterSpacing: 6 }),
    T({ x: 140, y: 170, w: 1100, text: 'Une année de croissance\net d’ouverture', fontSize: 68, bold: true, color: NAVY, lineHeight: 1.1 }),
    T({ x: 140, y: 400, w: 780, text: 'En 2026, nous avons ouvert deux nouvelles agences à Bouaké et San-Pédro, lancé notre application mobile et accompagné plus de 12 000 clients dans leurs projets.', fontSize: 30, color: '#334155', lineHeight: 1.6 }),
    ...['Deux nouvelles agences régionales', 'Lancement de l’application mobile', '35 nouveaux collaborateurs'].flatMap((t, i) => [
      I('circle-check', { x: 140, y: 680 + i * 80, w: 44, h: 44, color: TEAL }),
      T({ x: 205, y: 682 + i * 80, w: 720, text: t, fontSize: 32, bold: true, color: NAVY }),
    ]),
    S('roundrect', { x: 1080, y: 400, w: 700, h: 520, radius: 36, fill: '#e6fffa' }),
    T({ x: 1140, y: 440, w: 600, text: 'Clients accompagnés (milliers)', fontSize: 24, bold: true, color: '#0f766e' }),
    ...[3.1, 4.6, 6.2, 8.9, 12].flatMap((v, i) => [
      S('roundrect', { x: 1170 + i * 120, y: 840 - v * 26, w: 70, h: v * 26, radius: 8, fill: i === 4 ? AMBER : TEAL }),
      T({ x: 1155 + i * 120, y: 852, w: 100, text: String(2022 + i), fontSize: 20, color: '#475569', align: 'center' }),
    ]),
  ]);
  const slideFigures = () => {
    const figs = [['users', '12 000', 'clients\naccompagnés'], ['trending-up', '+38 %', 'de chiffre\nd’affaires'],
      ['banknote', '2,4 Mds', 'FCFA de crédits\noctroyés'], ['smile', '96 %', 'de clients\nsatisfaits']];
    return L([
      T({ x: 140, y: 120, w: 1000, text: 'CHIFFRES CLÉS', fontSize: 26, bold: true, color: TEAL, letterSpacing: 6 }),
      T({ x: 140, y: 170, w: 1400, text: 'Nos résultats 2026', fontSize: 72, bold: true, color: '#ffffff' }),
      ...figs.flatMap(([ic, n, l], i) => {
        const x = 140 + i * 420;
        return [
          S('roundrect', { x, y: 380, w: 380, h: 440, radius: 28, fill: '#13294b' }),
          I(ic, { x: x + 40, y: 425, w: 60, h: 60, color: AMBER }),
          T({ x: x + 40, y: 530, w: 320, text: n, fontSize: 76, bold: true, color: '#ffffff' }),
          T({ x: x + 40, y: 650, w: 320, text: l, fontSize: 28, color: '#cbd5e1', lineHeight: 1.4 }),
        ];
      }),
      T({ x: 140, y: 920, w: 1400, text: 'Source : rapport financier interne, décembre 2026', fontSize: 22, color: '#64748b' }),
    ]);
  };
  const slideThanks = () => L([
    S('ellipse', { x: -200, y: -260, w: 700, h: 700, fill: TEAL, opacity: 0.2 }),
    S('ellipse', { x: 1520, y: 760, w: 560, h: 560, fill: AMBER, opacity: 0.9 }),
    T({ x: 0, y: 270, w: 1920, text: 'Merci !', fontFamily: 'Arial Black', fontSize: 200, color: '#ffffff', align: 'center' }),
    T({ x: 0, y: 560, w: 1920, text: 'Des questions ? Échangeons.', fontSize: 48, color: '#99f6e4', align: 'center' }),
    ...[['mail', 'contact@lagune-finance.ci'], ['phone', '+225 27 22 00 00 00'], ['globe', 'www.lagune-finance.ci']].flatMap(([ic, t], i) => {
      const x = 260 + i * 480;
      return [
        I(ic, { x: x + 182, y: 740, w: 56, h: 56, color: TEAL }),
        T({ x, y: 820, w: 420, text: t, fontSize: 28, color: '#e2e8f0', align: 'center' }),
      ];
    }),
  ]);

  /* ---------- enregistrement ---------- */
  G.TEMPLATES.push(
    { name: 'Post recrutement', category: 'Réseaux sociaux', w: 1080, h: 1080, bg: solid('#0f172a'), elements: hiring },
    { name: 'Produit e-commerce', category: 'Réseaux sociaux', w: 1080, h: 1080, bg: solid('#fff7ed'), elements: product },
    { name: 'Story témoignage client', category: 'Réseaux sociaux', w: 1080, h: 1920, bg: solid('#f0fdfa'), elements: testimonial },
    { name: 'Webinaire', category: 'Réseaux sociaux', w: 1080, h: 1080, bg: solid('#eef2ff'), elements: webinar },
    { name: 'Bannière LinkedIn', category: 'Réseaux sociaux', w: 1584, h: 396, bg: grad('#1e3a8a', '#0f172a', 90), elements: linkedin },
    {
      name: 'Rapport annuel (5 diapos)', category: 'Présentations', w: 1920, h: 1080,
      pages: [slideTitle, slideAgenda, slideContent, slideFigures, slideThanks],
      bgs: [solid(NAVY), solid('#f8fafc'), solid('#ffffff'), solid(NAVY), grad(NAVY, '#134e4a', 135)],
    },
    { name: 'CV moderne', category: 'Documents', w: 794, h: 1123, bg: solid('#ffffff'), elements: cv },
    { name: 'Certificat de réussite', category: 'Documents', w: 1123, h: 794, bg: solid('#fffdf7'), elements: certificate },
    { name: 'Lettre à en-tête', category: 'Documents', w: 794, h: 1123, bg: solid('#ffffff'), elements: letter },
    { name: 'Facture', category: 'Business', w: 794, h: 1123, bg: solid('#ffffff'), elements: invoice },
    { name: 'Infographie 3 étapes', category: 'Business', w: 1080, h: 1350, bg: solid('#f8fafc'), elements: steps },
    { name: 'Logo monogramme', category: 'Business', w: 500, h: 500, bg: solid('#ffffff'), elements: logo1 },
    { name: 'Logo nature', category: 'Business', w: 500, h: 500, bg: solid('#f0fdf4'), elements: logo2 },
    { name: 'Logo studio', category: 'Business', w: 500, h: 500, bg: solid('#111827'), elements: logo3 },
    { name: 'Flyer immobilier', category: 'Impression', w: 559, h: 794, bg: solid('#ffffff'), elements: realEstate },
    { name: 'Billet d’événement', category: 'Impression', w: 1500, h: 560, bg: solid('#4c1d95'), elements: ticket },
    { name: 'Bon de réduction', category: 'Impression', w: 1200, h: 600, bg: solid('#ffffff'), elements: coupon },
    { name: 'Affiche conférence', category: 'Événements', w: 1123, h: 1587, bg: solid('#0b1120'), elements: conference },
    { name: 'Faire-part naissance', category: 'Événements', w: 1080, h: 1350, bg: solid('#fff7ed'), elements: birth },
    { name: 'Carte de vœux', category: 'Événements', w: 1080, h: 1080, bg: grad('#064e3b', '#022c22', 180), elements: greetings },
    { name: 'Programme de cérémonie', category: 'Événements', w: 794, h: 1123, bg: solid('#fffbf5'), elements: ceremony },
  );
})();
