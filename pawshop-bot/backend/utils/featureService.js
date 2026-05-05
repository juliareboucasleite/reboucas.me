const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const path = require('node:path');
const {
  lerConfigGuild,
  lerGiveaways,
  atualizarGiveaway,
  adicionarGiveaway,
  removerGiveaway,
  adicionarLogAtividade,
  atualizarConfigGuild,
  DEFAULT_VERIFY_CHANNEL_ID,
} = require('./jsonStore');
const { createImageFiles, getManagedGuild, getManagedGuildId, resolveImageAssetFilename } = require('./discordAdmin');

const IMAGE_DIR = path.join(__dirname, '..', '..', 'frontend', 'images');
const PAYMENT_KEYS = ['robux', 'paypal', 'wise', 'stripe'];

function buildTicketActionRows(claimedBy = '') {
  const claimed = Boolean(claimedBy);
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('paw:ticket:close')
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('paw:ticket:close-reason')
        .setLabel('Close With Reason')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(claimed ? 'paw:ticket:unclaim' : 'paw:ticket:claim')
        .setLabel(claimed ? 'Unclaim' : 'Claim')
        .setStyle(claimed ? ButtonStyle.Secondary : ButtonStyle.Success),
    ),
  ];
}

function buildSupportPanel(config = {}, kind = 'help') {
  const support = config.support?.[kind] ?? {};
  const embed = new EmbedBuilder()
    .setColor(config.appearance?.accentColor ?? '#f4cfe0')
    .setTitle(support.title || (kind === 'info' ? 'Information' : 'Help'))
    .setDescription(support.description || (kind === 'info' ? 'Tell us what you need to know.' : 'Explain your issue and wait for a response.'))
    .setFooter({ text: support.footer || 'Powered by tickets.bot' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(kind === 'info' ? 'paw:support:info' : 'paw:support:help')
      .setLabel(support.buttonLabel || (kind === 'info' ? 'Open information ticket' : 'Open help ticket'))
      .setStyle(ButtonStyle.Primary),
  );

  return { embeds: [embed], components: [row] };
}

// ============================================================
// VERIFICAÇÃO
// ============================================================
function buildVerifyPanel(config) {
  const v = config.verification ?? {};
  const embed = new EmbedBuilder()
    .setColor(config.appearance?.accentColor ?? '#f4cfe0')
    .setTitle(v.title || 'verify yourself')
    .setDescription(v.description || 'click the button below to unlock the rest of the server (｡•ᴗ•｡)');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('paw:verify')
      .setLabel(v.buttonLabel || 'verify')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🐾'),
  );

  return { embeds: [embed], components: [row] };
}

async function ensureVerifyPanel(client, guildId, requestedChannelId = '') {
  const guild = await getManagedGuild(client, guildId);
  if (!guild) throw new Error('Guild nao encontrada.');

  const config = lerConfigGuild(guildId);
  if (!config.verification?.roleIds || config.verification.roleIds.length === 0) {
    throw new Error('Configure ao menos um cargo de verificacao primeiro.');
  }

  const storedChannelId = String(config.verification?.channelId || '').trim();
  const targetChannelId = String(requestedChannelId || storedChannelId || DEFAULT_VERIFY_CHANNEL_ID).trim();
  if (!targetChannelId) throw new Error('Canal de verificacao nao configurado.');

  const channel = guild.channels.cache.get(targetChannelId) ?? (await guild.channels.fetch(targetChannelId).catch(() => null));
  if (!channel?.isTextBased()) throw new Error('Canal invalido.');

  const panel = buildVerifyPanel(config);
  const storedMessageId = String(config.verification?.messageId || '').trim();
  let sent = null;

  if (storedMessageId) {
    const existingMessage = await channel.messages.fetch(storedMessageId).catch(() => null);
    if (existingMessage) {
      sent = await existingMessage.edit(panel);
    }
  }

  if (!sent) {
    sent = await channel.send(panel);
  }

  const nextConfig = atualizarConfigGuild(guildId, {
    verification: {
      ...(config.verification || {}),
      channelId: channel.id,
      messageId: sent.id,
    },
  });

  return { channel, message: sent, config: nextConfig };
}

