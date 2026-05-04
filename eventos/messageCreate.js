const { Events, MessageFlags } = require('discord.js');
const {
  ehAdmin,
  incrementarTicketTracking,
  atualizarTicketTracking,
} = require('../backend/utils/jsonStore');

const ROLE_CONTINUIDADE_ID = '1492998062858174544';

const PREFIXO = '-';

function tokenizar(texto) {
  const tokens = [];
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|\S+/g;

  for (const match of texto.matchAll(regex)) {
    const bruto = match[1] ?? match[0];
    tokens.push(bruto.replace(/\\"/g, '"'));
  }

  return tokens;
}

function parsearChaves(tokens) {
  const valores = {};

  for (const token of tokens) {
    const separador = token.indexOf('=');
    if (separador === -1) continue;

    const chave = token.slice(0, separador).trim().toLowerCase();
    let valor = token.slice(separador + 1).trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    valores[chave] = valor;
  }

  return valores;
}

function criarOptions(commandName, args) {
  if (commandName === 'catalogo') {
    return {
      getString(name) {
        if (name !== 'categoria') return null;
        const primeiro = args[0];
        if (!primeiro) return null;

        const [chave, valor] = primeiro.split('=');
        if (valor && chave.toLowerCase() === 'categoria') return valor;

        return primeiro;
      },
    };
  }

  if (commandName === 'addproduto') {
    const valores = parsearChaves(args);

    return {
      getString(name) {
        const valor = valores[name.toLowerCase()];
        return valor ?? null;
      },
      getInteger(name) {
        const valor = valores[name.toLowerCase()];
        if (valor == null) return null;

        const numero = Number.parseInt(valor, 10);
        return Number.isNaN(numero) ? null : numero;
      },
    };
  }

  return {
    getString() {
      return null;
    },
    getInteger() {
      return null;
    },
  };
}

function normalizarPayload(payload) {
  if (typeof payload === 'string') {
    return { content: payload };
  }

  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const { flags, ephemeral, fetchReply, ...restante } = payload;
  if (ephemeral || flags === MessageFlags.Ephemeral) {
    return { ...restante };
  }

  return { ...restante };
}

function criarContextoMensagem(message, client, commandName, args) {
  const estadoResposta = { ultimaResposta: null };

  return {
    client,
    channel: message.channel,
    guild: message.guild,
    guildId: message.guildId,
    user: message.author,
    member: message.member,
    commandName,
    createdTimestamp: message.createdTimestamp,
    replied: false,
    deferred: false,
    options: criarOptions(commandName, args),
    isChatInputCommand() {
      return true;
    },
    async reply(payload) {
      const resposta = await message.reply(normalizarPayload(payload));
      this.replied = true;
      estadoResposta.ultimaResposta = resposta;
      return payload?.fetchReply ? resposta : undefined;
    },
    async followUp(payload) {
      const resposta = await message.channel.send(normalizarPayload(payload));
      estadoResposta.ultimaResposta = resposta;
      return payload?.fetchReply ? resposta : undefined;
    },
    async editReply(payload) {
      if (!estadoResposta.ultimaResposta) {
        throw new Error('Nenhuma resposta anterior para editar.');
      }

      return estadoResposta.ultimaResposta.edit(normalizarPayload(payload));
    },
    async deferReply() {
      this.deferred = true;
    },
  };
}

function validarPrefixo(commandName, args) {
  if (commandName !== 'addproduto') return null;

  const valores = parsearChaves(args);
  const obrigatorios = ['nome', 'categoria', 'preco'];
  const faltando = obrigatorios.filter((chave) => !valores[chave]);

  if (faltando.length > 0) {
    return 'Uso: `-addproduto nome="Produto" categoria=roupas preco=100 [moeda=robux|brl|eur|usd] [link=https://...] [descricao="..."]`';
  }

  if (Number.isNaN(Number.parseInt(valores.preco, 10))) {
    return 'O campo `preco` precisa ser um número.';
  }

  return null;
}

function lerTipoTicket(channel) {
  const topic = String(channel?.topic || '');
  const match = topic.match(/^pawshop-ticket:([^:]+):/i);
  return match ? match[1].toLowerCase() : '';
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;

    const ticketKind = lerTipoTicket(message.channel);
    if (ticketKind === 'prices') {
      const tracking = incrementarTicketTracking(message.channel.id, {
        kind: ticketKind,
        createdBy: message.channel.topic?.split(':')[2] || '',
      });

      if (tracking.messageCount >= 10 && !tracking.warnedAt10) {
        await message.channel.send(
          `Se quiser dar continuidade, use /continuidade para receber o cargo ${ROLE_CONTINUIDADE_ID}.`,
        ).catch(() => {});
        await atualizarTicketTracking(message.channel.id, { warnedAt10: true });
      }
    }

    if (!message.content.startsWith(PREFIXO)) return;

    const semPrefixo = message.content.slice(PREFIXO.length).trim();
    if (!semPrefixo) return;

    const [commandName, ...args] = tokenizar(semPrefixo);
    if (!commandName) return;

    const comando = client.comandos.get(commandName);
    if (!comando) return;

    if (comando.categoria === 'admin' && !ehAdmin(message.author.id)) {
      await message.reply('Esse comando é restrito aos administradores da Pawshop.');
      return;
    }

    const erroValidacao = validarPrefixo(commandName, args);
    if (erroValidacao) {
      await message.reply(erroValidacao);
      return;
    }

    const contexto = criarContextoMensagem(message, client, commandName, args);

    try {
      await comando.execute(contexto, client);
    } catch (erro) {
      console.error(`[comando -${commandName}]`, erro);
      await message.reply('Algo deu errado ao executar esse comando.');
    }
  },
};