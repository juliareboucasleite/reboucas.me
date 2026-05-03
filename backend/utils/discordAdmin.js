const path = require('node:path');
const {
  AttachmentBuilder,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const {
  adicionarLogAtividade,
  lerConfigGuild,
} = require('./jsonStore');

const IMAGE_DIR = path.join(__dirname, '..', '..', 'frontend', 'images');

function getManagedGuildId(client, fallbackGuildId) {
  if (fallbackGuildId) return String(fallbackGuildId);
  if (process.env.GUILD_ID) return String(process.env.GUILD_ID);
  return client?.guilds?.cache?.first()?.id ?? null;
}

async function getManagedGuild(client, guildId) {
  const id = getManagedGuildId(client, guildId);
  if (!client || !id) return null;
  return client.guilds.cache.get(id) ?? client.guilds.fetch(id).catch(() => null);
}

async function listGuildChannels(client, guildId) {
  const guild = await getManagedGuild(client, guildId);
  if (!guild) return [];

  await guild.channels.fetch();

  return guild.channels.cache
    .filter((channel) =>
      [
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
      ].includes(channel.type),
    )
    .sort((a, b) => a.position - b.position)
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
    }));
}

function channelMention(channelId) {
  return channelId ? `<#${channelId}>` : '`not set`';
}

function renderTemplate(template, vars) {
  return String(template ?? '')
    .replaceAll('{user}', vars.user)
    .replaceAll('{server}', vars.server)
    .replaceAll('{memberCount}', vars.memberCount)
    .replaceAll('{rulesChannel}', vars.rulesChannel)
    .replaceAll('{ticketChannel}', vars.ticketChannel)
    .replaceAll('{pricesChannel}', vars.pricesChannel)
    .replaceAll('{infoChannel}', vars.infoChannel);
}

function createBrandFiles(kind) {
  const mainFile = kind === 'goodbye' ? 'byebye.png' : 'Welcome.png';
  return [
    new AttachmentBuilder(path.join(IMAGE_DIR, mainFile), { name: mainFile }),
    new AttachmentBuilder(path.join(IMAGE_DIR, 'Logo.png'), { name: 'Logo.png' }),
  ];
}

function buildMemberEmbed(kind, guild, user, memberCount, config) {
  const channels = config.channels ?? {};
  const section = kind === 'goodbye' ? config.goodbye : config.welcome;
  const imageName = kind === 'goodbye' ? 'byebye.png' : 'Welcome.png';
  const vars = {
    user: user ? `<@${user.id}>` : '@user',
    server: guild?.name ?? 'Pawshop',
    memberCount: String(memberCount ?? guild?.memberCount ?? 0),
    rulesChannel: channelMention(channels.rulesChannelId),
    ticketChannel: channelMention(channels.ticketChannelId),
    pricesChannel: channelMention(channels.pricesChannelId),
    infoChannel: channelMention(channels.infoChannelId),
  };

  const lines =
    kind === 'goodbye'
      ? [renderTemplate(section.intro, vars), renderTemplate(section.outro, vars)]
      : [
          renderTemplate(section.intro, vars),
          '',
          `🍼 ${vars.ticketChannel}`,
          `🍼 ${vars.pricesChannel}`,
          `🍼 ${vars.infoChannel}`,
        ];

  if (kind !== 'goodbye' && section.verifyLine) {
    lines.push('', renderTemplate(section.verifyLine, vars));
  }

  const embed = new EmbedBuilder()
    .setColor(config.appearance?.accentColor ?? '#f4cfe0')
    .setAuthor({
      name: config.appearance?.authorName ?? '/pawshop',
      iconURL: 'attachment://Logo.png',
    })
    .setTitle(renderTemplate(section.title, vars))
    .setDescription(lines.filter(Boolean).join('\n'))
    .setThumbnail('attachment://Logo.png')
    .setImage(`attachment://${imageName}`)
    .setFooter({
      text: renderTemplate(section.memberCountText, vars),
    });

  return embed;
}

