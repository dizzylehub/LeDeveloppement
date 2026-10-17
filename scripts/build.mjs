// Construit GBAKI :
//  - dist/gbaki.html : un seul fichier autonome, à ouvrir par double-clic (hors ligne) ;
//  - dist/web/       : l'application installable (PWA) à héberger en HTTPS (tablette, téléphone, ordinateur).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'app');
const dist = join(root, 'dist');
let html = readFileSync(join(app, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) =>
  `<style>\n${readFileSync(join(app, href), 'utf8')}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) =>
  `<script>\n${readFileSync(join(app, src), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`);

mkdirSync(dist, { recursive: true });
// Fichier unique : pas de manifeste ni d'icônes externes (introuvables en file://).
const single = html.replace(/\s*<link rel="(manifest|apple-touch-icon)"[^>]*>/g, '');
writeFileSync(join(dist, 'gbaki.html'), single);
console.log(`dist/gbaki.html (${(single.length / 1024).toFixed(0)} Ko)`);

// Application installable.
const web = join(dist, 'web');
rmSync(web, { recursive: true, force: true });
mkdirSync(join(web, 'icons'), { recursive: true });
writeFileSync(join(web, 'index.html'), html);
copyFileSync(join(app, 'manifest.webmanifest'), join(web, 'manifest.webmanifest'));
for (const f of readdirSync(join(app, 'icons'))) copyFileSync(join(app, 'icons', f), join(web, 'icons', f));
const version = createHash('sha1').update(html).digest('hex').slice(0, 10);
writeFileSync(join(web, 'sw.js'), readFileSync(join(app, 'sw.js'), 'utf8').replace('__VERSION__', version));
writeFileSync(join(web, '.nojekyll'), '');
console.log(`dist/web/ (version ${version})`);
