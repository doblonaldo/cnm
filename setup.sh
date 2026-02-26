#!/bin/bash

# CNM - Central Network Manager
# Automated Full Setup & Installation Script
# Supports: Ubuntu, Debian, CentOS, RHEL, Fedora

echo "================================================="
echo "   CNM - Full Automated Setup Script             "
echo "================================================="
echo "Este script configurará o CNM, instalará"
echo "o Node.js, PostgreSQL e suas dependências base."
echo "Também fará o Seed da Aplicação (Reset DB)."
echo "================================================="

# 1. Root Check
if [ "$EUID" -ne 0 ]; then 
    echo "ERRO CRÍTICO: Este script altera arquivos do sistema e gerencia pacotes."
    echo "Por favor, execute este script usando o comando sudo:"
    echo "sudo ./setup.sh"
    exit 1
fi

if [ -z "$SUDO_USER" ]; then
    echo "Parece que você logou diretamente como root. O script prosseguirá, mas é recomendado executar como um usuário não-root usando sudo."
    APP_USER="root"
else
    APP_USER=$SUDO_USER
fi

echo ""
echo "[Aviso] Todos os dados antigos no banco 'cnm' serão apagados."
read -p "Pressione Enter para iniciar a instalação automatizada ou Ctrl+C para sair..."
echo ""

# 2. OS Detection & Package Installation
echo "-------------------------------------------------"
echo "[1/4] Detectando Sistema Operacional e Instalando Dependências"
echo "-------------------------------------------------"

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_LIKE=${ID_LIKE:-""}
else
    echo "Sistema operacional não identificado."
    exit 1
fi

echo ">> Sistema Detectado: $PRETTY_NAME"

function install_node_postgres_apt() {
    echo ">> Verificando dependências no APT..."
    if ! command -v node >/dev/null 2>&1 || ! command -v psql >/dev/null 2>&1; then
        apt-get update -y
        apt-get install -y curl gnupg2
        if ! command -v node >/dev/null 2>&1; then
            echo ">> Configurando repositório do Node.js 20 LTS..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
        fi
        if ! command -v psql >/dev/null 2>&1; then
            echo ">> Instalando PostgreSQL Server..."
            apt-get install -y postgresql postgresql-contrib
        fi
    else
        echo ">> [OK] Node.js e PostgreSQL já estão instalados no sistema."
    fi
}

function install_node_postgres_rpm() {
    PKG_MAN=$(command -v dnf || command -v yum)
    echo ">> Verificando dependências via $PKG_MAN..."
    if ! command -v node >/dev/null 2>&1 || ! command -v psql >/dev/null 2>&1; then
        $PKG_MAN update -y
        $PKG_MAN install -y curl
        if ! command -v node >/dev/null 2>&1; then
            echo ">> Configurando repositório do Node.js 20 LTS..."
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            $PKG_MAN install -y nodejs
        fi
        if ! command -v psql >/dev/null 2>&1; then
            echo ">> Instalando PostgreSQL Server..."
            $PKG_MAN install -y postgresql-server postgresql-contrib
            if [ ! -d "/var/lib/pgsql/data/base" ] && [ -x /usr/bin/postgresql-setup ]; then
                postgresql-setup --initdb || true
            fi
        fi
    else
        echo ">> [OK] Node.js e PostgreSQL já estão instalados no sistema."
    fi
}

