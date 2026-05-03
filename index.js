require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { carregarComandos } = require('./handlers/comandos');
const { carregarEventos } = require('./handlers/eventos');
const { criarServidor } = require('./backend/server');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

carregarComandos(client);
carregarEventos(client);

if (!process.env.DISCORD_TOKEN) {
  console.error('[bot] DISCORD_TOKEN não definido no .env');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);

const porta = Number(process.env.PORTA) || 3000;
criarServidor(client).listen(porta, () => {
  console.log(`[web] rodando em http://localhost:${porta}`);
});
