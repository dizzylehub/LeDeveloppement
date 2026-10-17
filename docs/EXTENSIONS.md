# GBAKI — modules d'extension

GBAKI est écrit en JavaScript « classique » (pas de modules ES, pas de dépendance, pas de build obligatoire) pour
fonctionner en ouvrant simplement un fichier HTML (`file://`), hors ligne. Chaque module est un fichier
`app/js/<nom>.js` enveloppé dans une IIFE qui lit `const G = window.GBAKI;`.

Ordre de chargement (voir `app/index.html`) : `model.js`, `render.js`, `templates.js`, `export.js`, **modules**,
`editor.js`, `home.js`, `main.js`. Les modules sont donc chargés après le modèle et le rendu, mais avant l'éditeur.

## Types d'éléments personnalisés : `G.TYPES`

```js
G.TYPES.monType = {
  label: 'Nom affiché',            // dans le panneau Calques
  keepRatio: false,                // true : les poignées d'angle gardent les proportions
  svg(el, design) { return '<svg xmlns="http://www.w3.org/2000/svg" width="..." height="..." viewBox="...">…</svg>'; },
  controls(el, ui) { return [/* nœuds DOM pour la barre contextuelle */]; },
};
```

- Un élément est un objet JSON : `Object.assign(G.base(), { type: 'monType', w, h, ...propriétésPropres })`.
  `G.base()` fournit `id, x, y, w, h, rotation, opacity, locked, hidden`.
- `svg(el)` doit renvoyer **un SVG complet et autonome** (avec `xmlns`), de taille `el.w × el.h` en pixels du design.
  Il est utilisé tel quel pour l'affichage *et* pour l'export PNG/JPG/PDF (dessiné sur un canvas via une image
  `data:image/svg+xml`). Donc : pas de `<foreignObject>`, pas d'images externes, pas de polices web — seulement des
  polices système (`Arial`, `Georgia`, …). Échapper le texte utilisateur avec `G.esc(str)`.
- Le SVG doit être purement fonction de `el` (pas d'état caché), car l'élément est re-rendu à chaque modification.
- `controls(el, ui)` construit les réglages affichés dans la barre contextuelle quand l'élément est seul sélectionné.
  L'objet `ui` fournit :
  - `ui.h(tag, attrs, ...children)` — création DOM (`onclick`, `class`, `style`, `html`…)
  - `ui.field(label, ...nœuds)` — libellé + contrôle
  - `ui.color(valeur, (v) => …)` — sélecteur de couleur (l'appel est « en direct », la validation est automatique)
  - `ui.number(valeur, min, max, pas, (v) => …, largeur?)` — champ numérique
  - `ui.text(valeur, (v) => …, largeur?)` — champ texte d'une ligne
  - `ui.select(valeur, [[val, libellé], …], (v) => …)` — liste déroulante
  - `ui.toggle(libellé, titre, actif, () => …)` — bouton bascule
  - `ui.button(libellé, titre, () => …)` — bouton
  - `ui.live(fn)` — applique `fn(el)` à l'élément sélectionné et rafraîchit l'affichage (sans historique)
  - `ui.commit()` — enregistre l'état dans l'historique (annuler/rétablir) et sauvegarde
  - `ui.prompt(titre, valeurInitiale, (texte) => …, { multiline })` — boîte de saisie modale (texte long, données…)
  Les callbacks de `color/number/text/select` reçoivent la valeur ; utilisez-les ainsi :
  `ui.number(el.size, 1, 100, 1, (v) => ui.live((x) => (x.size = v)))`. `select`, `toggle` et `button` doivent appeler
  `ui.commit()` eux-mêmes après leur modification ; `color/number/text` sont validés automatiquement à la fin de la saisie.

## Onglets du panneau latéral : `G.PANELS`

```js
G.PANELS.push({
  id: 'icones', label: 'Icônes',
  icon: '<path d="…"/>',            // contenu SVG 24×24, tracé avec stroke="currentColor"
  after: 'elements',                // l'onglet est inséré après cet onglet existant (facultatif)
  build(container, api) { … },      // remplit le panneau
});
```

`api` fournit : `api.h`, `api.add(element)` (ajoute au centre de la page et sélectionne), `api.W()`, `api.H()`
(taille du design), `api.k()` (facteur d'échelle ≈ min(W,H)/1080 pour dimensionner), `api.design`,
`api.applyPage(page)` (remplace la page courante, pour les modèles), `api.rebuild()` (reconstruit le panneau).

## Sections dans l'onglet « Éléments » : `G.ELEMENT_SECTIONS`

```js
G.ELEMENT_SECTIONS.push({ title: 'Graphiques', build(container, api) { … } });
```

Même `api` que ci-dessus.

## Modèles : `G.TEMPLATES`

Ajouter des objets `{ name, category, w, h, bg, elements: () => [...] }` (voir `templates.js`). `bg` vaut
`{ type: 'solid', color }` ou `{ type: 'gradient', color, color2, angle }`. Les éléments sont créés avec
`G.makeText`, `G.makeShape`, ou `Object.assign(G.base(), {...})` pour les types personnalisés.
Un modèle peut avoir plusieurs pages : `pages: [() => [...], () => [...]]` avec `bgs: [bg1, bg2]` au lieu de
`elements`/`bg`.
