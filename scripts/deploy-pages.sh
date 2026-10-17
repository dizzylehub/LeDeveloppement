#!/usr/bin/env bash
# Publie l'application installable (dist/web) sur la branche gh-pages (GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build.mjs
tmp=$(mktemp -d)
cp -r dist/web/. "$tmp"/
cd "$tmp"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name || echo gbaki)" -c user.email="$(git -C "$OLDPWD" config user.email || echo gbaki@localhost)" commit -qm "Publication GBAKI $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f "$(git -C "$OLDPWD" remote get-url origin)" gh-pages
rm -rf "$tmp"
echo "Publié sur la branche gh-pages."
