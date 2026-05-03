const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', '..', 'data');
const ARQ_PRODUTOS = path.join(DIR, 'produtos.json');
const ARQ_ADMINS = path.join(DIR, 'admins.json');

function lerJson(caminho, padrao) {
  try {
    const raw = fs.readFileSync(caminho, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') return padrao;
    throw e;
  }
}

function salvarJson(caminho, dados) {
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf8');
}

function lerProdutos() {
  return lerJson(ARQ_PRODUTOS, { produtos: [] }).produtos ?? [];
}

function salvarProdutos(produtos) {
  salvarJson(ARQ_PRODUTOS, { produtos });
}

function lerAdmins() {
  return lerJson(ARQ_ADMINS, { ids: [] }).ids ?? [];
}

function ehAdmin(userId) {
  return lerAdmins().includes(String(userId));
}

module.exports = {
  lerProdutos,
  salvarProdutos,
  lerAdmins,
  ehAdmin,
};
