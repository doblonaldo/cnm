#!/bin/bash

# CNM - Central Network Manager
# Update Script (Safe mode - Preserves Database)

echo "================================================="
echo "   CNM - Script de Atualização Segura            "
echo "================================================="
echo "Este script irá atualizar sua aplicação"
echo "SEM perder usuários, e-mails ou configurações."
echo "================================================="

# 1. Update Packages
echo ">> [1/3] Instalando novos módulos (se houver)..."
npm install

# 2. Safe Database Migration (Aplica as novas colunas sem apagar a tabela)
echo ">> [2/3] Atualizando estrutura do Banco de Dados..."
npx prisma migrate deploy

# 3. Build Production
echo ">> [3/3] Compilando nova versão..."
npm run build

echo ""
echo "================================================="
echo "   ATUALIZAÇÃO CONCLUÍDA!                        "
echo "================================================="
echo "A nova versão já está compilada."

if command -v pm2 &> /dev/null && pm2 list 2>/dev/null | grep -q "cnm"; then
    echo ">> Reiniciando a aplicação no PM2..."
    pm2 restart cnm
elif [ -n "$SUDO_USER" ] && command -v pm2 &> /dev/null && su - "$SUDO_USER" -c "pm2 list" 2>/dev/null | grep -q "cnm"; then
    echo ">> Reiniciando a aplicação no PM2 (via $SUDO_USER)..."
    su - "$SUDO_USER" -c "pm2 restart cnm"
else
    echo "IMPORTANTE: Reinicie o processo Node/PM2/SystemD"
    echo "para que as alterações entrem no ar ativamente."
    echo "Ex: Ctrl+C ou 'pm2 restart cnm'"
fi
echo "================================================="
