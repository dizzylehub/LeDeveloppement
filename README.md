# GBAKI

GBAKI est un éditeur graphique en ligne, inspiré de Canva mais écrit de zéro (aucun code de Canva n'est repris).
Il fonctionne **entièrement dans le navigateur, sans serveur ni connexion internet**.

## Utilisation rapide

1. Téléchargez le fichier [`dist/gbaki.html`](dist/gbaki.html).
2. Double-cliquez dessus : il s'ouvre dans Chrome, Edge ou Firefox.

C'est tout. Le fichier est autonome : vous pouvez le copier sur une clé USB, le mettre sur un poste de bureau ou l'héberger sur n'importe quel site statique.

## Fonctionnalités

- **Formats prêts à l'emploi** : Instagram (post, story), présentation 16:9, A4, A3, A5, couverture Facebook, miniature YouTube, carte de visite, logo, taille personnalisée.
- **9 modèles originaux** : promo, citation, événement, présentation, carte de visite, affiche de concert, menu, miniature YouTube, invitation.
- **Texte** : polices, taille, couleur, gras, italique, souligné, alignement, interligne, espacement. Double-clic pour modifier.
- **Formes** : rectangle, rectangle arrondi, cercle, triangle, losange, pentagone, hexagone, étoile, flèche, ligne. Remplissage, contour, arrondi.
- **Images** : import, glisser-déposer, coller depuis le presse-papiers (Ctrl+V), coins arrondis.
- **Mise en page** : déplacement avec guides magnétiques, redimensionnement, rotation, sélection multiple (Maj + clic ou cadre de sélection), alignement, ordre des calques, verrouillage, masquage, opacité.
- **Fonds** : couleurs unies et dégradés.
- **Multi-pages** : ajouter, dupliquer, réordonner, supprimer.
- **Annuler / rétablir** (Ctrl+Z / Ctrl+Y) et enregistrement automatique dans le navigateur.
- **Export** : PNG, JPG, PDF (×1, ×2, ×3) et projet `.gbaki` pour reprendre le travail sur un autre ordinateur.

## Raccourcis clavier

| Raccourci | Action |
| --- | --- |
| Ctrl+Z / Ctrl+Y | Annuler / rétablir |
| Ctrl+C / Ctrl+V / Ctrl+X | Copier / coller / couper |
| Ctrl+D | Dupliquer |
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
