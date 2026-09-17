#!/usr/bin/env bash
# Publica proyecto/ en GitHub Pages (repo público Giuliano246/vitalmet-rig-explorer, rama main = raíz del sitio).
# Uso: proyecto/tools/deploy-pages.sh "mensaje de commit"
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
git clone -q --depth 1 https://github.com/Giuliano246/vitalmet-rig-explorer.git "$TMP/repo"
rsync -a --delete --exclude '.git' --exclude '.DS_Store' "$SRC"/ "$TMP/repo"/
touch "$TMP/repo/.nojekyll"
cd "$TMP/repo"
git add -A
if git -c user.name="Giuliano Vitale" -c user.email="giuliano@vitalmetsa.com" commit -qm "${1:-Actualización del Rig Explorer}"; then
  git push -q origin main
  echo "Publicado: https://giuliano246.github.io/vitalmet-rig-explorer/ (tarda ~1 min en refrescar)"
else
  echo "Sin cambios que publicar"
fi
rm -rf "$TMP"
