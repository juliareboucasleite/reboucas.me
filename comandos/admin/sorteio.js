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
    .setDescription('[Admin] Gerenciar sorteios.')
    .addSubcommand((sc) =>
      sc
        .setName('criar')
        .setDescription('Cria um novo sorteio neste canal.')
        .addStringOption((op) =>
          op.setName('premio').setDescription('O que é o prêmio?').setRequired(true),
        )
        .addStringOption((op) =>
          op
            .setName('duracao')
            .setDescription('Quanto dura? ex: 10m, 2h, 1d')
            .setRequired(true),
        )
        .addIntegerOption((op) =>
          op
            .setName('vencedores')
            .setDescription('Quantos vencedores? (padrão 1)')
            .setMinValue(1)
            .setMaxValue(20),
        ),
    )
    .addSubcommand((sc) =>
      sc
        .setName('finalizar')
        .setDescription('Finaliza um sorteio agora e sorteia ganhadores.')
        .addStringOption((op) =>
          op.setName('id').setDescription('ID do sorteio').setRequired(true),
        ),
    )
    .addSubcommand((sc) => sc.setName('listar').setDescription('Lista sorteios ativos.')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') {
      const premio = interaction.options.getString('premio', true);
      const duracaoStr = interaction.options.getString('duracao', true);
      const vencedores = interaction.options.getInteger('vencedores') ?? 1;

      const duracaoMs = parseDuracao(duracaoStr);
      if (!duracaoMs || duracaoMs < 5_000) {
        return interaction.reply({
          content: 'duração inválida. exemplos: `30s`, `10m`, `2h`, `1d`.',
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
          content: `sorteio criado · id \`${sorteio.id}\``,
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        return interaction.reply({
          content: `erro ao criar sorteio: ${err.message}`,
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
          content: 'sorteio não encontrado ou já encerrado.',
          flags: MessageFlags.Ephemeral,
        });
      }
      await encerrarSorteio(client, sorteio);
      return interaction.reply({
        content: 'sorteio encerrado ✦',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'listar') {
      const ativos = lerGiveaways().filter(
        (s) => s.status === 'ativo' && s.guildId === interaction.guildId,
      );
      if (ativos.length === 0) {
        return interaction.reply({
          content: 'nenhum sorteio ativo no momento.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const lista = ativos
        .map(
          (s) =>
            `• \`${s.id}\` — **${s.premio}** · ${s.participantes.length} participantes · termina <t:${Math.floor(
              new Date(s.termina).getTime() / 1000,
            )}:R>`,
        )
        .join('\n');
      return interaction.reply({ content: lista, flags: MessageFlags.Ephemeral });
    }
  },
};
