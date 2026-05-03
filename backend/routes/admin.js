const express = require('express');
const {
  lerProdutos,
  salvarProdutos,
  lerConfigGuild,
  atualizarConfigGuild,
  lerLogsAtividade,
  adicionarLogAtividade,
} = require('../utils/jsonStore');
const { exigirAdmin } = require('../middleware/isAdmin');
const {
  buildMemberEmbed,
  createBrandFiles,
  getManagedGuild,
  getManagedGuildId,
  listGuildChannels,
  sendPanelLogToDiscord,
  sendCustomEmbed,
} = require('../utils/discordAdmin');

function getActor(req) {
  const user = req.session?.usuario;
  if (!user) return null;
  return {
    id: user.id,
    username: user.global_name ?? user.username,
  };
}

function toText(value) {
  return String(value ?? '').trim();
}

function toBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function sanitizeSettings(body) {
  const current = body ?? {};
  return {
    channels: {
      welcomeChannelId: toText(current.channels?.welcomeChannelId),
      goodbyeChannelId: toText(current.channels?.goodbyeChannelId),
      logsChannelId: toText(current.channels?.logsChannelId),
      ticketChannelId: toText(current.channels?.ticketChannelId),
      pricesChannelId: toText(current.channels?.pricesChannelId),
      infoChannelId: toText(current.channels?.infoChannelId),
      rulesChannelId: toText(current.channels?.rulesChannelId),
      embedChannelId: toText(current.channels?.embedChannelId),
    },
    welcome: {
      enabled: toBool(current.welcome?.enabled, true),
      title: toText(current.welcome?.title),
      intro: toText(current.welcome?.intro),
      outro: toText(current.welcome?.outro),
      verifyLine: toText(current.welcome?.verifyLine),
      memberCountText: toText(current.welcome?.memberCountText),
    },
    goodbye: {
      enabled: toBool(current.goodbye?.enabled, true),
      title: toText(current.goodbye?.title),
      intro: toText(current.goodbye?.intro),
      outro: toText(current.goodbye?.outro),
      memberCountText: toText(current.goodbye?.memberCountText),
    },
    appearance: {
      accentColor: toText(current.appearance?.accentColor) || '#f4cfe0',
      authorName: toText(current.appearance?.authorName) || '/pawshop',
    },
  };
}

async function registrarLogPainel(req, client, guildId, log) {
  const entry = adicionarLogAtividade({
    guildId,
    source: 'painel',
    actor: getActor(req),
    ...log,
  });
  await sendPanelLogToDiscord(client, guildId, entry);
  return entry;
}

async function sendPreview(client, guildId, kind, userId, targetChannelId) {
  const guild = await getManagedGuild(client, guildId);
  if (!guild) throw new Error('Guild nao encontrada.');

  const config = lerConfigGuild(guild.id);
  const configChannelId =
    kind === 'goodbye' ? config.channels?.goodbyeChannelId : config.channels?.welcomeChannelId;
  const channelId = targetChannelId || configChannelId;
  if (!channelId) throw new Error('Configure um canal antes de enviar preview.');

  const channel = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId).catch(() => null));
  if (!channel?.isTextBased()) throw new Error('Canal invalido.');

  const member =
    guild.members.cache.get(userId) ??
    (await guild.members.fetch(userId).catch(() => null)) ??
    guild.members.me;
  if (!member) throw new Error('Nao foi possivel montar preview.');

  const files = createBrandFiles(kind);
  const embed = buildMemberEmbed(kind, guild, member.user, guild.memberCount, config);
  return channel.send({ embeds: [embed], files });
}

