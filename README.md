# Central Network Manager (CNM)

O **Central Network Manager (CNM)** é uma plataforma centralizada para auxiliar o monitoramento, provisionamento de rede, e centralizar utilitários em um painel administrativo moderno e unificado. Projetado usando Next.js, Prisma e TailwindCSS.

## Requisitos do Sistema

- **Sistema Operacional**: Linux (Ubuntu, Debian, RHEL, CentOS, Fedora, Arch)
- **Acesso Root** (Sudo privileges)
- **Recursos Mínimos**: Conexão com a Internet para baixar pacotes Node/PostgreSQL.

---

## 🚀 Instalação e Implantação Automática

A plataforma CNM foi projetada para ser autossuficiente e vem com um instalador que configura tudo para você, desde a instalação do NodeJS e PostgreSQL, a configuração de banco de dados, geração de segredos (JWT, Senhas), e inicialização dos servidores Node via **PM2**.

### Opção 1: Via Script Interativo (Recomendado)

Na raiz do projeto (como usuário root ou via sudo), execute:

```bash
chmod +x setup.sh
sudo ./setup.sh
```

**Siga os passos na tela**:
1. Escolha entre **Modo Interativo** (Para gerar senhas manualmente) ou **Auto Instalador (Produção)**.
2. Forneça os IPs, Usuários e Senhas de Sistemas como OLT ZTE e Banco UNM2000 (Opcional, preencha para integrar aplicativos terceiros como o Baternap).
3. A instalação fará a configuração do Banco de Dados PostgreSQL, populará os seeds exigidos, registrará logs e configurará cronjobs.
4. Para quem escolheu a **Produção Automática (2)**, ele instalará e iniciará a interface gráfica de forma automatizada via `pm2`, configurando para que funcione mesmo se a máquina reiniciar.

---

## ⚙️ Integrando o Google SSO Corporativo (Opcional)

Durante o `setup.sh` (No Modo Interativo), você poderá inserir suas credenciais do **Google Cloud Console**:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_WORKSPACE_DOMAIN` (Exemplo: @suaempresa.com.br)

Apenas usuários com emails desta empresa conseguirão solicitar acesso instantâneo ao Painel!

---

## 🔄 Manutenção e Atualização

### Atualizações de Repositório

Caso puxe código novo do Git, e queira atualizar o banco de dados sem deletar os dados existentes, execute:

```bash
chmod +x update.sh
sudo ./update.sh
```

Esse script vai:
1. Sincronizar as novas dependências `npm install`.
2. Executar `prisma migrate deploy` rodando as migrações com segurança.
3. Semear ferramentas locais.
4. Rodar o novo build do next e recomendar a atualização contínua do PM2.

### Limpeza Completa / Reset de Fábrica

Se desejar remover inteiramente todos os bancos de dados criados (Apagar tudo!), rodar cronjobs off e sumir com os logs do ambiente CNM original para reinstalar do zero, execute:

```bash
chmod +x clean.sh
sudo ./clean.sh
```

---

## Funcionalidades Core Construídas

- Controle de Acesso Baseado em Grupos e Permissões (Atalhos, Web Apps Locais, Aplicações Ext).
- Aplicativo Baternap Embutido (Monitoramento OLT via BD UNM2000 FiberHome e ZTE).
- Retenção de Logs (Login e Falhas), configurado para ser rotacionado (SystemD logrotate e Limpeza do Banco via /api/admin/system/prune-logs).
- Sistema de Convites Seguro e Links Customizáveis.

*Projeto Desenvolvido visando Infraestruturas Modernas em Provedores de Telecom/ISP.*
