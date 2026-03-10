# Guia do Sistema de Atualizações (CNM)

Este documento explica como o recurso de **Atualização (`update.sh`)** do Central Network Manager (CNM) funciona após a as mudanças de arquitetura para "In-Place Swap" e "Update Timelines".

---

## 1. O Conceito de Update (In-Place Swap)

A forma correta para **atualizar** uma implantação de produção antiga do CNM é clonar ou extrair a nova versão em um *diretório temporário*, compilar e, no último momento, o script inverterá as pastas. A versão velha vira backup, e a pasta que você acabou de rodar o comando assume a produção!

Isso permite que a aplicação atual em produção (`/srv/cnm`) só saia do ar nos milissegundos finais do script.

**Padrão Esperado:**
- Produção Ativa: `/srv/cnm`
- Pasta com a Nova Versão: `/tmp/cnm_v2` (Ou qualquer outro diretório aleatório).

---

## 2. Passo a Passo Prático da Atualização

Vamos supor que lançaram a **Versão `0.3.0`** do CNM e o seu provedor/cliente está rodando a **Versão `0.1.0`** no `/srv/cnm`.

### Passo A: Baixe e extraia a nova versão
Usando um zip ou git, coloque o código novo num lugar provisório do servidor:
```bash
cd /tmp
wget http://meu-git.com/cnm_deploy_0.3.0.zip
unzip cnm_deploy_0.3.0.zip
cd cnm_deploy_0.3.0
```

### Passo B: Rode o Update DE DENTRO da pasta nova
Dentro da pasta recém-extraída (`/tmp/cnm_deploy_0.3.0`), rode o atualizador apontando ONDE está a sua produção para ele buscar os dados:

```bash
sudo ./update.sh /srv/cnm
```
*(Dica: se a sua produção for exatamente`/srv/cnm`, o script é inteligente o suficiente para você não precisar passar o argumento final. Apenas `sudo ./update.sh` é o suficiente!)*

**O que o script fará por debaixo dos panos?**
1. **Importação do `.env`:** Ele entra no seu antigo `/srv/cnm`, copia o arquivo de banco/JWTs secreto e joga na pasta atual dele.
2. **Setup:** Vai rodar `npm install` forçando atualizações e baixar todo o mundo novo.
3. **Database Migration Segura:** Usará sua senha roubada do `.env` antigo para atualizar a arquitetura do PostgreSQL do servidor (trazendo novas tabelas, se houver).
4. **Timeline Updates (Mágica!):** O script sabe que você viajou da `0.1.0` para a `0.3.0`! Se a equipe de Dev do CNM tiver deixado arquivos de compatibilidade no `update-scripts/` (ex: `0.2.0.js` conserta um arquivo no disco, converte uma tabela, etc.), eles rodarão automaticamente agora. Dando 100% de segurança a saltos grandes de versão!
5. **Swapt!:** Se tudo acima deu certo, ele finalmente avisa o Node gerencial (PM2): *"Segura ai, vou mudar a pasta"*!
   - Seu `/srv/cnm/` original é renomeado para `/srv/cnm_BACKUP_V_0.1.0_2412....`.
   - O seu repositório atual que compilou super de boas em `/tmp/cnm_deploy_0.3.0` assume a forma do `/srv/cnm/`.
   - O PM2 reinicia no ambiente puro.

---

## 3. Diretório `update-scripts/` para Desenvolvedores

Se você é desenvolvedor e implementou algo que **quebra drasticamente** o banco de clientes não atualizados se eles simplesmente pularem 3 ou 4 *releases* (por exemplo: criptografou uma tabela que era em texto claro):

A pasta `update-scripts/` cuidará disso! Nela você só precisa colocar arquivos pequenos e pontuais nomeando com a versão do pacote (SemVer).

**Exemplo:**
- Você percebeu um bug nos relatórios e precisa alterar dados em massa em um arquivo local ou BD. A versão subirá para a `0.3.1`.
- Crie um arquivo `update-scripts/0.3.1.js` e faça o código NodeJS ou `update-scripts/0.3.1.sh` rodando curl ou apitando alertas.
- Commit a alteração.

Quando o cliente for rodar o Update no servidor dele, o script de timeline detectará sozinho o abismo entre o antigo e ele. Se o script da `0.3.1` cruzar o caminho, ele executará no intervalo!

Leia o `update-scripts/README.md` interno para saber mais.
