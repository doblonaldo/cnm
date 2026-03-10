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

# 0. Verificação de Dependências
PACKAGES_TO_CHECK=("rsync" "node" "npm")
PACKAGES_TO_INSTALL=()

for pkg in "${PACKAGES_TO_CHECK[@]}"; do
    if ! command -v "$pkg" >/dev/null 2>&1; then
        PACKAGES_TO_INSTALL+=("$pkg")
    fi
done

if [ ${#PACKAGES_TO_INSTALL[@]} -gt 0 ]; then
    echo ">> [0/7] Dependências ausentes detectadas: ${PACKAGES_TO_INSTALL[*]}. Instalando..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_LIKE=${ID_LIKE:-""}
        
        # Converte dependências de comando para nomes de pacotes de sistema
        SYS_PACKAGES=""
        for pkg in "${PACKAGES_TO_INSTALL[@]}"; do
            if [ "$pkg" == "node" ] || [ "$pkg" == "npm" ]; then
                SYS_PACKAGES="$SYS_PACKAGES nodejs npm"
            else
                SYS_PACKAGES="$SYS_PACKAGES $pkg"
            fi
        done
        # Garantir que não haja duplicatas
        SYS_PACKAGES=$(echo "$SYS_PACKAGES" | xargs -n1 | sort -u | xargs)
        
        if [[ "$OS" == "ubuntu" || "$OS" == "debian" || "$OS_LIKE" == *"ubuntu"* || "$OS_LIKE" == *"debian"* ]]; then
            apt-get update -y && apt-get install -y $SYS_PACKAGES
        elif [[ "$OS" == "arch" || "$OS" == "cachyos" || "$OS" == "manjaro" || "$OS_LIKE" == *"arch"* ]]; then
            pacman -Sy --noconfirm $SYS_PACKAGES
        elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" || "$OS" == "rocky" || "$OS" == "alma" || "$OS_LIKE" == *"rhel"* || "$OS_LIKE" == *"fedora"* ]]; then
            PKG_MAN=$(command -v dnf || command -v yum)
            $PKG_MAN install -y $SYS_PACKAGES
        else
            echo ">> Sistema '$OS' não suportado para instalação automática. Por favor, instale manualmente: $SYS_PACKAGES"
            exit 1
        fi
    else
        echo ">> SO não detectado. Instale as dependências manualmente: ${PACKAGES_TO_INSTALL[*]}"
        exit 1
    fi
fi

# 1. Configuração de Diretórios
UPDATE_DIR=${1:-"$(pwd)/_update"}
TARGET_DIR=${2:-"/srv/cnm"}

# Garantir que o diretório alvo existe
if [ ! -d "$TARGET_DIR" ]; then
    echo ">> [INFO] Diretório alvo '$TARGET_DIR' não existe. Criando..."
    mkdir -p "$TARGET_DIR"
    chown -R $APP_USER:$APP_USER "$TARGET_DIR"
fi

if [ -d "$UPDATE_DIR" ]; then
    # Capturar a versão atual via package.json do projeto (se existir no alvo)
    if [ -f "$TARGET_DIR/package.json" ]; then
        OLD_VERSION=$(node -p "require('$TARGET_DIR/package.json').version" 2>/dev/null || echo "0.1.0")
    else
        OLD_VERSION="0.1.0"
    fi
    APP_VERSION=$OLD_VERSION
    VERSION_DATE=$(date +"%d%m%Y_%H%M%S")
    BACKUP_DIR="${TARGET_DIR}/_backups/V_${APP_VERSION}_${VERSION_DATE}"
    
    echo ">> [1/7] Criando backup da versão atual (V ${APP_VERSION}) em '$BACKUP_DIR'..."
    mkdir -p "$BACKUP_DIR"
    
    # Criamos um backup usando rsync excluindo caches pesados e arquivos temporários da pasta alvo
    rsync -a --exclude 'node_modules/' \
             --exclude '.next/' \
             --exclude '_backups/' \
             --exclude '_update/' \
             --exclude '.git/' \
             "$TARGET_DIR/" "$BACKUP_DIR/"
             
    chown -R $APP_USER:$APP_USER "$BACKUP_DIR"
    echo ">> Backup salvo com sucesso: V ${APP_VERSION} (Data: $VERSION_DATE)"

    echo ">> [2/7] Sincronizando arquivos novos de '$UPDATE_DIR' para '$TARGET_DIR'..."
    
    # Sincroniza arquivos, preservando .env e outras pastas vitais no alvo
    rsync -avz --checksum \
        --exclude '.env' \
        --exclude 'node_modules/' \
        --exclude '.git/' \
        --exclude 'logs/' \
        --exclude '.next/' \
        --exclude '_update/' \
        --exclude '_backups/' \
        "$UPDATE_DIR/" "$TARGET_DIR/"
        
    echo ">> Sincronização concluída."
    NEW_VERSION=$(node -p "require('$UPDATE_DIR/package.json').version" 2>/dev/null || echo "0.1.0")
else
    echo ">> [1/7 & 2/7] Nenhum diretório de atualização ('$UPDATE_DIR'). Pulando geração de versão e sync."
    if [ -f "$TARGET_DIR/package.json" ]; then
        OLD_VERSION=$(node -p "require('$TARGET_DIR/package.json').version" 2>/dev/null || echo "0.1.0")
    else
        OLD_VERSION="0.1.0"
    fi
    NEW_VERSION=$OLD_VERSION
fi

# Navega para o diretório alvo para rodar o npm e scripts
cd "$TARGET_DIR" || exit 1

# 3. Update Packages
echo ">> [3/7] Instalando novos módulos (se houver) em '$TARGET_DIR'..."
# Garante as permissoes da pasta antes de qualquer acao
chown -R $APP_USER:$APP_USER "$TARGET_DIR"
# Force npm install to get dependencies like recharts even if cache is stale
sudo -u $APP_USER npm install --legacy-peer-deps

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

if command -v pm2 &> /dev/null; then
    # Checar se o app já está rodando no PM2
    if sudo -u "$APP_USER" pm2 list 2>/dev/null | grep -q "cnm"; then
        echo ">> Recarregando a aplicação no PM2 (Zero-Downtime se suportado)..."
        sudo -u "$APP_USER" pm2 reload cnm || sudo -u "$APP_USER" pm2 restart cnm
    else
        echo ">> Adicionando a aplicação CNM ao PM2..."
        # Iniciar no PM2 a partir do TARGET_DIR processando npm como start
        sudo -u "$APP_USER" pm2 start npm --name "cnm" -- start
        sudo -u "$APP_USER" pm2 save
    fi
else
    echo ">> [INFO] PM2 não detectado no sistema."
    echo "Sugestão: Instale o PM2 globalmente ('npm install -g pm2') para gerenciar o processo."
    echo "IMPORTANTE: Reinicie o processo Node/PM2/SystemD"
    echo "para que as alterações entrem no ar ativamente."
    echo "Ex: Ctrl+C e 'npm run start' ou 'pm2 restart cnm'"
fi
echo "================================================="