function criarAdminRouter(client) {
  const router = express.Router();

  router.use(exigirAdmin);

  router.get('/dashboard', async (req, res) => {
    const guild = await getManagedGuild(client);
    const guildId = getManagedGuildId(client);
    const channels = await listGuildChannels(client, guildId);
    const settings = guildId ? lerConfigGuild(guildId) : null;
    const logs = lerLogsAtividade(40).filter((entry) => !guildId || entry.guildId === guildId);

    res.json({
      guild: guild
        ? {
            id: guild.id,
            name: guild.name,
            iconUrl: guild.iconURL(),
            memberCount: guild.memberCount ?? 0,
            roleCount: guild.roles.cache.size,
          }
        : null,
      stats: {
        products: lerProdutos().length,
        channels: channels.length,
        logs: logs.length,
      },
      channels,
      settings,
      logs,
    });
  });

  router.get('/produtos', (req, res) => {
    res.json(lerProdutos());
  });

  router.post('/produtos', async (req, res) => {
    const { nome, categoria, preco, moeda, link, descricao, imagem } = req.body ?? {};
    if (!nome || !categoria || preco === undefined) {
      return res.status(400).json({ erro: 'nome, categoria e preco sao obrigatorios.' });
    }
    const produtos = lerProdutos();
    const novo = {
      id: `${Date.now()}`,
      nome,
      categoria,
      preco: Number(preco),
      moeda: moeda ?? 'robux',
      link: link ?? '',
      descricao: descricao ?? '',
      imagem: imagem ?? '',
    };
    produtos.push(novo);
    salvarProdutos(produtos);

    const guildId = getManagedGuildId(client);
    if (guildId) {
      await registrarLogPainel(req, client, guildId, {
        type: 'catalog.product.created',
        title: 'Produto criado',
        message: `${novo.nome} foi adicionado ao catalogo.`,
      });
    }

    res.status(201).json(novo);
  });

  router.put('/produtos/:id', async (req, res) => {
    const produtos = lerProdutos();
    const idx = produtos.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ erro: 'Produto nao encontrado.' });
    produtos[idx] = { ...produtos[idx], ...req.body, id: produtos[idx].id };
    salvarProdutos(produtos);

    const guildId = getManagedGuildId(client);
    if (guildId) {
      await registrarLogPainel(req, client, guildId, {
        type: 'catalog.product.updated',
        title: 'Produto atualizado',
        message: `${produtos[idx].nome} foi atualizado no painel.`,
      });
    }

    res.json(produtos[idx]);
  });

  router.delete('/produtos/:id', async (req, res) => {
    const produtos = lerProdutos();
    const removido = produtos.find((p) => p.id === req.params.id);
    const restantes = produtos.filter((p) => p.id !== req.params.id);
    if (restantes.length === produtos.length) {
      return res.status(404).json({ erro: 'Produto nao encontrado.' });
    }
    salvarProdutos(restantes);

    const guildId = getManagedGuildId(client);
    if (guildId && removido) {
      await registrarLogPainel(req, client, guildId, {
        type: 'catalog.product.deleted',
        title: 'Produto removido',
        message: `${removido.nome} foi removido do catalogo.`,
      });
    }

    res.json({ ok: true });
  });

  router.get('/settings', (req, res) => {
    const guildId = getManagedGuildId(client);
    if (!guildId) return res.status(404).json({ erro: 'Guild nao configurada.' });
    res.json(lerConfigGuild(guildId));
  });

  router.put('/settings', async (req, res) => {
    const guildId = getManagedGuildId(client);
    if (!guildId) return res.status(404).json({ erro: 'Guild nao configurada.' });

    const settings = atualizarConfigGuild(guildId, sanitizeSettings(req.body));
    await registrarLogPainel(req, client, guildId, {
      type: 'settings.updated',
      title: 'Configuracoes salvas',
      message: 'Welcome, bye, canais e aparencia foram atualizados.',
    });
    res.json(settings);
  });

  router.get('/logs', (req, res) => {
    const guildId = getManagedGuildId(client);
    const logs = lerLogsAtividade(100).filter((entry) => !guildId || entry.guildId === guildId);
    res.json(logs);
  });

  router.post('/embeds/send', async (req, res) => {
    try {
      const guildId = getManagedGuildId(client);
      if (!guildId) return res.status(404).json({ erro: 'Guild nao configurada.' });

      const sent = await sendCustomEmbed(client, guildId, {
        channelId: toText(req.body?.channelId),
        title: toText(req.body?.title),
        description: toText(req.body?.description),
        footer: toText(req.body?.footer),
        color: toText(req.body?.color),
        imageAsset: toText(req.body?.imageAsset),
        useLogo: toBool(req.body?.useLogo, true),
      });

      await registrarLogPainel(req, client, guildId, {
        type: 'embed.sent',
        title: 'Embed enviado',
        message: `Embed manual enviado para <#${sent.channelId}>.`,
      });

      res.json({ ok: true, channelId: sent.channelId, messageId: sent.id });
    } catch (error) {
      res.status(400).json({ erro: error.message });
    }
  });

  router.post('/welcome/preview', async (req, res) => {
    try {
      const guildId = getManagedGuildId(client);
      if (!guildId) return res.status(404).json({ erro: 'Guild nao configurada.' });

      const sent = await sendPreview(
        client,
        guildId,
        'welcome',
        req.session?.usuario?.id,
        toText(req.body?.channelId),
      );

      await registrarLogPainel(req, client, guildId, {
        type: 'welcome.preview.sent',
        title: 'Preview de welcome enviado',
        message: `Preview enviado para <#${sent.channelId}>.`,
      });

      res.json({ ok: true, channelId: sent.channelId, messageId: sent.id });
    } catch (error) {
      res.status(400).json({ erro: error.message });
    }
  });

  router.post('/goodbye/preview', async (req, res) => {
    try {
      const guildId = getManagedGuildId(client);
      if (!guildId) return res.status(404).json({ erro: 'Guild nao configurada.' });

      const sent = await sendPreview(
        client,
        guildId,
        'goodbye',
        req.session?.usuario?.id,
        toText(req.body?.channelId),
      );

      await registrarLogPainel(req, client, guildId, {
        type: 'goodbye.preview.sent',
        title: 'Preview de bye enviado',
        message: `Preview enviado para <#${sent.channelId}>.`,
      });

      res.json({ ok: true, channelId: sent.channelId, messageId: sent.id });
    } catch (error) {
      res.status(400).json({ erro: error.message });
    }
  });

  return router;
}

module.exports = { criarAdminRouter };
