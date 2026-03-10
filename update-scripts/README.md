# Update Scripts Timeline

Este diretório contém scripts sequenciais que são executados quando o sistema for atualizado através do comando `update.sh`.

## Como Funciona

Se a versão anterior do sistema for `0.1.0` e ele for atualizado para `0.3.0`, o `update.sh` verificará nesta pasta se existem scripts com nomes de versões intermediárias ou da versão alvo.

Exemplos de arquivos válidos:
- `0.1.1.js`
- `0.2.0.js`
- `0.3.0.sh`

O atualizador executará o `0.1.1.js`, depois o `0.2.0.js` e por fim o `0.3.0.sh`, garantindo que todas as migrações e injeções de dados ocorram corretamente, sem pular nenhuma etapa intermediária.

## Formatos Suportados
- `.js` : Será executado via `node`
- `.sh` : Será executado via `bash`

Os nomes dos arquivos **devem** seguir o SemVer padrão (ex: `1.0.5.js`), opcionalmente prefixados com `v` (ex: `v1.0.5.js`).

## Como usar o update.sh

O `update.sh` agora foi projetado para ser executado de **dentro da pasta da nova versão baixada** e substituirá a versão antiga de produção de forma rápida e segura. Ele puxará suas chaves e banco da pasta antiga e fará dessa nova pasta a definitiva.

**Passo a passo padrão:**

1. Extraia sua nova versão em uma pasta temporária (Ex: `/tmp/cnm_nova_versao`).
2. Entre na pasta recém extraída:
   ```bash
   cd /tmp/cnm_nova_versao
   ```
3. Execute o script apontando ONDE está a sua versão antiga de produção (por padrão, ele assume `/srv/cnm`):
   ```bash
   sudo ./update.sh
   ```

Se sua produção não esiver em `/srv/cnm`, basta informar o caminho dela como primeiro argumento:
```bash
sudo ./update.sh /var/www/meu-sistema
```

O script cuidará de tudo: copiará o `.env` de configuração, rodará a timeline de migrações, compilará este diretório, fará o backup do diretório de produção antigo (`/srv/cnm_BACKUP...`) e finalmente moverá esta pasta para assumir o lugar na produção.
