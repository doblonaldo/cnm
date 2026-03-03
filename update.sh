#!/bin/bash

# CNM - Central Network Manager
# Update Script (Safe mode - Preserves Database)

echo "================================================="
echo "   CNM - Script de Atualização Segura            "
echo "================================================="
echo "Este script irá atualizar sua aplicação"
echo "SEM perder usuários, e-mails ou configurações."
echo "================================================="

if [ -z "$SUDO_USER" ]; then
    APP_USER=$(whoami)
else
    APP_USER=$SUDO_USER
fi

# 1. Update Packages
echo ">> [1/4] Instalando novos módulos (se houver)..."
sudo -u $APP_USER npm install

# 2. Safe Database Migration (Aplica as novas colunas sem apagar a tabela)
echo ">> [2/4] Atualizando estrutura do Banco de Dados..."
sudo -u $APP_USER npx prisma migrate deploy

# 3. Seeding Specific Addons (Injetar as atualizações da UI Local)
echo ">> [3/4] Injetando Baternap e recursos locais no Banco..."
sudo -u $APP_USER node scripts/seed-baternap.js

# 4. Build Production
echo ">> [4/4] Compilando nova versão..."
sudo -u $APP_USER npm run build

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
