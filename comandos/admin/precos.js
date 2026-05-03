const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildPrecosPanel } = require('../../backend/utils/featureService');
const { lerConfigGuild } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('precos')
    .setDescription('[Admin] Posta o painel de tabela de preços no canal atual.'),
  async execute(interaction) {
    const config = lerConfigGuild(interaction.guildId);
    await interaction.channel.send(buildPrecosPanel(config));
    await interaction.reply({
      content: 'painel de preços postado ✦',
      flags: MessageFlags.Ephemeral,
    });
  },
};
