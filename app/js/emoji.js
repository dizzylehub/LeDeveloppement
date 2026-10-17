/* GBAKI — panneau « Emojis » : sélecteur classé par catégories, recherche en français. */
(function () {
  const G = window.GBAKI;

  // Chaque entrée : « emoji mots-clés… » (les mots-clés servent à la recherche)
  const CATS = [
    ['Smileys', [
      '😀 sourire heureux content', '😃 sourire joie', '😄 rire sourire', '😁 sourire dents', '😆 rire mdr',
      '😅 gêne sueur rire', '🤣 mort de rire mdr', '😂 larmes de joie rire mdr', '🙂 sourire léger', '😉 clin d’œil',
      '😊 timide content', '😇 ange innocent', '🥰 amoureux cœurs', '😍 amour yeux cœur', '🤩 étoiles waouh',
      '😘 bisou baiser', '😋 miam délicieux', '😛 langue', '😜 farceur langue', '🤪 fou délire',
      '🤑 argent riche', '🤗 câlin accueil', '🤭 oups main bouche', '🤫 chut silence secret', '🤔 réfléchir pensif',
      '😐 neutre', '😑 blasé', '😶 sans voix', '😏 malin narquois', '😒 agacé',
      '🙄 lever les yeux', '😬 grimace gêne', '😌 soulagé serein', '😔 pensif triste', '😪 fatigué sommeil',
      '😴 dormir sommeil', '😷 masque malade', '🤒 fièvre malade', '🤧 rhume éternuer', '🥵 chaud chaleur',
      '🥶 froid gelé', '😵 étourdi', '🤯 choqué explosion', '🤠 cowboy', '🥳 fête anniversaire',
      '😎 cool lunettes', '🤓 intello geek', '🧐 monocle examiner', '😕 confus', '😟 inquiet',
      '😮 surpris étonné', '😲 stupéfait', '😳 rougir gêné', '🥺 supplier mignon', '😢 pleurer triste',
      '😭 sanglots pleurs', '😱 peur cri', '😤 frustré', '😡 colère fâché', '🤬 injures colère',
      '😈 diable coquin', '💀 crâne mort', '💩 caca', '🤡 clown', '👻 fantôme',
      '👽 extraterrestre alien', '🤖 robot', '😺 chat sourire', '😻 chat amoureux', '🙈 singe ne pas voir',
    ]],
    ['Gestes', [
      '👋 salut bonjour coucou main', '🤚 main levée', '✋ stop main', '🖖 salut vulcain', '👌 ok parfait',
      '🤌 italien doigts', '✌️ victoire paix', '🤞 croiser les doigts chance', '🤟 je t’aime', '🤘 rock',
      '🤙 appelle-moi', '👈 gauche doigt', '👉 droite doigt', '👆 haut doigt', '👇 bas doigt',
      '☝️ index attention', '👍 pouce j’aime bien ok', '👎 pouce bas pas bien', '✊ poing', '👊 coup de poing check',
      '👏 applaudir bravo', '🙌 hourra célébrer', '👐 mains ouvertes', '🤲 paumes prière', '🤝 poignée de main accord',
      '🙏 merci prière svp', '✍️ écrire', '💪 muscle force', '🫶 mains cœur amour', '💅 vernis ongles',
    ]],
    ['Personnes', [
      '👶 bébé naissance', '🧒 enfant', '👦 garçon', '👧 fille', '🧑 personne adulte',
      '👨 homme', '👩 femme', '🧓 aîné', '👴 grand-père papi', '👵 grand-mère mamie',
      '👨🏾 homme africain', '👩🏾 femme africaine', '👩🏾‍🦱 femme cheveux bouclés', '👨🏿‍🦲 homme chauve', '🧕🏾 femme voile',
      '👨🏾‍💼 homme d’affaires bureau', '👩🏾‍💼 femme d’affaires bureau', '👩🏾‍🏫 enseignante professeure', '👨🏾‍🏫 enseignant professeur', '👩🏾‍⚕️ médecin docteure santé',
      '👨🏾‍⚕️ médecin docteur santé', '👩🏾‍🍳 cuisinière cheffe', '👨🏾‍🍳 cuisinier chef', '👩🏾‍🎓 diplômée étudiante', '👨🏾‍🎓 diplômé étudiant',
      '👩🏾‍💻 informaticienne développeuse', '👨🏾‍💻 informaticien développeur', '👷🏾 ouvrier chantier', '👮🏾 policier', '👩🏾‍🌾 agricultrice cultivatrice',
      '🧑🏾‍🎨 artiste peintre', '🤵🏾 marié costume', '👰🏾 mariée', '🤰🏾 enceinte grossesse', '🙋🏾 lever la main',
      '💃🏾 danse danseuse', '🕺🏾 danse danseur', '🏃🏾 courir course', '🚶🏾 marcher', '🧘🏾 yoga méditation',
      '👪 famille', '👫 couple', '💑 couple amour', '🗣️ parler', '👥 groupe personnes',
    ]],
    ['Animaux', [
      '🐶 chien', '🐱 chat', '🐭 souris', '🐰 lapin', '🦊 renard', '🐻 ours', '🐼 panda', '🐨 koala',
      '🐯 tigre', '🦁 lion', '🐮 vache', '🐷 cochon', '🐸 grenouille', '🐵 singe', '🐔 poule', '🐧 pingouin',
      '🐦 oiseau', '🦅 aigle', '🦉 hibou', '🐝 abeille', '🦋 papillon', '🐌 escargot', '🐢 tortue', '🐍 serpent',
      '🐊 crocodile', '🐘 éléphant', '🦒 girafe', '🦓 zèbre', '🦏 rhinocéros', '🦛 hippopotame', '🐪 chameau', '🐐 chèvre',
      '🐑 mouton', '🐟 poisson', '🐠 poisson tropical', '🐬 dauphin', '🐳 baleine', '🦀 crabe', '🦜 perroquet', '🐾 pattes',
    ]],
    ['Nourriture', [
      '🍎 pomme', '🍊 orange', '🍋 citron', '🍌 banane plantain', '🍉 pastèque', '🍇 raisin', '🍓 fraise', '🍍 ananas',
      '🥭 mangue', '🥥 noix de coco', '🥑 avocat', '🍅 tomate', '🌶️ piment', '🧅 oignon', '🥕 carotte', '🌽 maïs',
      '🥜 arachide cacahuète', '🍞 pain', '🥖 baguette', '🥐 croissant', '🧀 fromage', '🥚 œuf', '🍳 omelette poêle', '🍗 poulet cuisse',
      '🍖 viande', '🍔 burger', '🍟 frites', '🍕 pizza', '🥪 sandwich', '🌮 tacos', '🍝 spaghetti pâtes', '🍜 soupe nouilles',
      '🍲 marmite ragoût sauce', '🍛 riz curry', '🍚 riz', '🍤 crevette', '🍦 glace', '🍩 beignet donut', '🍪 biscuit', '🎂 gâteau anniversaire',
      '🍰 part gâteau', '🍫 chocolat cacao', '🍬 bonbon', '🍯 miel', '☕ café', '🍵 thé', '🧃 jus', '🥤 boisson soda',
      '🍺 bière', '🍷 vin', '🥂 trinquer champagne', '🍾 champagne fête', '🍽️ assiette repas restaurant', '🥄 cuillère',
    ]],
    ['Voyage', [
      '🚗 voiture', '🚕 taxi', '🚌 bus', '🚐 minibus gbaka', '🚚 camion livraison', '🏍️ moto', '🚲 vélo', '🛵 scooter',
      '🚆 train', '✈️ avion voyage', '🛫 décollage départ', '🚀 fusée', '🚢 bateau navire', '⛵ voilier', '🛶 pirogue canoë', '⚓ ancre',
      '⛽ essence station', '🚦 feu tricolore', '🗺️ carte', '🧭 boussole', '🏖️ plage vacances', '🏝️ île', '⛰️ montagne', '🌋 volcan',
      '🏠 maison', '🏡 maison jardin', '🏢 immeuble bureau', '🏥 hôpital', '🏦 banque', '🏨 hôtel', '🏫 école', '🏭 usine',
      '⛪ église', '🕌 mosquée', '🏟️ stade', '🌍 afrique terre monde', '🌅 lever de soleil', '🌃 nuit ville', '🧳 valise bagage', '🎫 ticket billet',
    ]],
    ['Objets', [
      '⌚ montre', '📱 téléphone portable smartphone', '💻 ordinateur portable', '🖥️ ordinateur écran', '🖨️ imprimante', '📷 appareil photo', '🎥 caméra vidéo', '📺 télévision',
      '📻 radio', '🎙️ micro podcast', '⏰ réveil heure', '⌛ sablier', '💡 ampoule idée', '🔦 lampe torche', '🕯️ bougie', '🔋 batterie',
      '💰 sac argent', '💵 billet argent', '💳 carte bancaire', '💎 diamant bijou', '⚖️ balance justice', '🔧 clé outil', '🔨 marteau', '🛠️ outils',
      '🔑 clé', '🔒 cadenas', '🚪 porte', '🛏️ lit', '🛋️ canapé', '🎁 cadeau', '🎈 ballon fête', '🎉 fête confettis',
      '🎊 confettis', '🎀 ruban nœud', '🏆 trophée coupe', '🏅 médaille', '⚽ football ballon', '🏀 basket', '🎮 jeu manette', '🎨 palette art peinture',
      '🎵 musique note', '🎤 micro chanter', '🎧 casque musique', '🥁 tambour djembé', '🎸 guitare', '📚 livres', '📖 livre ouvert', '✏️ crayon',
      '🖊️ stylo', '📝 note mémo', '📌 punaise', '📎 trombone', '✂️ ciseaux', '📅 calendrier date', '📈 hausse graphique', '📉 baisse graphique',
      '📊 statistiques graphique', '📋 presse-papiers', '📁 dossier', '📦 colis paquet', '✉️ enveloppe lettre courrier', '📧 email courriel', '📞 téléphone appel', '🛒 panier caddie',
      '💊 médicament', '💉 seringue vaccin', '🩺 stéthoscope', '🧹 balai', '🧼 savon', '🪑 chaise', '👗 robe', '👔 chemise cravate',
      '👟 basket chaussure', '👠 talon chaussure', '👜 sac à main', '🎓 diplôme toque', '👑 couronne', '💍 bague alliance mariage',
    ]],
    ['Symboles', [
      '❤️ cœur rouge amour', '🧡 cœur orange', '💛 cœur jaune', '💚 cœur vert', '💙 cœur bleu', '💜 cœur violet', '🖤 cœur noir', '🤍 cœur blanc',
      '💔 cœur brisé', '💕 cœurs', '💖 cœur brillant', '💯 cent pour cent parfait', '✨ étincelles brillant', '⭐ étoile', '🌟 étoile brillante', '🔥 feu flamme top',
      '⚡ éclair énergie', '💥 boum explosion', '💫 vertige étoile', '💬 bulle message', '💭 pensée', '✅ validé coche ok', '☑️ case cochée', '✔️ coche',
      '❌ croix non erreur', '❗ exclamation important', '❓ question', '⚠️ attention danger', '🚫 interdit', '⛔ sens interdit', '♻️ recyclage', '➕ plus',
      '➖ moins', '➡️ flèche droite', '⬅️ flèche gauche', '⬆️ flèche haut', '⬇️ flèche bas', '↗️ flèche diagonale', '🔄 actualiser', '🔝 top',
      '🆕 nouveau', '🆓 gratuit', '🆗 ok', '🆙 up', '💲 dollar prix', '©️ copyright', '®️ marque déposée', '™️ marque',
      '#️⃣ dièse hashtag', '🔴 rond rouge', '🟠 rond orange', '🟡 rond jaune', '🟢 rond vert', '🔵 rond bleu', '🟣 rond violet', '⚫ rond noir',
      '☀️ soleil', '🌙 lune', '☁️ nuage', '🌧️ pluie', '⛈️ orage', '🌈 arc-en-ciel', '❄️ neige flocon', '💧 goutte eau',
      '🌸 fleur cerisier', '🌺 hibiscus fleur', '🌻 tournesol', '🌹 rose', '🌴 palmier cocotier', '🌳 arbre', '🍀 trèfle chance', '🌱 pousse plante',
    ]],
    ['Drapeaux', [
      '🇨🇮 côte d’ivoire ivoirien', '🇸🇳 sénégal', '🇨🇲 cameroun', '🇲🇱 mali', '🇧🇫 burkina faso', '🇬🇳 guinée', '🇧🇯 bénin', '🇹🇬 togo',
      '🇳🇬 nigeria', '🇬🇭 ghana', '🇳🇪 niger', '🇬🇦 gabon', '🇨🇬 congo', '🇨🇩 rd congo', '🇲🇦 maroc', '🇩🇿 algérie',
      '🇹🇳 tunisie', '🇪🇬 égypte', '🇿🇦 afrique du sud', '🇰🇪 kenya', '🇪🇹 éthiopie', '🇷🇼 rwanda', '🇲🇬 madagascar', '🇱🇷 liberia',
      '🇸🇱 sierra leone', '🇬🇲 gambie', '🇲🇷 mauritanie', '🇹🇩 tchad', '🇫🇷 france', '🇧🇪 belgique', '🇨🇭 suisse', '🇨🇦 canada',
      '🇺🇸 états-unis usa', '🇬🇧 royaume-uni angleterre', '🇩🇪 allemagne', '🇪🇸 espagne', '🇮🇹 italie', '🇵🇹 portugal', '🇧🇷 brésil', '🇨🇳 chine',
      '🇪🇺 union européenne', '🏳️ drapeau blanc', '🏁 drapeau damier arrivée', '🚩 drapeau rouge',
    ]],
  ];

  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const split = (item) => {
    const i = item.indexOf(' ');
    return i < 0 ? [item, ''] : [item.slice(0, i), item.slice(i + 1)];
  };
  G.EMOJI_CATEGORIES = CATS.map(([title, items]) => ({ title, items: items.map(split) }));
  const all = [];
  for (const c of G.EMOJI_CATEGORIES) for (const [e, k] of c.items) all.push([e, k, norm(k + ' ' + c.title)]);

  const CSS = `
.gk-search { width: 100%; border: 1px solid var(--line, #e5e7eb); border-radius: 8px; padding: 8px 10px; margin: 6px 0 10px; background: #fff; }
.gk-search:focus { outline: 2px solid #c4b5fd; border-color: #7c3aed; }
.gk-emoji-cats { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.gk-emoji-cats button { border: 1px solid var(--line, #e5e7eb); background: #fff; border-radius: 999px; padding: 3px 9px; font-size: 12px; }
.gk-emoji-cats button.on, .gk-emoji-cats button:hover { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }
.gk-emoji-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; }
.gk-emoji-btn { aspect-ratio: 1; border: 0; background: transparent; border-radius: 8px; font-size: 26px; line-height: 1; padding: 0;
  font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif; }
.gk-emoji-btn:hover { background: #f3f4f6; transform: scale(1.12); }
`;
  const injectCss = (id, css) => {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  };

  // Crée l'élément texte d'un emoji, dimensionné pour tenir sur une ligne
  G.makeEmoji = (emoji, k) => {
    const fontSize = Math.round(160 * (k || 1));
    return G.makeText({ text: emoji, fontSize, w: Math.round(fontSize * 1.5), h: Math.round(fontSize * 1.25), align: 'center', lineHeight: 1.15 });
  };

  G.PANELS.push({
    id: 'emoji',
    label: 'Emojis',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
    after: 'icons',
    build(container, api) {
      injectCss('gk-emoji-css', CSS);
      const h = api.h;
      const body = h('div');
      let cat = null; // null : toutes les catégories
      const btn = (e, k) => h('button', {
        class: 'gk-emoji-btn', title: k.split(' ')[0] || e,
        onclick: () => api.add(G.makeEmoji(e, api.k())),
      }, e);
      const show = (q) => {
        body.innerHTML = '';
        const words = norm(q).trim().split(/\s+/).filter(Boolean);
        if (words.length) {
          const found = all.filter(([, , t]) => words.every((w) => t.includes(w)));
          const grid = h('div', { class: 'gk-emoji-grid' }, ...found.map(([e, k]) => btn(e, k)));
          body.append(found.length ? grid : h('p', { class: 'muted small' }, 'Aucun emoji trouvé.'));
          return;
        }
        for (const c of G.EMOJI_CATEGORIES) {
          if (cat && cat !== c.title) continue;
          body.append(h('h4', {}, c.title), h('div', { class: 'gk-emoji-grid' }, ...c.items.map(([e, k]) => btn(e, k))));
        }
      };
      const input = h('input', { class: 'gk-search', type: 'search', placeholder: 'Rechercher : cœur, fête, drapeau…' });
      input.addEventListener('input', () => show(input.value));
      const cats = h('div', { class: 'gk-emoji-cats' });
      const chips = [['Tous', null], ...G.EMOJI_CATEGORIES.map((c) => [c.title, c.title])].map(([label, val]) => {
        const b = h('button', { class: val === cat ? 'on' : '', onclick: () => {
          cat = val;
          chips.forEach((x) => x.classList.toggle('on', x === b));
          input.value = '';
          show('');
        } }, label);
        return b;
      });
      cats.append(...chips);
      container.append(h('h3', {}, 'Emojis'), input, cats, body);
      show('');
    },
  });
})();
