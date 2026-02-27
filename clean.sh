#!/bin/bash

# CNM - Central Network Manager
# Factory Reset / Clean Script

echo "================================================="
echo "   CNM - Full Project Factory Reset              "
echo "================================================="
echo "Este script apagará ABSOLUTAMENTE TUDO:"
echo " - Dependências e caches (.next, node_modules)"
echo " - Arquivo de configuração de chaves (.env)"
echo " - Banco de Dados PostgreSQL (cnm) e Usuário"
echo " - Arquivos globais de Log (/var/log/cnm)"
echo "================================================="

# Confirmação
read -p "Deseja realmente apagar o projeto inteiro do zero? (y/N) " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

if [ "$EUID" -ne 0 ]; then
    echo ">> Reiniciando script com sudo..."
    exec sudo bash "$0" "$@"
fi

echo ""
echo ">> 1. Removendo artefatos compilados e processos em background..."
if command -v pm2 &> /dev/null; then
    pm2 delete cnm 2>/dev/null || true
    if [ -n "$SUDO_USER" ]; then
        su - "$SUDO_USER" -c "pm2 delete cnm" 2>/dev/null || true
        su - "$SUDO_USER" -c "pm2 save --force" 2>/dev/null || true
    fi
fi
rm -rf .next/
rm -rf node_modules/
rm -f package-lock.json
echo "[OK] Dependências locais removidas e processos parados."

echo ">> 2. Removendo chaves e variáveis sensíveis..."
rm -f .env
echo "[OK] Arquivo .env apagado."

echo ">> 3. Apagando banco de dados e usuários do PostgreSQL..."
su - postgres -c "psql -c \"DROP DATABASE IF EXISTS cnm;\"" 2>/dev/null
su - postgres -c "psql -c \"DROP USER IF EXISTS cnm_user;\"" 2>/dev/null
echo "[OK] Banco PostgreSQL apagado."

echo ">> 4. Apagando Logs de Auditoria do Servidor..."
rm -rf /var/log/cnm
rm -f /etc/logrotate.d/cnm
rm -f /etc/cron.weekly/cnm-db-prune
echo "[OK] Logs globais deletados."

echo ""
echo "================================================="
echo "Projeto 100% LIMPO! O ambiente físico e de banco"
echo "voltou ao status original (Zero-State)."
echo ""
echo "Para instalar novamente e gerar novas chaves:"
echo "sudo ./setup.sh"
echo "================================================="
