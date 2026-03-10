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
# Este script agora deve ser executado de DENTRO da pasta da nova versão baixada.
CURRENT_DIR=$(pwd)
OLD_PROD_DIR=${1:-"/srv/cnm"}

echo ">> Diretório da Nova Versão: $CURRENT_DIR"
echo ">> Diretório em Produção: $OLD_PROD_DIR"

if [ "$CURRENT_DIR" == "$OLD_PROD_DIR" ]; then
    echo ">> [ERRO] Você está executando o update de dentro da pasta de produção!"
    echo ">> Para este formato, extraia a nova versão em uma pasta separada (ex: /tmp/cnm_v2) e execute o ./update.sh de lá."
    exit 1
fi

if [ ! -d "$OLD_PROD_DIR" ]; then
    echo ">> [INFO] Diretório de Produção '$OLD_PROD_DIR' não encontrado."
    echo ">> Assumindo que é uma instalação nova ou que o banco já existe na máquina."
    OLD_VERSION="0.1.0"
else
    # Capturar a versão atual via package.json do projeto em produção
    if [ -f "$OLD_PROD_DIR/package.json" ]; then
        OLD_VERSION=$(node -p "require('$OLD_PROD_DIR/package.json').version" 2>/dev/null || echo "0.1.0")
    else
        OLD_VERSION="0.1.0"
    fi

    echo ">> [1/7] Copiando Configurações e Logs da Produção (V ${OLD_VERSION})..."
    
    # Copiar o arquivo de ambiente (.env)
    if [ -f "$OLD_PROD_DIR/.env" ]; then
        cp "$OLD_PROD_DIR/.env" "$CURRENT_DIR/.env"
        chown $APP_USER:$APP_USER "$CURRENT_DIR/.env"
        echo "   - Arquivo .env copiado com sucesso."
    else
        echo "   - Aviso: Não foi encontrado o arquivo .env no diretório antigo."
    fi

    # Copiar relatórios e logs gerados localmente, se houver
    if [ -d "$OLD_PROD_DIR/logs" ]; then
        cp -r "$OLD_PROD_DIR/logs" "$CURRENT_DIR/logs"
        chown -R $APP_USER:$APP_USER "$CURRENT_DIR/logs"
        echo "   - Logs copiados com sucesso."
    fi
fi

NEW_VERSION=$(node -p "require('$CURRENT_DIR/package.json').version" 2>/dev/null || echo "0.1.0")
echo ">> Atualizando da versão $OLD_VERSION para a versão $NEW_VERSION."

# 2. Update Packages (Na nova pasta)
echo ">> [2/7] Instalando dependências Node na nova versão..."
chown -R $APP_USER:$APP_USER "$CURRENT_DIR"
sudo -u $APP_USER npm install --legacy-peer-deps

# 3. Safe Database Migration
echo ">> [3/7] Atualizando estrutura do Banco de Dados PostgreSQL..."
sudo -u $APP_USER npx prisma migrate deploy

# 4. Seeding Specific Addons
echo ">> [4/7] Injetando Baternap, Wanguard e recursos locais no Banco..."
sudo -u $APP_USER node scripts/seed-baternap.js
sudo -u $APP_USER node scripts/seed-wanguard.js

# 5. Executar updates da Timeline
echo ">> [5/7] Verificando e executando scripts de Timeline..."
if [ -f "scripts/run-timeline-updates.js" ]; then
    sudo -u $APP_USER node scripts/run-timeline-updates.js "$OLD_VERSION" "$NEW_VERSION"
else
    echo ">> Script run-timeline-updates.js não encontrado na nova versão."
fi

# 6. Build Production
echo ">> [6/7] Compilando nova versão..."
sudo -u $APP_USER npm run build

# 7. Substituindo a Produção
echo ">> [7/7] Promovendo nova versão para a pasta de produção ($OLD_PROD_DIR)..."

if command -v pm2 &> /dev/null; then
    echo "   - Parando aplicação no PM2..."
    sudo -u "$APP_USER" pm2 stop cnm 2>/dev/null || true
fi

if [ -d "$OLD_PROD_DIR" ]; then
    VERSION_DATE=$(date +"%d%m%Y_%H%M%S")
    BACKUP_DIR="${OLD_PROD_DIR}_BACKUP_${OLD_VERSION}_${VERSION_DATE}"
    echo "   - Movendo diretório antigo para: $BACKUP_DIR"
    mv "$OLD_PROD_DIR" "$BACKUP_DIR"
fi

echo "   - Movendo nova versão para a pasta definitiva..."
# Movimenta o diretorio atual inteirinho para a pasta de producao velha
mv "$CURRENT_DIR" "$OLD_PROD_DIR"
cd "$OLD_PROD_DIR" || exit 1

# Garante que as permissoes finais estao corretas pos-move
chown -R $APP_USER:$APP_USER "$OLD_PROD_DIR"

echo "================================================="
echo "   ATUALIZAÇÃO CONCLUÍDA!                        "
echo "================================================="

if command -v pm2 &> /dev/null; then
    # Checar se o app já está rodando no PM2
    if sudo -u "$APP_USER" pm2 list 2>/dev/null | grep -q "cnm"; then
        echo ">> Recarregando a aplicação no PM2 a partir de $OLD_PROD_DIR..."
        sudo -u "$APP_USER" pm2 reload cnm || sudo -u "$APP_USER" pm2 restart cnm
    else
        echo ">> Adicionando a aplicação CNM ao PM2..."
        sudo -u "$APP_USER" pm2 start npm --name "cnm" -- start
        sudo -u "$APP_USER" pm2 save
    fi
else
    echo ">> [INFO] PM2 não detectado no sistema."
    echo "IMPORTANTE: Inicie o processo Node/PM2/SystemD"
    echo "em $OLD_PROD_DIR para colocar no ar."
fi
echo "================================================="
