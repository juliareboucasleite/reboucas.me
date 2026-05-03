const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const {
  criarSorteio,
  encerrarSorteio,
} = require('../../backend/utils/featureService');
const { lerGiveaways } = require('../../backend/utils/jsonStore');

function parseDuracao(input) {
  // aceita "10s", "5m", "2h", "1d"
  const m = String(input).trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  const u = m[2] || 'm';
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * mult[u];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sorteio')
    .setDescription('[Admin] Manage giveaways.')
    .addSubcommand((sc) =>
      sc
        .setName('criar')
        .setDescription('Create a new giveaway in this channel.')
        .addStringOption((op) =>
          op.setName('premio').setDescription('What is the prize?').setRequired(true),
        )
        .addStringOption((op) =>
          op
            .setName('duracao')
            .setDescription('How long? e.g. 10m, 2h, 1d')
            .setRequired(true),
        )
        .addIntegerOption((op) =>
          op
            .setName('vencedores')
            .setDescription('How many winners? (default 1)')
            .setMinValue(1)
            .setMaxValue(20),
        ),
    )
    .addSubcommand((sc) =>
      sc
        .setName('finalizar')
        .setDescription('End a giveaway right now and pick winners.')
        .addStringOption((op) =>
          op.setName('id').setDescription('Giveaway ID').setRequired(true),
        ),
    )
    .addSubcommand((sc) => sc.setName('listar').setDescription('List active giveaways.')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') {
      const premio = interaction.options.getString('premio', true);
      const duracaoStr = interaction.options.getString('duracao', true);
      const vencedores = interaction.options.getInteger('vencedores') ?? 1;

      const duracaoMs = parseDuracao(duracaoStr);
      if (!duracaoMs || duracaoMs < 5_000) {
        return interaction.reply({
          content: 'invalid duration. examples: `30s`, `10m`, `2h`, `1d`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        const sorteio = await criarSorteio(client, {
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          premio,
          vencedores,
          duracaoMs,
          criadoPor: interaction.user.id,
        });
        return interaction.reply({
          content: `giveaway created · id \`${sorteio.id}\``,
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        return interaction.reply({
          content: `couldn't create giveaway: ${err.message}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (sub === 'finalizar') {
      const id = interaction.options.getString('id', true);
      const todos = lerGiveaways();
      const sorteio = todos.find((s) => s.id === id);
      if (!sorteio || sorteio.status !== 'ativo') {
        return interaction.reply({
          content: 'giveaway not found or already ended.',
          flags: MessageFlags.Ephemeral,
        });
      }
      await encerrarSorteio(client, sorteio);
      return interaction.reply({
        content: 'giveaway ended ✦',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'listar') {
      const ativos = lerGiveaways().filter(
        (s) => s.status === 'ativo' && s.guildId === interaction.guildId,
      );
      if (ativos.length === 0) {
        return interaction.reply({
          content: 'no active giveaways right now.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const lista = ativos
        .map(
          (s) =>
            `• \`${s.id}\` — **${s.premio}** · ${s.participantes.length} entries · ends <t:${Math.floor(
              new Date(s.termina).getTime() / 1000,
            )}:R>`,
        )
        .join('\n');
      return interaction.reply({ content: lista, flags: MessageFlags.Ephemeral });
    }
  },
};
