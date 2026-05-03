const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildVerifyPanel } = require('../../backend/utils/featureService');
const { lerConfigGuild } = require('../../backend/utils/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificacao')
    .setDescription('[Admin] Posta o painel de verificação no canal atual.'),
  async execute(interaction) {
    const config = lerConfigGuild(interaction.guildId);
    if (!config.verification?.roleId) {
      return interaction.reply({
        content:
          'configure primeiro o cargo de verificação no painel admin → seção "Verificação".',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.channel.send(buildVerifyPanel(config));
    await interaction.reply({
      content: 'painel de verificação postado ✦',
      flags: MessageFlags.Ephemeral,
    });
  },
};
