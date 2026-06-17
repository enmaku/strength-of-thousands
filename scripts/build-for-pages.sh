#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export GH_PAGES_BASE=/strength-of-thousands/

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npm run lint
npm run build:pages

echo ""
echo "Pages build ready in dist/spa/"
echo "Preview: npx quasar serve dist/spa --history"
echo "Live URL (after deploy): https://enmaku.github.io/strength-of-thousands/"
