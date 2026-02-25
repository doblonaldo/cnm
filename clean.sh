#!/bin/bash

# CNM - Central Network Manager
# Clean Script (Prepare for Production Server Copy)

echo "================================================="
echo "   CNM - Cleaning Project Script                 "
echo "================================================="
echo "Limpando artefatos compilados e dependências..."

rm -rf .next/
echo "[OK] Pasta .next removida."

rm -rf node_modules/
echo "[OK] Pasta node_modules removida."

rm -f package-lock.json
echo "[OK] package-lock.json (Cache do NPM) limpo."

# Optional: Limpar DB local do Prisma se estivesse usando SQLite, como é Postgres, ignoramos a pasta prisma/migrations.
# Nota: não deletamos o .env para que, se você quiser só rebuildar na própria máquina, não perca a chave de banco.

echo ""
echo "Projeto limpo e enxuto."
echo "Para rodar o ambiente agora, execute:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm run start (Produção) ou npm run dev (Dev)"
echo "================================================="