function install_node_postgres_pacman() {
    PKG_MAN="pacman"
    if command -v paru >/dev/null 2>&1; then
        PKG_MAN="paru"
    elif command -v yay >/dev/null 2>&1; then
        PKG_MAN="yay"
    fi
    echo ">> Verificando dependências via gerenciador $PKG_MAN..."
    
    if ! command -v node >/dev/null 2>&1 || ! command -v psql >/dev/null 2>&1; then
        INSTALL_CMDS=""
        if ! command -v node >/dev/null 2>&1; then
            echo ">> Marcando Node.js e NPM para instalação..."
            INSTALL_CMDS="$INSTALL_CMDS nodejs npm"
        fi
        if ! command -v psql >/dev/null 2>&1; then
            echo ">> Marcando PostgreSQL Server para instalação..."
            INSTALL_CMDS="$INSTALL_CMDS postgresql"
        fi
        
        if [ -n "$INSTALL_CMDS" ]; then
            # O Pacman lida bem com pacotes oficiais do arch, não precisamos forçar Paru (que quebra como root) para isso.
            pacman -Sy --noconfirm $INSTALL_CMDS
        fi
        
        # Initialize postgres if doing fresh install on Arch
        if [ ! -d "/var/lib/postgres/data" ] || [ -z "$(ls -A /var/lib/postgres/data)" ]; then
            echo ">> Inicializando o Data Directory do PostgreSQL..."
            su - postgres -c "initdb -D /var/lib/postgres/data"
        fi
    else
        echo ">> [OK] Node.js e PostgreSQL já estão instalados no sistema."
    fi
}

if [[ "$OS" == "ubuntu" || "$OS" == "debian" || "$OS_LIKE" == *"ubuntu"* || "$OS_LIKE" == *"debian"* ]]; then
    install_node_postgres_apt
elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" || "$OS" == "rocky" || "$OS" == "alma" || "$OS_LIKE" == *"rhel"* || "$OS_LIKE" == *"fedora"* ]]; then
    install_node_postgres_rpm
elif [[ "$OS" == "arch" || "$OS" == "cachyos" || "$OS" == "manjaro" || "$OS_LIKE" == *"arch"* ]]; then
    install_node_postgres_pacman
else
    echo "Sistema '$OS' não é suportado oficialmente por este script automático."
    echo "Instale o Node.js e o PostgreSQL manualmente e tente novamente removendo a trava de Root."
    exit 1
fi

# Ensure Postgres is running
echo ">> Habilitando inicialização automática do PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql 2>/dev/null || true
echo ">> Infraestrutura Base Concluída."

# 3. PostgreSQL Database Automatic Setup
echo ""
echo "-------------------------------------------------"
echo "[2/4] Configuração Automática do Banco e App"
echo "-------------------------------------------------"

DB_NAME="cnm"
DB_USER="cnm_user"
# Generate a random password for the database connection
DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

echo ">> Configurando o PostgreSQL (Criando Usuário '$DB_USER' e Database '$DB_NAME')..."
# Drop in case of retry
su - postgres -c "psql -c \"DROP DATABASE IF EXISTS $DB_NAME;\"" 2>/dev/null || true
su - postgres -c "psql -c \"DROP USER IF EXISTS $DB_USER;\"" 2>/dev/null || true

# Recreate
su - postgres -c "psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\""
su - postgres -c "psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""
su - postgres -c "psql -c \"ALTER USER $DB_USER CREATEDB;\"" # Prisma needs create rights for shadow dbs occasionally in some flows, but usually owner is enough.

# A porta padrão do Postgres é 5432
# Nota: se o socket unix não estiver liberado, pode ser necessário alterar pga_hba.conf, porém por padrão o Prisma conectando via localhost com user/pass do localhost costuma funcionar se autenticação md5 ou scram-sha-256 estiver configurada.
# Assumimos padrão out-of-the-box do PG10+ Linux para conexões TCP locais.
GENERATED_DB_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"


# 4. JWT & Admin User Input
echo ""
echo "-------------------------------------------------"
echo "[3/4] Chaves de Segurança e Senha Máster"
echo "-------------------------------------------------"

JWT_SECRET=$(openssl rand -hex 32)
echo ">> Um JWT_SECRET aleatório altamente seguro foi gerado nos bastidores."

echo ""
echo ">> Agora, precisamos definir a senha de acesso da Plataforma Web para: admin@cnm.local"
read -s -p "Digite a senha do usuário Administrador: " ADMIN_PASS
echo ""
read -s -p "Confirme a senha: " ADMIN_PASS_CONFIRM
echo ""

while [ "$ADMIN_PASS" != "$ADMIN_PASS_CONFIRM" ] || [ -z "$ADMIN_PASS" ]; do
    echo "As senhas não conferem ou são vazias. Tente novamente."
    read -s -p "Digite a senha do usuário Administrador: " ADMIN_PASS
    echo ""
    read -s -p "Confirme a senha: " ADMIN_PASS_CONFIRM
    echo ""
