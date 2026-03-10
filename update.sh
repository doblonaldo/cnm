#!/bin/bash

# CNM - Central Network Manager
# Update Script (Safe mode - Preserves Database)

echo "================================================="
echo "   CNM - Script de Atualização Segura            "
echo "================================================="
echo "Este script irá atualizar sua aplicação"
echo "SEM perder usuários, e-mails ou configurações."
echo "================================================="

# O script precisa rodar com permissões elevadas para certas ações como PM2 e system configs,
# mas deve atribuir os arquivos ao usuário correto.
if [ "$EUID" -ne 0 ]; then
    echo "ERRO: Por favor, execute este script como root (usando sudo)."
    exit 1
fi

if [ -z "$SUDO_USER" ]; then
    APP_USER="root"
    echo "Aviso: Executando diretamente como root. Os arquivos mantidos serão chown'd para root."
else
    APP_USER=$SUDO_USER
fi

# 0. Verificação de Dependências (rsync)
if ! command -v rsync >/dev/null 2>&1; then
    echo ">> [0/6] 'rsync' não encontrado. Detectando Sistema para instalação..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_LIKE=${ID_LIKE:-""}
        
        if [[ "$OS" == "ubuntu" || "$OS" == "debian" || "$OS_LIKE" == *"ubuntu"* || "$OS_LIKE" == *"debian"* ]]; then
            apt-get update -y && apt-get install -y rsync
        elif [[ "$OS" == "arch" || "$OS" == "cachyos" || "$OS" == "manjaro" || "$OS_LIKE" == *"arch"* ]]; then
            pacman -Sy --noconfirm rsync
        elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" || "$OS" == "rocky" || "$OS" == "alma" || "$OS_LIKE" == *"rhel"* || "$OS_LIKE" == *"fedora"* ]]; then
            PKG_MAN=$(command -v dnf || command -v yum)
            $PKG_MAN install -y rsync
        else
            echo ">> Sistema '$OS' não suportado para instalação automática do rsync. Por favor, instale manualmente."
            exit 1
        fi
    else
        echo ">> SO não detectado. Instale o rsync manualmente (apt install rsync / pacman -S rsync)."
        exit 1
    fi
fi

# 1. Check for Update Directory
UPDATE_DIR=${1:-"./_update"}

if [ -d "$UPDATE_DIR" ]; then
    # Capturar a versão atual via package.json do projeto
    OLD_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.1.0")
    APP_VERSION=$OLD_VERSION
    VERSION_DATE=$(date +"%d%m%Y_%H%M%S")
    BACKUP_DIR="_backups/V_${APP_VERSION}_${VERSION_DATE}"
    
    echo ">> [1/7] Criando backup da versão atual (V ${APP_VERSION}) em '$BACKUP_DIR'..."
    mkdir -p "$BACKUP_DIR"
    
    # Criamos um backup usando rsync excluindo caches pesados e arquivos temporários
    rsync -a --exclude 'node_modules/' \
             --exclude '.next/' \
             --exclude '_backups/' \
             --exclude '_update/' \
             --exclude '.git/' \
             ./ "$BACKUP_DIR/"
             
    chown -R $APP_USER:$APP_USER "$BACKUP_DIR"
    echo ">> Backup salvo com sucesso: V ${APP_VERSION} (Data: $VERSION_DATE)"

    echo ">> [2/7] Sincronizando arquivos novos de '$UPDATE_DIR'..."
    
    # Sincroniza arquivos, preservando .env e outras pastas vitais
    rsync -avz --checksum \
        --exclude '.env' \
        --exclude 'node_modules/' \
        --exclude '.git/' \
        --exclude 'logs/' \
        --exclude '.next/' \
        --exclude '_update/' \
        --exclude '_backups/' \
        "$UPDATE_DIR/" ./
        
    echo ">> Sincronização concluída."
    NEW_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.1.0")
else
    echo ">> [1/7 & 2/7] Nenhum diretório de atualização ('$UPDATE_DIR'). Pulando geração de versão e sync."
    OLD_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.1.0")
    NEW_VERSION=$OLD_VERSION
fi

# 3. Update Packages
echo ">> [3/7] Instalando novos módulos (se houver)..."
# Garante as permissoes da pasta antes de qualquer acao em caso de git pulls como root
chown -R $APP_USER:$APP_USER .
sudo -u $APP_USER npm install

# 4. Safe Database Migration (Aplica as novas colunas sem apagar a tabela)
echo ">> [4/7] Atualizando estrutura do Banco de Dados..."
sudo -u $APP_USER npx prisma migrate deploy

# 5. Seeding Specific Addons (Injetar as atualizações da UI Local)
echo ">> [5/7] Injetando Baternap, Wanguard e recursos locais no Banco..."
sudo -u $APP_USER node scripts/seed-baternap.js
sudo -u $APP_USER node scripts/seed-wanguard.js

# 6. Executar updates da Timeline
echo ">> [6/7] Verificando e executando scripts de Timeline..."
if [ -f "scripts/run-timeline-updates.js" ]; then
    sudo -u $APP_USER node scripts/run-timeline-updates.js "$OLD_VERSION" "$NEW_VERSION"
else
    echo ">> Script run-timeline-updates.js não encontrado. Pulando."
fi

# 7. Build Production
echo ">> [7/7] Compilando nova versão..."
sudo -u $APP_USER npm run build

echo ""
echo "================================================="
echo "   ATUALIZAÇÃO CONCLUÍDA!                        "
echo "================================================="
echo "A nova versão já está compilada."

if command -v pm2 &> /dev/null && pm2 list 2>/dev/null | grep -q "cnm"; then
    echo ">> Recarregando a aplicação no PM2 (Zero-Downtime se suportado)..."
    pm2 reload cnm || pm2 restart cnm
elif [ -n "$SUDO_USER" ] && command -v pm2 &> /dev/null && su - "$SUDO_USER" -c "pm2 list" 2>/dev/null | grep -q "cnm"; then
    echo ">> Recarregando a aplicação no PM2 (via $SUDO_USER)..."
    su - "$SUDO_USER" -c "pm2 reload cnm || pm2 restart cnm"
else
    echo "IMPORTANTE: Reinicie o processo Node/PM2/SystemD"
    echo "para que as alterações entrem no ar ativamente."
    echo "Ex: Ctrl+C ou 'pm2 restart cnm'"
fi
echo "================================================="
