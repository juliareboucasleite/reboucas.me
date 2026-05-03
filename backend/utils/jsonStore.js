const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', '..', 'data');
const ARQ_PRODUTOS = path.join(DIR, 'produtos.json');
const ARQ_ADMINS = path.join(DIR, 'admins.json');
const ARQ_DISCORD = path.join(DIR, 'discord.json');

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

function criarConfigPadraoGuild() {
  return {
    channels: {
      welcomeChannelId: '',
      goodbyeChannelId: '',
      logsChannelId: '',
      ticketChannelId: '',
      pricesChannelId: '',
      infoChannelId: '',
      rulesChannelId: '',
      embedChannelId: '',
    },
    welcome: {
      enabled: true,
      title: 'welcome to {server}!',
      intro: '— ————— ૮˶ᵔ ᵕ ᵔ˶ა ————— —',
      outro: '',
      verifyLine: '✦ verify in {rulesChannel} ✦',
      memberCountText: 'we now have {memberCount} members...',
    },
    goodbye: {
      enabled: true,
      title: '୨ bye bye ୧',
      intro: 'it looks like {user} left us :c',
      outro: 'come back soon! 🐾',
      memberCountText: 'we now have {memberCount} members...',
    },
    appearance: {
      accentColor: '#f4cfe0',
      authorName: '/pawshop',
    },
  };
}

function lerDiscordData() {
  return lerJson(ARQ_DISCORD, { guilds: {}, activityLogs: [] });
}

function salvarDiscordData(dados) {
  salvarJson(ARQ_DISCORD, dados);
}

function mergeDeep(base, extra) {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return base;
  const resultado = { ...base };

  for (const [chave, valor] of Object.entries(extra)) {
    if (
      valor &&
      typeof valor === 'object' &&
      !Array.isArray(valor) &&
      resultado[chave] &&
      typeof resultado[chave] === 'object' &&
      !Array.isArray(resultado[chave])
    ) {
      resultado[chave] = mergeDeep(resultado[chave], valor);
    } else {
      resultado[chave] = valor;
    }
  }

  return resultado;
}

function lerConfigGuild(guildId) {
  const dados = lerDiscordData();
  const padrao = criarConfigPadraoGuild();
  return mergeDeep(padrao, dados.guilds?.[String(guildId)] ?? {});
}

function salvarConfigGuild(guildId, config) {
  const dados = lerDiscordData();
  dados.guilds[String(guildId)] = mergeDeep(criarConfigPadraoGuild(), config);
  salvarDiscordData(dados);
  return dados.guilds[String(guildId)];
}

function atualizarConfigGuild(guildId, parcial) {
  const atual = lerConfigGuild(guildId);
  const proximo = mergeDeep(atual, parcial);
  return salvarConfigGuild(guildId, proximo);
}

function lerLogsAtividade(limite = 100) {
  const dados = lerDiscordData();
  return [...(dados.activityLogs ?? [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limite);
}

function adicionarLogAtividade(entry) {
  const dados = lerDiscordData();
  const logs = Array.isArray(dados.activityLogs) ? dados.activityLogs : [];
  logs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  });
  dados.activityLogs = logs.slice(0, 250);
  salvarDiscordData(dados);
  return dados.activityLogs[0];
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
  lerConfigGuild,
  salvarConfigGuild,
  atualizarConfigGuild,
  lerLogsAtividade,
  adicionarLogAtividade,
};
