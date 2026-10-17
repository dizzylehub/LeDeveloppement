# GBAKI

GBAKI est un éditeur graphique en ligne, inspiré de Canva mais écrit de zéro (aucun code de Canva n'est repris).
Il fonctionne **entièrement dans le navigateur, sans serveur ni connexion internet**.

## Utilisation rapide

1. Téléchargez le fichier [`dist/gbaki.html`](dist/gbaki.html).
2. Double-cliquez dessus : il s'ouvre dans Chrome, Edge ou Firefox.

C'est tout. Le fichier est autonome : vous pouvez le copier sur une clé USB, le mettre sur un poste de bureau ou l'héberger sur n'importe quel site statique.

## Fonctionnalités

- **Formats prêts à l'emploi** : Instagram (post, story), présentation 16:9, A4, A3, A5, couverture Facebook, miniature YouTube, carte de visite, logo, taille personnalisée. **Redimensionner** un design vers un autre format, en copie ou sur place.
- **30 modèles originaux**, classés par catégorie (réseaux sociaux, présentations, documents, impression, événements, business), dont une présentation de 5 diapositives, un CV, une facture, un certificat, des logos…
- **Texte** : polices de l'ordinateur, 20 polices web (si internet), **import de vos propres polices** (TTF/OTF/WOFF) ; gras, italique, souligné, majuscules, listes à puces / numérotées, justification, interligne, espacement.
- **Effets de texte** : ombre, décalé, contour, creux, néon, surligné, **texte en arc**.
- **Photos** : filtres (noir et blanc, vintage, vif…), réglages (luminosité, contraste, saturation, teinte, flou…), recadrage, miroir, **formes de découpe** (cercle, cœur, étoile…), bordure, ombre, **retrait du fond uni**, image en arrière-plan, **cadres photo** à remplir.
- **Éléments** : 20 formes avec dégradé et ombre, lignes (tirets, pointillés, flèches), **331 icônes** avec recherche en français, **473 emojis**, **graphiques** (barres, colonnes, courbes, aires, camembert, anneau), **tableaux**, **QR codes**, **dessin à main levée** (stylo, marqueur, surligneur).
- **Mise en page** : guides magnétiques, grille, groupes, sélection multiple et redimensionnement de groupe, alignement et répartition, position au pixel, calques (masquer, verrouiller, réordonner), copier / coller le style.
- **Couleurs** : sélecteur avec couleurs du document, **kit de marque** (couleurs et polices réutilisables) et **harmonies** qui recolorent tout le design en un clic.
- **Multi-pages**, titre de page, **mode présentation plein écran**.
- **Annuler / rétablir** et enregistrement automatique dans le navigateur.
- **Export** : PNG (fond transparent possible), JPG, PDF multipage (×1, ×2, ×3) et projet `.gbaki` modifiable.

## Raccourcis clavier

| Raccourci | Action |
| --- | --- |
| Ctrl+Z / Ctrl+Y | Annuler / rétablir |
| Ctrl+C / Ctrl+V / Ctrl+X | Copier / coller / couper |
| Ctrl+D | Dupliquer |
| Ctrl+G / Ctrl+Maj+G | Grouper / dissocier |
| Ctrl+Alt+C / Ctrl+Alt+V | Copier / coller le style |
| Ctrl+Alt+P | Présenter |
| T, R, C, L, D | Texte, rectangle, cercle, ligne, dessin |
| ? | Liste des raccourcis |
| Ctrl+A | Tout sélectionner sur la page |
| Suppr | Supprimer |
| Flèches (Maj = ×10) | Déplacer finement |
| Entrée | Modifier le texte sélectionné |
| Ctrl + molette, Ctrl +/−, Ctrl+0 | Zoom / ajuster |
| Maj pendant une rotation | Pas de 15° |
| Alt pendant un déplacement | Désactiver le magnétisme |

## Où sont enregistrés mes designs ?

Dans le stockage local du navigateur (IndexedDB), sur l'ordinateur utilisé. Rien n'est envoyé sur internet.
Pour changer d'ordinateur ou de navigateur, utilisez **Enregistrer .gbaki**, puis **Ouvrir un fichier .gbaki** depuis l'accueil.

## Développement

Le code source se trouve dans `app/` (HTML, CSS et JavaScript, sans dépendance). Vous pouvez ouvrir `app/index.html` directement.
Pour régénérer le fichier autonome :

```bash
node scripts/build.mjs   # produit dist/gbaki.html
```

Les modules (icônes, emojis, graphiques, tableaux, QR codes, modèles) se branchent via les points d'extension décrits dans [`docs/EXTENSIONS.md`](docs/EXTENSIONS.md).

## Licences

Code GBAKI : écrit spécifiquement pour ce projet, aucun code de Canva. Icônes : [Lucide](https://lucide.dev) (licence ISC, voir `LICENSES/lucide-ISC.txt`).