async function handleVerifyButton(interaction) {
  const config = lerConfigGuild(interaction.guildId);
  const roleIds = config.verification?.roleIds || [];
  if (!roleIds || roleIds.length === 0) {
    return interaction.reply({
      content: 'verification is not set up yet — ask an admin to configure the roles in the panel.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const member = interaction.member;
  const hasAnyRole = roleIds.some((roleId) => member.roles.cache.has(roleId));
  if (hasAnyRole) {
    return interaction.reply({ content: "you're already verified, cutie ✿", flags: MessageFlags.Ephemeral });
  }

  try {
    await member.roles.add(roleIds, 'Pawshop verification via button');
    await interaction.reply({
      content: '✦ verified successfully! enjoy the server (｡•ᴗ•｡)',
      flags: MessageFlags.Ephemeral,
    });
    adicionarLogAtividade({
      guildId: interaction.guildId,
      type: 'verify.granted',
      source: 'bot',
      title: 'Member verified',
      message: `${interaction.user.tag} clicked verify and received ${roleIds.length} role(s).`,
      meta: { userId: interaction.user.id, roleIds },
    });
  } catch (err) {
    console.error('[verify]', err);
    await interaction.reply({
      content: "couldn't give you the role. ping an admin to check my permissions.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

// ============================================================
// PRECOS / TICKET
// ============================================================
function listMethodsEnabled(config) {
  const methods = config.pricing?.methods ?? {};
  return PAYMENT_KEYS.filter((k) => methods[k]?.enabled !== false);
}

function buildPrecosPanel(config) {
  const p = config.pricing ?? {};
  const enabled = listMethodsEnabled(config);
  const files = createImageFiles(p.imageAsset);
  if (files.length === 0 && p.imageAttachment?.data) {
    files.push(
      new AttachmentBuilder(Buffer.from(p.imageAttachment.data, 'base64'), {
        name: p.imageAttachment.name || 'pawshop-prices.png',
      }),
    );
  }
  const imageFilename = resolveImageAssetFilename(p.imageAsset) || p.imageAttachment?.name || null;

  const embed = new EmbedBuilder()
    .setColor(config.appearance?.accentColor ?? '#f4cfe0')
    .setTitle(p.title || 'price list · pawshop')
    .setDescription(p.description || 'Choose a payment method below.\n\nEach method opens a ticket where you can speak with our staff.\n\nHave questions? Use the **/help** command.')
    .addFields(
      enabled.map((k) => ({
        name: p.methods?.[k]?.label ?? k,
        value: '​',
        inline: true,
      })),
    );

  if (files.length > 0 && imageFilename) {
    embed.setImage(`attachment://${imageFilename}`);
  } else if (p.imageUrl) {
    embed.setImage(p.imageUrl);
  }

  const buttons = enabled.map((k) =>
    new ButtonBuilder()
      .setCustomId(`paw:precos:${k}`)
      .setLabel(p.methods?.[k]?.label ?? k)
      .setStyle(ButtonStyle.Primary),
  );

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }

  return { embeds: [embed], components: rows, files };
}

async function createTicketChannel(interaction, { title, description, logType, logTitle, logMessage, topicLabel, ticketKind = 'support', categoryId }) {
  const config = lerConfigGuild(interaction.guildId);
  const guild = interaction.guild;
  if (!guild) return null;

  const targetCategoryId = categoryId || config.pricing?.ticketCategoryId;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const safeName = `help-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
    const channel = await guild.channels.create({
      name: safeName || `help-${interaction.user.id.slice(-5)}`,
      type: ChannelType.GuildText,
      topic: `pawshop-ticket:${ticketKind}:${interaction.user.id}`,
      parent: targetCategoryId || undefined,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setColor(config.appearance?.accentColor ?? '#f4cfe0')
      .setTitle(title)
      .setDescription(description);

    await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: buildTicketActionRows() });

    await interaction.editReply({
      content: `help ticket opened: <#${channel.id}> — chat with us there ✦`,
    });

    adicionarLogAtividade({
      guildId: guild.id,
      type: logType,
      source: 'bot',
      title: logTitle,
      message: logMessage,
      meta: { userId: interaction.user.id, channelId: channel.id, topicLabel, ticketKind },
    });

    return channel;
  } catch (err) {
    console.error('[ticket]', err);
    await interaction.editReply({
      content: "couldn't create the ticket. ask an admin to check the bot permissions / category.",
    });
    return null;
  }
}

async function handleSupportOpenButton(interaction) {
  return createTicketChannel(interaction, {
    title: 'Help /pawshop',
    description:
      'Thank you for contacting support.\nPlease describe your issue and wait for a response.',
    topicLabel: 'help',
    ticketKind: 'help',
    logType: 'support.help.opened',
    logTitle: 'Help ticket opened',
    logMessage: `${interaction.user.tag} opened a help ticket.`,
    categoryId: lerConfigGuild(interaction.guildId).support?.helpCategoryId,
  });
}

async function handleSupportInfoButton(interaction) {
  return createTicketChannel(interaction, {
    title: 'Information /pawshop',
    description:
      'Thanks for reaching out.\nPlease share what information you need and wait for a response.',
    topicLabel: 'information',
    ticketKind: 'info',
    logType: 'support.info.opened',
    logTitle: 'Information ticket opened',
    logMessage: `${interaction.user.tag} opened an information ticket.`,
    categoryId: lerConfigGuild(interaction.guildId).support?.infoCategoryId,
  });
}

async function handlePrecosButton(interaction, method) {
  const config = lerConfigGuild(interaction.guildId);
  const methodLabel = config.pricing?.methods?.[method]?.label ?? method;

  return createTicketChannel(interaction, {
    title: `help ticket — ${methodLabel}`,
    description:
      `hi <@${interaction.user.id}>! ✿\nthis is your help ticket with the staff.\n\n` +
      `topic: **${methodLabel}**\n\n` +
      'send your question or what you need help with, and wait for someone to reply.',
    topicLabel: methodLabel,
    ticketKind: 'prices',
    logType: 'ticket.opened',
    logTitle: 'Help ticket opened',
    logMessage: `${interaction.user.tag} chose ${methodLabel}.`,
  });
}

async function handleTicketClose(interaction) {
  const channel = interaction.channel;
  if (!channel) return;
  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({ content: 'closing the ticket in 5s ⏳', flags: MessageFlags.Ephemeral }).catch(() => {});
  }
  setTimeout(() => channel.delete().catch(() => {}), 5000);
}

async function handleTicketClaim(interaction, claimed = true) {
  if (!interaction.message) return;

  await interaction.message.edit({
    components: buildTicketActionRows(claimed ? interaction.user.username : ''),
  });

  if (interaction.channel?.setTopic) {
    await interaction.channel.setTopic(claimed ? `Claimed by ${interaction.user.tag}` : '').catch(() => {});
  }

  await interaction.reply({
    content: claimed ? `Ticket claimed by ${interaction.user.tag}.` : 'Ticket unclaimed.',
    flags: MessageFlags.Ephemeral,
  });
}

async function handleTicketCloseWithReason(interaction) {
  const modal = new ModalBuilder().setCustomId('paw:ticket:close-reason-modal').setTitle('Close Ticket');

  const reasonInput = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('Reason')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Reason for closing the ticket, e.g. "Resolved"')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
  await interaction.showModal(modal);
}

async function handleTicketCloseReasonModal(interaction) {
  const reason = interaction.fields.getTextInputValue('reason')?.trim() || 'No reason specified';

  await interaction.reply({ content: 'Ticket will be closed in 5 seconds.', flags: MessageFlags.Ephemeral }).catch(() => {});

  if (interaction.channel?.send) {
    await interaction.channel.send({
      content: `Ticket closed by <@${interaction.user.id}>. Reason: **${reason}**`,
    }).catch(() => {});
  }

  setTimeout(() => interaction.channel?.delete().catch(() => {}), 5000);
}

// ============================================================
// SORTEIOS
// ============================================================
function buildGiveawayEmbed(sorteio, config, status = 'ativo') {
  const accent = config.appearance?.accentColor ?? '#f4cfe0';
  const embed = new EmbedBuilder()
    .setColor(accent)
    .setTitle(`🎉 giveaway · ${sorteio.premio}`);

  if (status === 'ativo') {
    embed
      .setDescription(
        `click the button to enter!\n\n**winners:** ${sorteio.vencedores}\n**ends:** <t:${Math.floor(
          new Date(sorteio.termina).getTime() / 1000,
        )}:R>\n**entries:** ${sorteio.participantes.length}`,
      )
      .setFooter({ text: `id · ${sorteio.id}` });
  } else if (status === 'encerrado') {
    const lista = (sorteio.ganhadores ?? []).map((id) => `<@${id}>`).join(', ');
    embed
      .setDescription(
        `**ended!**\n\n${
          lista ? `congrats ${lista} ✿` : 'nobody entered this giveaway :('
        }\n\n${sorteio.participantes.length} entered.`,
      )
      .setFooter({ text: `ended · id ${sorteio.id}` });
  }

  return embed;
}

function buildGiveawayPanel(sorteio, config) {
  const embed = buildGiveawayEmbed(sorteio, config, 'ativo');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`paw:gw:${sorteio.id}`)
      .setLabel('enter')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎉'),
  );
  return { embeds: [embed], components: [row] };
}