done

echo ""
echo "-------------------------------------------------"
echo "[EXTRA] Configuração do Google Workspace (Opcional)"
echo "-------------------------------------------------"
echo "Para habilitar o Login SSO Corporativo via Google, preencha as variáveis abaixo:"
echo "(Deixe em branco pressionando ENTER se não desejar o recurso agora)"
echo ""
read -p "GOOGLE_CLIENT_ID (ex: 123-abc.apps.googleusercontent.com): " GOOGLE_CLIENT_ID
read -p "GOOGLE_CLIENT_SECRET (ex: GOCSPX-123abcde): " GOOGLE_CLIENT_SECRET
read -p "GOOGLE_WORKSPACE_DOMAIN (ex: suaempresa.com.br): " GOOGLE_WORKSPACE_DOMAIN

echo ""
echo "--> Gravando configurações no arquivo .env..."
cat <<EOF > .env
DATABASE_URL="${GENERATED_DB_URL}"
JWT_SECRET="${JWT_SECRET}"
NODE_ENV="development"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}"
GOOGLE_WORKSPACE_DOMAIN="${GOOGLE_WORKSPACE_DOMAIN}"
EOF

# Ensure the non-root calling user owns the env
chown $APP_USER:$APP_USER .env

# 5. Installing App and Prisma Database Setup
echo ""
echo "-------------------------------------------------"
echo "[4/4] Instalando dependências Node e Semeando Aplicação"
echo "-------------------------------------------------"
echo ">> Instalando pacotes NM (pode demorar alguns minutos)..."

# Run npm install as the standard user, not as root to avoid permission hell
sudo -u $APP_USER npm install

echo ">> Resetando (Apagando e Recriando) Esquema do Banco via Prisma..."
# Migrate runs via npx. Force the reset.
sudo -u $APP_USER npx prisma migrate reset --force

echo ">> Semeando (Seed) usuário Administrador inicial..."
# Inject password and run the seed script as standard user
sudo -u $APP_USER sh -c "ADMIN_PASSWORD='${ADMIN_PASS}' npm run db:seed"

echo ">> Preparando arquivo de log global de auditoria (/var/log/cnm/audit.log)..."
mkdir -p /var/log/cnm
# Clear the file by truncating
> /var/log/cnm/audit.log 
# Make it writable by the app user
chown -R $APP_USER:$APP_USER /var/log/cnm
chmod 777 /var/log/cnm/audit.log 

echo ">> Configurando Rotação Automática de Logs (Linux Logrotate - 30 dias Max)..."
cat <<EOF > /etc/logrotate.d/cnm
/var/log/cnm/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0666 $APP_USER $APP_USER
    su $APP_USER $APP_USER
}
EOF

echo ">> Configurando Cronjob de Limpeza do Banco de Dados PostgreSQL (1 Mês de Retenção)..."
# Criando um script shell em /etc/cron.weekly/ que faz o curl pra limpar o banco a cada 7 dias batendo no JWT gerado
cat <<EOF > /etc/cron.weekly/cnm-db-prune
#!/bin/bash
curl -X POST http://127.0.0.1:3000/api/admin/system/prune-logs \\
     -H "Authorization: Bearer ${JWT_SECRET}"
EOF
chmod +x /etc/cron.weekly/cnm-db-prune

echo ""
echo "================================================="
echo "   INFRAESTRUTURA E APLICAÇÃO CONCLUÍDAS!        "
echo "================================================="
echo ">> O Banco PostgreSQL local foi totalmente enjaulado na URL gerada."
echo ">> O Administrador Master (Web) foi criado com sucesso:"
echo "   - Email: admin@cnm.local"
echo "   - Senha: (A que você digitou acima)"
echo ""
echo "Tudo PRONTO! Para iniciar a aplicação Node:"
echo "---------------------------------------"
echo "AMBIENTE DE DESENVOLVIMENTO:  "
echo "   npm run dev                "
echo ""
echo "AMBIENTE DE PRODUÇÃO (Cloud):  "
echo "   npm run build              "
echo "   npm run start              "
echo "================================================="
