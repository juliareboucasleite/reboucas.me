require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const comandos = [];
const pastaBase = path.join(__dirname, '..', 'comandos');

for (const categoria of fs.readdirSync(pastaBase)) {
  const pasta = path.join(pastaBase, categoria);
  if (!fs.statSync(pasta).isDirectory()) continue;
  for (const arquivo of fs.readdirSync(pasta).filter((f) => f.endsWith('.js'))) {
    const comando = require(path.join(pasta, arquivo));
    if (comando?.data) comandos.push(comando.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const idApp = process.env.ID_APLICATIVO;
    const guildId = process.env.GUILD_ID;

    if (guildId) {
      console.log(`Registrando ${comandos.length} comandos na guild ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(idApp, guildId), { body: comandos });
      console.log('Comandos registrados na guild (instantâneo).');
    } else {
      console.log(`Registrando ${comandos.length} comandos globalmente...`);
      await rest.put(Routes.applicationCommands(idApp), { body: comandos });
      console.log('Comandos registrados globalmente (pode levar até 1h para aparecer).');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