async function handleGiveawayButton(interaction, sorteioId) {
  const todos = lerGiveaways();
  const sorteio = todos.find((s) => s.id === sorteioId);
  if (!sorteio || sorteio.status !== 'ativo') {
    return interaction.reply({ content: "this giveaway isn't active anymore.", flags: MessageFlags.Ephemeral });
  }

  const userId = interaction.user.id;
  if (sorteio.participantes.includes(userId)) {
    return interaction.reply({ content: "you're already entered ✿", flags: MessageFlags.Ephemeral });
  }

  sorteio.participantes.push(userId);
  atualizarGiveaway(sorteio.id, { participantes: sorteio.participantes });

  await interaction.reply({ content: '🎉 entered! good luck ✦', flags: MessageFlags.Ephemeral });

  // atualiza embed com novo total
  try {
    const config = lerConfigGuild(interaction.guildId);
    const message = await interaction.message.fetch();
    await message.edit(buildGiveawayPanel(sorteio, config));
  } catch (_) {
    /* mensagem deletada — ok */
  }
}

function pickWinners(sorteio) {
  const pool = [...sorteio.participantes];
  const winners = [];
  const n = Math.min(sorteio.vencedores, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

async function encerrarSorteio(client, sorteio) {
  const guild = await getManagedGuild(client, sorteio.guildId);
  if (!guild) return null;

  const ganhadores = pickWinners(sorteio);
  const atualizado = atualizarGiveaway(sorteio.id, {
    status: 'encerrado',
    ganhadores,
    encerradoEm: new Date().toISOString(),
  });

  try {
    const channel = await guild.channels.fetch(sorteio.channelId).catch(() => null);
    if (channel?.isTextBased()) {
      const config = lerConfigGuild(guild.id);
      const embed = buildGiveawayEmbed(atualizado, config, 'encerrado');
      const message = await channel.messages.fetch(sorteio.messageId).catch(() => null);
      if (message) await message.edit({ embeds: [embed], components: [] });

      const mention = ganhadores.map((id) => `<@${id}>`).join(', ');
      await channel.send({
        content: ganhadores.length
          ? `🎉 congrats ${mention}! you won **${sorteio.premio}** — DM the staff to claim.`
          : `the **${sorteio.premio}** giveaway ended with no entries :(`,
      });
    }
  } catch (err) {
    console.error('[giveaway encerrar]', err);
  }

  adicionarLogAtividade({
    guildId: sorteio.guildId,
    type: 'giveaway.ended',
    source: 'bot',
    title: 'Giveaway ended',
    message: `${sorteio.premio} · ${ganhadores.length} winner(s)`,
    meta: { sorteioId: sorteio.id, ganhadores },
  });

  return atualizado;
}

function startGiveawayTimer(client) {
  setInterval(async () => {
    const ativos = lerGiveaways().filter((s) => s.status === 'ativo');
    const agora = Date.now();
    for (const s of ativos) {
      if (new Date(s.termina).getTime() <= agora) {
        await encerrarSorteio(client, s);
      }
    }
  }, 30 * 1000);
}

async function criarSorteio(client, { guildId, channelId, premio, vencedores, duracaoMs, criadoPor }) {
  const guild = await getManagedGuild(client, guildId);
  if (!guild) throw new Error('Guild não encontrada.');
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) throw new Error('Canal inválido.');

  const sorteio = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    guildId: guild.id,
    channelId,
    messageId: '',
    premio,
    vencedores: Math.max(1, Number(vencedores) || 1),
    criadoEm: new Date().toISOString(),
    termina: new Date(Date.now() + duracaoMs).toISOString(),
    participantes: [],
    ganhadores: [],
    status: 'ativo',
    criadoPor: criadoPor ?? '',
  };

  const config = lerConfigGuild(guild.id);
  const message = await channel.send(buildGiveawayPanel(sorteio, config));
  sorteio.messageId = message.id;
  adicionarGiveaway(sorteio);
  return sorteio;
}

