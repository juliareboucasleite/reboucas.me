const express = require('express');
const {
  lerProdutos,
  salvarProdutos,
  lerConfigGuild,
  atualizarConfigGuild,
  lerLogsAtividade,
  adicionarLogAtividade,
  lerGiveaways,
  removerGiveaway,
  lerForumPosts,
  adicionarForumPost,
} = require('../utils/jsonStore');
const { exigirAdmin } = require('../middleware/isAdmin');
const {
  buildMemberEmbed,
  createBrandFiles,
  getManagedGuild,
  getManagedGuildId,
  listGuildChannels,
  listImageAssets,
  sendPanelLogToDiscord,
  sendCustomEmbed,
} = require('../utils/discordAdmin');
const {
  buildVerifyPanel,
  buildSupportPanel,
  buildPrecosPanel,
  criarSorteio,
  encerrarSorteio,
  listForumChannels,
  postForumThread,
  PAYMENT_KEYS,
} = require('../utils/featureService');

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
    verification: {
      roleId: toText(current.verification?.roleId),
      title: toText(current.verification?.title) || 'verify yourself',
      description:
        toText(current.verification?.description) ||
        'click the button below to unlock the rest of the server (｡•ᴗ•｡)',
      buttonLabel: toText(current.verification?.buttonLabel) || 'verify',
    },
    support: {
      title: toText(current.support?.title) || 'Do you have a question?',
      description:
        toText(current.support?.description) ||
        'If you have any questions, you can open a ticket and ask!\n\nPlease describe your issue and wait for a response.',
      footer: toText(current.support?.footer) || 'Powered by tickets.bot',
      helpButtonLabel: toText(current.support?.helpButtonLabel) || 'Help',
      infoButtonLabel: toText(current.support?.infoButtonLabel) || 'Information',
      helpCategoryId: toText(current.support?.helpCategoryId),
      infoCategoryId: toText(current.support?.infoCategoryId),
      channelId: toText(current.support?.channelId),
    },
    pricing: {
      ticketCategoryId: toText(current.pricing?.ticketCategoryId),
      title: toText(current.pricing?.title) || 'price list · pawshop',
      description:
        toText(current.pricing?.description) ||
        'choose a payment method to open a ticket with the staff.',
      imageAsset: toText(current.pricing?.imageAsset),
      imageUrl: toText(current.pricing?.imageUrl),
      imageAttachment:
        current.pricing?.imageAttachment && typeof current.pricing.imageAttachment === 'object'
          ? {
              name: toText(current.pricing.imageAttachment.name),
              type: toText(current.pricing.imageAttachment.type),
              data: toText(current.pricing.imageAttachment.data),
            }
          : null,
      methods: PAYMENT_KEYS.reduce((acc, k) => {
        const m = current.pricing?.methods?.[k] ?? {};
        acc[k] = {
          enabled: toBool(m.enabled, true),
          label: toText(m.label) || k.charAt(0).toUpperCase() + k.slice(1),
        };
        return acc;
      }, {}),
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
    const guildId = getManagedGuildId(client);
    let guild = null;
    let channels = [];

    try {
      guild = await getManagedGuild(client);
    } catch (err) {
      console.warn('[admin] getManagedGuild falhou:', err.message);
    }

    try {
      channels = await listGuildChannels(client, guildId);
    } catch (err) {
      console.warn('[admin] listGuildChannels falhou:', err.message);
    }

    let images = [];
    try {
      images = listImageAssets();
    } catch (err) {
      console.warn('[admin] listImageAssets falhou:', err.message);
    }

    let settings = null;
    try {
      settings = guildId ? lerConfigGuild(guildId) : null;
    } catch (err) {
      console.warn('[admin] lerConfigGuild falhou:', err.message);
    }

    let logs = [];
    try {
      logs = lerLogsAtividade(40).filter((entry) => !guildId || entry.guildId === guildId);
    } catch (err) {
      console.warn('[admin] lerLogsAtividade falhou:', err.message);
    }

    let products = 0;
    try {
      products = lerProdutos().length;
    } catch (err) {
      console.warn('[admin] lerProdutos falhou:', err.message);
    }

    res.json({
      guild: guild
        ? {
            id: guild.id,
            name: guild.name,
            iconUrl: guild.iconURL?.() ?? null,
            memberCount: guild.memberCount ?? 0,
            roleCount: guild.roles?.cache?.size ?? 0,
          }
        : null,
      stats: {
        products,
        channels: channels.length,
        logs: logs.length,
      },
      channels,
      images,
      settings,
      logs,
    });
  });

  router.get('/images', (req, res) => {
    res.json(listImageAssets());
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
        title: 'Product created',
        message: `${novo.nome} was added to the catalog.`,
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
        title: 'Product updated',
        message: `${produtos[idx].nome} was updated from the panel.`,
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
        title: 'Product removed',
        message: `${removido.nome} was removed from the catalog.`,
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
      title: 'Settings saved',
      message: 'Welcome, bye, channels and appearance were updated.',
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
        title: 'Embed sent',
        message: `Manual embed sent to <#${sent.channelId}>.`,
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
        title: 'Welcome preview sent',
        message: `Preview sent to <#${sent.channelId}>.`,
      });

      res.json({ ok: true, channelId: sent.channelId, messageId: sent.id });
    } catch (error) {
      res.status(400).json({ erro: error.message });
    }
  });

  // ---------- ROLES (helper para o painel de verificação) ----------
  router.get('/roles', async (req, res) => {
    const guild = await getManagedGuild(client);
    if (!guild) return res.json([]);
    await guild.roles.fetch();
    const roles = guild.roles.cache
      .filter((r) => !r.managed && r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({ id: r.id, name: r.name, color: r.hexColor }));
    res.json(roles);
  });

  // ---------- CATEGORIAS (para parent dos tickets) ----------
  router.get('/categories', async (req, res) => {
    const guild = await getManagedGuild(client);
    if (!guild) return res.json([]);
    await guild.channels.fetch();
    const cats = guild.channels.cache
      .filter((ch) => ch.type === 4) // ChannelType.GuildCategory
      .sort((a, b) => a.position - b.position)
      .map((ch) => ({ id: ch.id, name: ch.name }));
    res.json(cats);
  });

  // ---------- VERIFICAÇÃO ----------
  router.post('/verify/post', async (req, res) => {
    try {
      const guildId = getManagedGuildId(client);
      if (!guildId) return res.status(404).json({ erro: 'Guild não configurada.' });

      const channelId = toText(req.body?.channelId);
      if (!channelId) return res.status(400).json({ erro: 'channelId obrigatório.' });

      const guild = await getManagedGuild(client, guildId);
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel?.isTextBased()) return res.status(400).json({ erro: 'Canal inválido.' });

      const config = lerConfigGuild(guildId);
      if (!config.verification?.roleId) {
        return res.status(400).json({ erro: 'Configure um cargo de verificação primeiro.' });
      }

      const sent = await channel.send(buildVerifyPanel(config));
      await registrarLogPainel(req, client, guildId, {
        type: 'verify.posted',
        title: 'Verification panel posted',
        message: `Posted in <#${channelId}>.`,
      });

      res.json({ ok: true, channelId, messageId: sent.id });
    } catch (err) {
      res.status(400).json({ erro: err.message });
    }
  });

  router.post('/support/post', async (req, res) => {
    try {
      const guildId = getManagedGuildId(client);
      if (!guildId) return res.status(404).json({ erro: 'Guild não configurada.' });

      const config = lerConfigGuild(guildId);
      const channelId = toText(req.body?.channelId) || toText(config.support?.channelId);
      if (!channelId) return res.status(400).json({ erro: 'channelId obrigatório.' });

      const guild = await getManagedGuild(client, guildId);
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel?.isTextBased()) return res.status(400).json({ erro: 'Canal inválido.' });

      const sent = await channel.send(buildSupportPanel(config));
      await registrarLogPainel(req, client, guildId, {
        type: 'support.posted',
        title: 'Support panel posted',
        message: `Posted in <#${channelId}>.`,
      });

      res.json({ ok: true, channelId, messageId: sent.id });
    } catch (err) {
      res.status(400).json({ erro: err.message });
    }
  });

  // ---------- PRECOS / TICKETS ----------
  router.post('/precos/post', async (req, res) => {
    try {
      const guildId = getManagedGuildId(client);
      if (!guildId) return res.status(404).json({ erro: 'Guild não configurada.' });

      const channelId = toText(req.body?.channelId);
      if (!channelId) return res.status(400).json({ erro: 'channelId obrigatório.' });

      const guild = await getManagedGuild(client, guildId);
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel?.isTextBased()) return res.status(400).json({ erro: 'Canal inválido.' });

      const config = lerConfigGuild(guildId);
      const panel = buildPrecosPanel(config);
      const sent = await channel.send(panel);
      await registrarLogPainel(req, client, guildId, {
        type: 'precos.posted',
        title: 'Price panel posted',
        message: `Posted in <#${channelId}>.`,
      });
      res.json({ ok: true, channelId, messageId: sent.id });
    } catch (err) {
      res.status(400).json({ erro: err.message });
    }
  });

  // ---------- SORTEIOS ----------
  router.get('/sorteios', (req, res) => {
    const guildId = getManagedGuildId(client);
    const todos = lerGiveaways().filter((s) => !guildId || s.guildId === guildId);
    res.json(todos);
  });

  router.post('/sorteios', async (req, res) => {
    try {
      const guildId = getManagedGuildId(client);
      if (!guildId) return res.status(404).json({ erro: 'Guild não configurada.' });

      const { channelId, premio, vencedores, duracaoMinutos } = req.body ?? {};
      if (!channelId || !premio || !duracaoMinutos) {
        return res.status(400).json({ erro: 'channelId, premio e duracaoMinutos são obrigatórios.' });
      }

      const sorteio = await criarSorteio(client, {
        guildId,
        channelId: toText(channelId),
        premio: toText(premio),
        vencedores: Math.max(1, Number(vencedores) || 1),
        duracaoMs: Math.max(60_000, Number(duracaoMinutos) * 60_000),
        criadoPor: req.session?.usuario?.id,
      });

      await registrarLogPainel(req, client, guildId, {
        type: 'giveaway.created',
        title: 'Giveaway created',
        message: `${sorteio.premio} · ends in ${duracaoMinutos}min`,
      });

      res.status(201).json(sorteio);
    } catch (err) {
      res.status(400).json({ erro: err.message });
    }
  });

  router.post('/sorteios/:id/finalizar', async (req, res) => {
    const id = req.params.id;
    const sorteio = lerGiveaways().find((s) => s.id === id);
    if (!sorteio || sorteio.status !== 'ativo') {
      return res.status(404).json({ erro: 'Sorteio não encontrado ou já encerrado.' });
    }
    const finalizado = await encerrarSorteio(client, sorteio);
    await registrarLogPainel(req, client, getManagedGuildId(client), {
      type: 'giveaway.ended.manual',
      title: 'Giveaway ended from panel',
      message: `${sorteio.premio}`,
    });
    res.json(finalizado);
  });

  router.delete('/sorteios/:id', (req, res) => {
    const ok = removerGiveaway(req.params.id);
    res.json({ ok });
  });

  // ---------- FORUM ----------
  router.get('/forum/channels', async (req, res) => {
    const channels = await listForumChannels(client);
    res.json(channels);
  });

  router.get('/forum/posts', (req, res) => {
    res.json(lerForumPosts(40));
  });

  router.post('/forum/post', async (req, res) => {
    try {
      const guildId = getManagedGuildId(client);
      if (!guildId) return res.status(404).json({ erro: 'Guild não configurada.' });

      const { forumId, title, content, imageUrl, imageAsset, imageAttachment } = req.body ?? {};
      if (!forumId || !title) {
        return res.status(400).json({ erro: 'forumId e title obrigatórios.' });
      }

      const result = await postForumThread(client, {
        guildId,
        forumId: toText(forumId),
        title: toText(title),
        content: toText(content),
        imageUrl: toText(imageUrl),
        imageAsset: toText(imageAsset),
        imageAttachment: imageAttachment && typeof imageAttachment === 'object' ? {
          name: toText(imageAttachment.name),
          type: toText(imageAttachment.type),
          data: toText(imageAttachment.data),
        } : null,
      });

      const entry = adicionarForumPost({
        guildId,
        forumId: toText(forumId),
        title: toText(title),
        threadId: result.threadId,
        url: result.url,
        actor: getActor(req),
      });

      await registrarLogPainel(req, client, guildId, {
        type: 'forum.posted',
        title: 'Forum post created',
        message: `${title} · ${result.url}`,
      });

      res.status(201).json(entry);
    } catch (err) {
      res.status(400).json({ erro: err.message });
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
        title: 'Bye preview sent',
        message: `Preview sent to <#${sent.channelId}>.`,
      });

      res.json({ ok: true, channelId: sent.channelId, messageId: sent.id });
    } catch (error) {
      res.status(400).json({ erro: error.message });
    }
  });

  return router;
}

module.exports = { criarAdminRouter };