async function sendLifecycleMessage(client, kind, member) {
  const guild = member.guild;
  const config = lerConfigGuild(guild.id);
  const enabled = kind === 'goodbye' ? config.goodbye?.enabled : config.welcome?.enabled;
  const targetChannelId =
    kind === 'goodbye' ? config.channels?.goodbyeChannelId : config.channels?.welcomeChannelId;

  if (!enabled || !targetChannelId) return null;

  const channel = guild.channels.cache.get(targetChannelId) ?? (await guild.channels.fetch(targetChannelId).catch(() => null));
  if (!channel?.isTextBased()) return null;

  const files = createBrandFiles(kind);
  const embed = buildMemberEmbed(kind, guild, member.user, guild.memberCount, config);
  const sent = await channel.send({ embeds: [embed], files });

  adicionarLogAtividade({
    guildId: guild.id,
    type: kind === 'goodbye' ? 'goodbye.sent' : 'welcome.sent',
    source: 'bot',
    title: kind === 'goodbye' ? 'Mensagem de saída enviada' : 'Mensagem de boas-vindas enviada',
    message: `${member.user.tag} em #${channel.name}`,
    meta: {
      userId: member.user.id,
      channelId: channel.id,
    },
  });

  return sent;
}

async function sendPanelLogToDiscord(client, guildId, logEntry) {
  const guild = await getManagedGuild(client, guildId);
  if (!guild) return;

  const config = lerConfigGuild(guild.id);
  const channelId = config.channels?.logsChannelId;
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId).catch(() => null));
  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(config.appearance?.accentColor ?? '#f4cfe0')
    .setTitle(logEntry.title ?? 'Painel administrativo')
    .setDescription(logEntry.message ?? '')
    .addFields(
      { name: 'Origem', value: logEntry.source ?? 'painel', inline: true },
      { name: 'Quando', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
    );

  if (logEntry.actor?.username) {
    embed.addFields({
      name: 'Admin',
      value: `${logEntry.actor.username}${logEntry.actor.id ? ` (${logEntry.actor.id})` : ''}`,
      inline: false,
    });
  }

  await channel.send({ embeds: [embed] }).catch(() => {});
}

function buildCustomEmbed(payload, config) {
  const embed = new EmbedBuilder()
    .setColor(payload.color || config.appearance?.accentColor || '#f4cfe0')
    .setTitle(payload.title || 'Pawshop update')
    .setDescription(payload.description || 'Sem conteudo.')
    .setFooter({
      text: payload.footer || 'Pawshop',
    });

  if (payload.useLogo) embed.setThumbnail('attachment://Logo.png');

  if (payload.imageAsset === 'welcome') embed.setImage('attachment://Welcome.png');
  if (payload.imageAsset === 'goodbye') embed.setImage('attachment://byebye.png');

  return embed;
}

function createEmbedFiles(imageAsset, useLogo) {
  const files = [];

  if (imageAsset === 'welcome') {
    files.push(new AttachmentBuilder(path.join(IMAGE_DIR, 'Welcome.png'), { name: 'Welcome.png' }));
  }
  if (imageAsset === 'goodbye') {
    files.push(new AttachmentBuilder(path.join(IMAGE_DIR, 'byebye.png'), { name: 'byebye.png' }));
  }
  if (useLogo) {
    files.push(new AttachmentBuilder(path.join(IMAGE_DIR, 'Logo.png'), { name: 'Logo.png' }));
  }

  return files;
}

async function sendCustomEmbed(client, guildId, payload) {
  const guild = await getManagedGuild(client, guildId);
  if (!guild) throw new Error('Guild nao encontrada.');

  const config = lerConfigGuild(guild.id);
  const targetChannelId = payload.channelId || config.channels?.embedChannelId;
  if (!targetChannelId) throw new Error('Nenhum canal de embed foi configurado.');

  const channel = guild.channels.cache.get(targetChannelId) ?? (await guild.channels.fetch(targetChannelId).catch(() => null));
  if (!channel?.isTextBased()) throw new Error('Canal invalido para envio de embed.');

  const embed = buildCustomEmbed(payload, config);
  const files = createEmbedFiles(payload.imageAsset, payload.useLogo);
  return channel.send({ embeds: [embed], files });
}

module.exports = {
  buildMemberEmbed,
  createBrandFiles,
  getManagedGuildId,
  getManagedGuild,
  listGuildChannels,
  sendLifecycleMessage,
  sendPanelLogToDiscord,
  sendCustomEmbed,
};