// ============================================================
// FORUM POSTER
// ============================================================
async function listForumChannels(client, guildId) {
  const guild = await getManagedGuild(client, guildId);
  if (!guild) return [];
  await guild.channels.fetch();
  return guild.channels.cache
    .filter((ch) => ch.type === ChannelType.GuildForum)
    .sort((a, b) => a.position - b.position)
    .map((ch) => ({ id: ch.id, name: ch.name }));
}

async function postForumThread(client, { guildId, forumId, title, content, imageUrl, imageAsset, imageAttachment }) {
  const guild = await getManagedGuild(client, guildId);
  if (!guild) throw new Error('Guild não encontrada.');
  const forum = await guild.channels.fetch(forumId).catch(() => null);
  if (!forum || forum.type !== ChannelType.GuildForum) throw new Error('Canal de fórum inválido.');

  const files = [];
  files.push(...createImageFiles(imageAsset));
  if (imageAttachment?.data) {
    try {
      files.push(
        new AttachmentBuilder(Buffer.from(imageAttachment.data, 'base64'), {
          name: imageAttachment.name || 'pawshop-post.png',
        }),
      );
    } catch (_) {
      /* ignora se o anexo local for inválido */
    }
  }
  if (imageUrl) {
    try {
      files.push(new AttachmentBuilder(imageUrl, { name: 'pawshop-post.png' }));
    } catch (_) {
      /* ignora se imageUrl for inválida */
    }
  }

  const thread = await forum.threads.create({
    name: title.slice(0, 100),
    message: {
      content: content || '✿',
      files,
    },
  });

  return { threadId: thread.id, url: thread.url };
}

module.exports = {
  PAYMENT_KEYS,
  buildVerifyPanel,
  ensureVerifyPanel,
  handleVerifyButton,
  buildSupportPanel,
  buildPrecosPanel,
  handleSupportOpenButton,
  handleSupportInfoButton,
  handlePrecosButton,
  handleTicketClose,
  handleTicketClaim,
  handleTicketCloseWithReason,
  handleTicketCloseReasonModal,
  buildGiveawayPanel,
  handleGiveawayButton,
  encerrarSorteio,
  criarSorteio,
  startGiveawayTimer,
  listForumChannels,
  postForumThread,
};
