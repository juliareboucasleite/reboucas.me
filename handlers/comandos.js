const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');

function carregarComandos(client) {
  client.comandos = new Collection();

  const pastaBase = path.join(__dirname, '..', 'comandos');
  const categorias = fs.readdirSync(pastaBase);

  for (const categoria of categorias) {
    const pasta = path.join(pastaBase, categoria);
    if (!fs.statSync(pasta).isDirectory()) continue;

    const arquivos = fs.readdirSync(pasta).filter((f) => f.endsWith('.js'));
    for (const arquivo of arquivos) {
      const comando = require(path.join(pasta, arquivo));
      if (!comando?.data?.name) {
        console.warn(`[comandos] ignorado: ${categoria}/${arquivo} (sem data.name)`);
        continue;
      }
      comando.categoria = categoria;
      client.comandos.set(comando.data.name, comando);
      console.log(`[comandos] carregado /${comando.data.name} (${categoria})`);
    }
  }
}

module.exports = { carregarComandos };
