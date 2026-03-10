const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// A simple SemVer parser and comparator because we can't guarantee `semver` package is installed globally or in all environments.
// We'll strip any 'v' prefix and non-numeric suffixes for basic comparison.
function parseVersion(v) {
  if (!v) return [0, 0, 0];
  const cleaned = v.replace(/^v/, '').split('-')[0];
  const parts = cleaned.split('.').map(Number);
  while (parts.length < 3) parts.push(0);
  return parts.slice(0, 3).map(n => isNaN(n) ? 0 : n);
}

function compareVersions(v1, v2) {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

async function run() {
  const oldVersion = process.argv[2];
  const newVersion = process.argv[3];
  
  if (!oldVersion || !newVersion) {
    console.error("Uso: node run-timeline-updates.js <OLD_VERSION> <NEW_VERSION>");
    process.exit(1);
  }

  // Se as versões forem iguais, não há nada a fazer no timeline
  if (compareVersions(oldVersion, newVersion) === 0) {
    console.log(`>> Versões iguais (${oldVersion}). Nenhum script de timeline necessário.`);
    return;
  }

  console.log(`>> Verificando scripts de timeline da versão ${oldVersion} para ${newVersion}...`);

  const scriptsDir = path.join(__dirname, '..', 'update-scripts');
  
  if (!fs.existsSync(scriptsDir)) {
    console.log(`>> Diretório '${scriptsDir}' não existe. Pulando timeline updates.`);
    return;
  }

  const files = fs.readdirSync(scriptsDir);
  const scriptsToRun = [];

  for (const file of files) {
    // Expected format: 0.1.1.js or 0.2.0.sh
    const match = file.match(/^v?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)\.(js|sh)$/);
    if (match) {
      const scriptVersion = match[1];
      const ext = match[2];
      
      // We want to run scripts where scriptVersion > oldVersion AND scriptVersion <= newVersion
      if (compareVersions(scriptVersion, oldVersion) > 0 && compareVersions(scriptVersion, newVersion) <= 0) {
        scriptsToRun.push({ file, version: scriptVersion, ext });
      }
    }
  }

  if (scriptsToRun.length === 0) {
    console.log(">> Nenhum script intermediário encontrado para esta faixa de versão.");
    return;
  }

  // Sort ascending by version
  scriptsToRun.sort((a, b) => compareVersions(a.version, b.version));

  console.log(`>> Encontrados ${scriptsToRun.length} script(s) para execução.`);

  for (const script of scriptsToRun) {
    const fullPath = path.join(scriptsDir, script.file);
    console.log(`   -> Executando atualização para versão ${script.version} (${script.file})...`);
    try {
      if (script.ext === 'js') {
        execSync(`node "${fullPath}"`, { stdio: 'inherit' });
      } else if (script.ext === 'sh') {
        execSync(`bash "${fullPath}"`, { stdio: 'inherit' });
      }
      console.log(`   -> Script ${script.file} concluído com sucesso.`);
    } catch (error) {
      console.error(`>> ERRO executando o script ${script.file}. Interrompendo processo de update.`);
      process.exit(1);
    }
  }

  console.log(">> Todos os scripts de timeline aplicados com sucesso.");
}

run().catch(err => {
  console.error("Err:", err);
  process.exit(1);
});
