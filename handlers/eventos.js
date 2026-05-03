const fs = require('node:fs');
const path = require('node:path');

function carregarEventos(client) {
  const pasta = path.join(__dirname, '..', 'eventos');
  const arquivos = fs.readdirSync(pasta).filter((f) => f.endsWith('.js'));

  for (const arquivo of arquivos) {
    const evento = require(path.join(pasta, arquivo));
    if (!evento?.name || typeof evento.execute !== 'function') {
      console.warn(`[eventos] ignorado: ${arquivo}`);
      continue;
    }
    if (evento.once) {
      client.once(evento.name, (...args) => evento.execute(...args, client));
    } else {
      client.on(evento.name, (...args) => evento.execute(...args, client));
    }
    console.log(`[eventos] carregado ${evento.name}`);
  }
}

module.exports = { carregarEventos };
