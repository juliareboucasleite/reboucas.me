const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const path = require('node:path');
const {
  lerConfigGuild,
  lerGiveaways,
  atualizarGiveaway,
  adicionarGiveaway,
  removerGiveaway,
  adicionarLogAtividade,
} = require('./jsonStore');
const { getManagedGuild, getManagedGuildId } = require('./discordAdmin');

const IMAGE_DIR = path.join(__dirname, '..', '..', 'frontend', 'images');
const PAYMENT_KEYS = ['robux', 'paypal', 'wise', 'stripe'];
const PAYMENT_EMOJIS = {
  robux: '💎',
  paypal: '💙',
  wise: '🌍',
  stripe: '💳',
};

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

async function handleVerifyButton(interaction) {
  const config = lerConfigGuild(interaction.guildId);
  const roleId = config.verification?.roleId;
  if (!roleId) {
    return interaction.reply({
      content: 'verification is not set up yet — ask an admin to configure the role in the panel.',
      ephemeral: true,
    });
  }

  const member = interaction.member;
  if (member.roles.cache.has(roleId)) {
    return interaction.reply({ content: "you're already verified, cutie ✿", ephemeral: true });
  }

  try {
    await member.roles.add(roleId, 'Pawshop verification via button');
    await interaction.reply({
      content: '✦ verified successfully! enjoy the server (｡•ᴗ•｡)',
      ephemeral: true,
    });
    adicionarLogAtividade({
      guildId: interaction.guildId,
      type: 'verify.granted',
      source: 'bot',
      title: 'Member verified',
      message: `${interaction.user.tag} clicked verify.`,
      meta: { userId: interaction.user.id, roleId },
    });
  } catch (err) {
    console.error('[verify]', err);
    await interaction.reply({
      content: "couldn't give you the role. ping an admin to check my permissions.",
      ephemeral: true,
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

  const embed = new EmbedBuilder()
    .setColor(config.appearance?.accentColor ?? '#f4cfe0')
    .setTitle(p.title || 'price list · pawshop')
    .setDescription(p.description || 'choose a payment method to open a ticket with the staff.')
    .addFields(
      enabled.map((k) => ({
        name: `${PAYMENT_EMOJIS[k]} ${p.methods?.[k]?.label ?? k}`,
        value: '​',
        inline: true,
      })),
    );

  const buttons = enabled.map((k) =>
    new ButtonBuilder()
      .setCustomId(`paw:precos:${k}`)
      .setLabel(p.methods?.[k]?.label ?? k)
      .setStyle(ButtonStyle.Primary)
      .setEmoji(PAYMENT_EMOJIS[k]),
  );

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }

  return { embeds: [embed], components: rows };
}

async function handlePrecosButton(interaction, method) {
  const config = lerConfigGuild(interaction.guildId);
  const guild = interaction.guild;
  if (!guild) return;

  const methodLabel = config.pricing?.methods?.[method]?.label ?? method;
  const categoryId = config.pricing?.ticketCategoryId;

  await interaction.deferReply({ ephemeral: true });

  try {
    const safeName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
    const channel = await guild.channels.create({
      name: safeName || `ticket-${interaction.user.id.slice(-5)}`,
      type: ChannelType.GuildText,
      parent: categoryId || undefined,
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

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('paw:ticket-close')
        .setLabel('close ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
    );

    const embed = new EmbedBuilder()
      .setColor(config.appearance?.accentColor ?? '#f4cfe0')
      .setTitle(`pricing ticket — ${methodLabel}`)
      .setDescription(
        `hi <@${interaction.user.id}>! ✿\nthis is your private room with the staff.\n\n` +
          `chosen method: **${methodLabel}** ${PAYMENT_EMOJIS[method]}\n\n` +
          `tell us what you'd like to buy (item, roblox link, quantity) and wait for someone to reply.`,
      );

    await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [closeRow] });

    await interaction.editReply({
      content: `ticket opened: <#${channel.id}> — chat with us there ✦`,
    });

    adicionarLogAtividade({
      guildId: guild.id,
      type: 'ticket.opened',
      source: 'bot',
      title: 'Pricing ticket opened',
      message: `${interaction.user.tag} chose ${methodLabel}.`,
      meta: { userId: interaction.user.id, channelId: channel.id, method },
    });
  } catch (err) {
    console.error('[precos]', err);
    await interaction.editReply({
      content: "couldn't create the ticket. ask an admin to check the bot permissions / category.",
    });
  }
}

async function handleTicketClose(interaction) {
  const channel = interaction.channel;
  if (!channel) return;
  await interaction.reply({ content: 'closing the ticket in 5s ⏳' });
  setTimeout(() => channel.delete().catch(() => {}), 5000);
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
    return interaction.reply({ content: "this giveaway isn't active anymore.", ephemeral: true });
  }

  const userId = interaction.user.id;
  if (sorteio.participantes.includes(userId)) {
    return interaction.reply({ content: "you're already entered ✿", ephemeral: true });
  }

  sorteio.participantes.push(userId);
  atualizarGiveaway(sorteio.id, { participantes: sorteio.participantes });

  await interaction.reply({ content: '🎉 entered! good luck ✦', ephemeral: true });

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

async function postForumThread(client, { guildId, forumId, title, content, imageUrl }) {
  const guild = await getManagedGuild(client, guildId);
  if (!guild) throw new Error('Guild não encontrada.');
  const forum = await guild.channels.fetch(forumId).catch(() => null);
  if (!forum || forum.type !== ChannelType.GuildForum) throw new Error('Canal de fórum inválido.');

  const files = [];
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
  handleVerifyButton,
  buildPrecosPanel,
  handlePrecosButton,
  handleTicketClose,
  buildGiveawayPanel,
  handleGiveawayButton,
  encerrarSorteio,
  criarSorteio,
  startGiveawayTimer,
  listForumChannels,
  postForumThread,
};
