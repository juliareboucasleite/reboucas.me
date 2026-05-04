const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', '..', 'data');
const ARQ_PRODUTOS = path.join(DIR, 'produtos.json');
const ARQ_ADMINS = path.join(DIR, 'admins.json');
const ARQ_DISCORD = path.join(DIR, 'discord.json');
const ARQ_GIVEAWAYS = path.join(DIR, 'giveaways.json');
const ARQ_FORUM_LOG = path.join(DIR, 'forumPosts.json');

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
    verification: {
      roleIds: [],
      title: 'verify yourself',
      description: 'click the button below to unlock the rest of the server (｡•ᴗ•｡)',
      buttonLabel: 'verify',
    },
    support: {
      help: {
        title: 'Help',
        description: 'If you need help, open a ticket and explain your issue.',
        footer: 'Powered by tickets.bot',
        buttonLabel: 'Open help ticket',
        categoryId: '',
        channelId: '',
      },
      info: {
        title: 'Information',
        description: 'If you need information, open a ticket and tell us what you want to know.',
        footer: 'Powered by tickets.bot',
        buttonLabel: 'Open information ticket',
        categoryId: '',
        channelId: '',
      },
    },
    pricing: {
      ticketCategoryId: '',
      title: 'price list · pawshop',
      description: 'Choose a payment method below.\n\nEach method opens a ticket where you can speak with our staff.\n\nHave questions? Use the **/help** command.',
      imageAsset: '',
      imageUrl: '',
      imageAttachment: null,
      methods: {
        robux: { enabled: true, label: 'Robux' },
        paypal: { enabled: true, label: 'PayPal' },
        wise: { enabled: true, label: 'Wise' },
        stripe: { enabled: true, label: 'Stripe' },
      },
    },
  };
}

function lerDiscordData() {
  return lerJson(ARQ_DISCORD, { guilds: {}, activityLogs: [], ticketTracking: {} });
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

function lerTicketTracking() {
  const dados = lerDiscordData();
  return dados.ticketTracking ?? {};
}

function salvarTicketTracking(ticketTracking) {
  const dados = lerDiscordData();
  dados.ticketTracking = ticketTracking ?? {};
  salvarDiscordData(dados);
  return dados.ticketTracking;
}

function atualizarTicketTracking(channelId, parcial) {
  const ticketTracking = lerTicketTracking();
  const atual = ticketTracking[String(channelId)] ?? {
    channelId: String(channelId),
    messageCount: 0,
    warnedAt10: false,
    continuityGranted: false,
    kind: '',
    createdBy: '',
  };

  ticketTracking[String(channelId)] = { ...atual, ...parcial, channelId: String(channelId) };
  salvarTicketTracking(ticketTracking);
  return ticketTracking[String(channelId)];
}

function incrementarTicketTracking(channelId, defaults = {}) {
  const atual = atualizarTicketTracking(channelId, defaults);
  const messageCount = Number(atual.messageCount || 0) + 1;
  return atualizarTicketTracking(channelId, { ...defaults, messageCount });
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

// ---------- giveaways ----------
function lerGiveaways() {
  return lerJson(ARQ_GIVEAWAYS, { sorteios: [] }).sorteios ?? [];
}

function salvarGiveaways(sorteios) {
  salvarJson(ARQ_GIVEAWAYS, { sorteios });
}

function adicionarGiveaway(sorteio) {
  const todos = lerGiveaways();
  todos.push(sorteio);
  salvarGiveaways(todos);
  return sorteio;
}

function atualizarGiveaway(id, parcial) {
  const todos = lerGiveaways();
  const idx = todos.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  todos[idx] = { ...todos[idx], ...parcial };
  salvarGiveaways(todos);
  return todos[idx];
}

function removerGiveaway(id) {
  const todos = lerGiveaways();
  const restantes = todos.filter((s) => s.id !== id);
  salvarGiveaways(restantes);
  return todos.length !== restantes.length;
}

// ---------- forum log ----------
function lerForumPosts(limite = 50) {
  return lerJson(ARQ_FORUM_LOG, { posts: [] }).posts.slice(0, limite);
}

function adicionarForumPost(entry) {
  const dados = lerJson(ARQ_FORUM_LOG, { posts: [] });
  dados.posts.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  });
  dados.posts = dados.posts.slice(0, 100);
  salvarJson(ARQ_FORUM_LOG, dados);
  return dados.posts[0];
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
  lerTicketTracking,
  salvarTicketTracking,
  atualizarTicketTracking,
  incrementarTicketTracking,
  lerGiveaways,
  salvarGiveaways,
  adicionarGiveaway,
  atualizarGiveaway,
  removerGiveaway,
  lerForumPosts,
  adicionarForumPost,
};
